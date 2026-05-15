const InvalidacionReservasService = require("../../../src/domain/services/InvalidacionReservasService");
const ReservaPolicy               = require("../../../src/domain/policies/ReservaPolicy");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Fecha futura con más de 24h de antelación
function fechaFutura(diasOffset = 5) {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  // Evitar fin de semana
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function crearReserva(overrides = {}) {
  const fecha = fechaFutura();
  return {
    id:         1,
    usuarioId:  1,
    fecha,
    horaInicio: "10:00",
    horaFin:    "11:00",
    duracion:   60,
    estado:     "aceptada",
    espacios:   [{ espacioId: 5344, numPersonas: 5 }],
    cancelar:   jest.fn(),
    ...overrides,
  };
}

function crearUsuario(overrides = {}) {
  return {
    id:             1,
    rol:            "docente_investigador",
    departamentoId: 1,
    ...overrides,
  };
}

function crearEspacio(overrides = {}) {
  return {
    gid:              5344,
    categoria:        "laboratorio",
    departamentoId:   1,
    usuariosAsignados: [],
    estaAsignadoA:    () => false,
    ...overrides,
  };
}

function crearRepositorios(reservas = [], overrides = {}) {
  return {
    reservaRepository: {
      findVivasPorEspacio: jest.fn().mockResolvedValue(reservas),
      findByUsuario:       jest.fn().mockResolvedValue(reservas),
      save:                jest.fn().mockResolvedValue(null),
      ...overrides.reservaRepository,
    },
    usuarioRepository: {
      findById: jest.fn().mockResolvedValue(crearUsuario()),
      ...overrides.usuarioRepository,
    },
    espacioRepository: {
      findById: jest.fn().mockResolvedValue(crearEspacio()),
      ...overrides.espacioRepository,
    },
    notificacionRepository: {
      save: jest.fn().mockResolvedValue(null),
      ...overrides.notificacionRepository,
    },
  };
}

const payloadBase = {
  espacioId:            5344,
  nuevaReservable:      true,
  nuevaCategoria:       "laboratorio",
  deptEspacioId:        1,
  asignadoAInvVisitante: false,
  nuevoHorarioApertura: null,
  nuevoHorarioCierre:   null,
  nuevoPorcentaje:      null,
  aforo:                20,
  ReservaPolicy,
};

// ─────────────────────────────────────────────
// TESTS — invalidarSiProcede
// ─────────────────────────────────────────────

describe("InvalidacionReservasService.invalidarSiProcede", () => {

  // ─────────────────────────────────────────────
  // SIN RESERVAS
  // ─────────────────────────────────────────────
  describe("Sin reservas", () => {
    test("devuelve array vacío si no hay reservas vivas", async () => {
      const service = new InvalidacionReservasService();
      const repos   = crearRepositorios([]);
      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        ...repos,
      });
      expect(resultado).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // RESPETA REGLA DE 24H
  // ─────────────────────────────────────────────
  describe("Respeta regla de 24h", () => {
    test("no cancela reservas con menos de 24h de antelación", async () => {
      const ahora  = new Date();
      const fechaHoy = ahora.toISOString().split("T")[0];
      const reserva = crearReserva({ fecha: fechaHoy, horaInicio: "10:00" });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevaReservable: false,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // CASO 1 — ESPACIO NO RESERVABLE
  // ─────────────────────────────────────────────
  describe("Caso 1 — espacio no reservable", () => {
    test("cancela reserva si el espacio pasa a no reservable", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevaReservable: false,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
      expect(repos.reservaRepository.save).toHaveBeenCalled();
    });

    test("crea notificación al cancelar", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      await service.invalidarSiProcede({
        ...payloadBase,
        nuevaReservable: false,
        ...repos,
      });

      expect(repos.notificacionRepository.save).toHaveBeenCalled();
    });

    test("no cancela si el espacio sigue siendo reservable", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevaReservable: true,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // CASO 2 — PORCENTAJE DE OCUPACIÓN
  // ─────────────────────────────────────────────
  describe("Caso 2 — porcentaje de ocupación", () => {
    test("cancela reserva si numPersonas supera el aforo con nuevo porcentaje", async () => {
      // aforo 20 al 10% → 2 plazas, reserva con 5 personas → cancela
      const reserva = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: 5 }] });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoPorcentaje: 10,
        aforo:           20,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("no cancela si numPersonas cabe en el nuevo aforo", async () => {
      // aforo 20 al 50% → 10 plazas, reserva con 5 personas → no cancela
      const reserva = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: 5 }] });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoPorcentaje: 50,
        aforo:           20,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });

    test("no cancela si numPersonas es null", async () => {
      const reserva = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoPorcentaje: 10,
        aforo:           20,
        ...repos,
      });

      expect(resultado).toEqual([]);
    });

    test("aplica Math.ceil al calcular aforo permitido", async () => {
      // aforo 3 al 50% → Math.ceil(1.5) = 2 plazas, reserva con 2 personas → no cancela
      const reserva = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: 2 }] });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoPorcentaje: 50,
        aforo:           3,
        ...repos,
      });

      expect(resultado).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // CASO 3 — HORARIO
  // ─────────────────────────────────────────────
  describe("Caso 3 — horario", () => {
    test("cancela reserva si horaInicio queda antes de la nueva apertura", async () => {
      const reserva = crearReserva({ horaInicio: "08:00", horaFin: "09:00" });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoHorarioApertura: "09:00",
        nuevoHorarioCierre:   "20:00",
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("cancela reserva si horaFin queda después del nuevo cierre", async () => {
      const reserva = crearReserva({ horaInicio: "19:00", horaFin: "20:30" });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoHorarioApertura: "08:00",
        nuevoHorarioCierre:   "20:00",
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("no cancela si la reserva cabe en el nuevo horario", async () => {
      const reserva = crearReserva({ horaInicio: "10:00", horaFin: "11:00" });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoHorarioApertura: "08:00",
        nuevoHorarioCierre:   "20:00",
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // CASO 4 — POLÍTICA DE RESERVA
  // ─────────────────────────────────────────────
  describe("Caso 4 — política de reserva", () => {
    test("cancela reserva si el usuario ya no puede reservar la categoría", async () => {
      // Estudiante no puede reservar laboratorio
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva], {
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "estudiante", departamentoId: null })),
        },
      });
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("no cancela si el usuario puede seguir reservando", async () => {
      // Docente INF puede reservar lab INF
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });

    test("cancela si el usuario no tiene rol", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva], {
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: null, departamentoId: null })),
        },
      });
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        ...repos,
      });

      expect(resultado).toContain(1);
    });

    test("omite la reserva si el usuario no existe", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva], {
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(null),
        },
      });
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        ...repos,
      });

      expect(resultado).toEqual([]);
    });

    test("cancela si cambia departamento del espacio y usuario ya no tiene acceso", async () => {
      // Docente INF no puede reservar lab ELEC
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        deptEspacioId: 2, // ELEC
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // MÚLTIPLES RESERVAS
  // ─────────────────────────────────────────────
  describe("Múltiples reservas", () => {
    test("cancela todas las reservas afectadas", async () => {
      const r1 = crearReserva({ id: 1 });
      const r2 = crearReserva({ id: 2 });
      const repos = crearRepositorios([r1, r2]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevaReservable: false,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(resultado).toContain(2);
      expect(resultado).toHaveLength(2);
      expect(r1.cancelar).toHaveBeenCalled();
      expect(r2.cancelar).toHaveBeenCalled();
    });

    test("cancela solo las reservas afectadas y no las que caben", async () => {
      // r1 con 15 personas y r2 con 2 personas, aforo 20 al 10% → 2 plazas
      const r1 = crearReserva({ id: 1, espacios: [{ espacioId: 5344, numPersonas: 15 }] });
      const r2 = crearReserva({ id: 2, espacios: [{ espacioId: 5344, numPersonas: 2 }] });
      const repos = crearRepositorios([r1, r2]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarSiProcede({
        ...payloadBase,
        nuevoPorcentaje: 10,
        aforo:           20,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(resultado).not.toContain(2);
      expect(r1.cancelar).toHaveBeenCalled();
      expect(r2.cancelar).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────
// TESTS — invalidarPorCambioUsuario
// ─────────────────────────────────────────────

describe("InvalidacionReservasService.invalidarPorCambioUsuario", () => {

  const payloadCambioUsuario = {
    usuarioId:          1,
    nuevoRol:           "docente_investigador",
    nuevoDepartamentoId: 1,
    ReservaPolicy,
  };

  describe("Sin reservas", () => {
    test("devuelve array vacío si no hay reservas activas", async () => {
      const service = new InvalidacionReservasService();
      const repos   = crearRepositorios([]);

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        ...repos,
      });

      expect(resultado).toEqual([]);
    });
  });

  describe("Respeta regla de 24h", () => {
    test("no cancela reservas con menos de 24h de antelación", async () => {
      const ahora    = new Date();
      const fechaHoy = ahora.toISOString().split("T")[0];
      const reserva  = crearReserva({ fecha: fechaHoy, horaInicio: "10:00" });
      const repos    = crearRepositorios([reserva]);
      const service  = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoRol: "estudiante",
        nuevoDepartamentoId: null,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  describe("Cancela por cambio de departamento", () => {
    test("cancela reserva de lab INF si usuario cambia a dpto ELEC", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoDepartamentoId: 2, // ELEC — no puede acceder a lab INF
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("no cancela si el usuario sigue teniendo acceso", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoDepartamentoId: 1, // INF — sigue teniendo acceso
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  describe("Cancela por cambio de rol", () => {
    test("cancela reserva de lab si usuario pasa a estudiante", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoRol:            "estudiante",
        nuevoDepartamentoId: null,
        ...repos,
      });

      expect(resultado).toContain(1);
      expect(reserva.cancelar).toHaveBeenCalled();
    });

    test("crea notificación al cancelar", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoRol:            "estudiante",
        nuevoDepartamentoId: null,
        ...repos,
      });

      expect(repos.notificacionRepository.save).toHaveBeenCalled();
    });
  });

  describe("Ignora reservas canceladas", () => {
    test("no procesa reservas con estado distinto de aceptada", async () => {
      const reserva = crearReserva({ estado: "cancelada" });
      const repos   = crearRepositorios([reserva]);
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        nuevoRol:            "estudiante",
        nuevoDepartamentoId: null,
        ...repos,
      });

      expect(resultado).toEqual([]);
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });

  describe("Omite espacios no encontrados", () => {
    test("no lanza error si el espacio de una reserva no existe", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios([reserva], {
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(null),
        },
      });
      const service = new InvalidacionReservasService();

      const resultado = await service.invalidarPorCambioUsuario({
        ...payloadCambioUsuario,
        ...repos,
      });

      expect(resultado).toEqual([]);
    });
  });
});