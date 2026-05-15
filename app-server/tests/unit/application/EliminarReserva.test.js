const EliminarReserva = require("../../../src/application/use-cases/EliminarReserva");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function fechaFutura(diasOffset = 5) {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function crearReserva(overrides = {}) {
  return {
    id:         1,
    usuarioId:  1,
    fecha:      fechaFutura(),
    horaInicio: "10:00",
    horaFin:    "11:00",
    estado:     "aceptada",
    estaActiva: jest.fn().mockReturnValue(true),
    cancelar:   jest.fn(),
    ...overrides,
  };
}

function crearRepositorios(reserva, overrides = {}) {
  return {
    reservaRepository: {
      findById: jest.fn().mockResolvedValue(reserva),
      save:     jest.fn().mockResolvedValue(null),
      ...overrides.reservaRepository,
    },
    notificacionRepository: {
      save: jest.fn().mockResolvedValue(null),
      ...overrides.notificacionRepository,
    },
  };
}

function crearCasoDeUso(reserva, overrides = {}) {
  const repos = crearRepositorios(reserva, overrides);
  return new EliminarReserva(repos);
}

const payloadBase = { reservaId: 1, usuarioId: 1, esGerente: true };

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("EliminarReserva", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS — GERENTE
  // ─────────────────────────────────────────────
  describe("Casos válidos — gerente", () => {
    test("gerente elimina reserva correctamente", async () => {
      const reserva   = crearReserva();
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(reserva.cancelar).toHaveBeenCalled();
      expect(resultado.eliminada).toBe(true);
    });

    test("gerente puede eliminar reserva de otro usuario", async () => {
      const reserva   = crearReserva({ usuarioId: 99 });
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute({ reservaId: 1, usuarioId: 1, esGerente: true });
      expect(reserva.cancelar).toHaveBeenCalled();
      expect(resultado.eliminada).toBe(true);
    });

    test("crea notificación al eliminar como gerente", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios(reserva);
      const casoDeUso = new EliminarReserva(repos);
      await casoDeUso.execute(payloadBase);
      expect(repos.notificacionRepository.save).toHaveBeenCalled();
    });

    test("guarda la reserva cancelada", async () => {
      const reserva = crearReserva();
      const repos   = crearRepositorios(reserva);
      const casoDeUso = new EliminarReserva(repos);
      await casoDeUso.execute(payloadBase);
      expect(repos.reservaRepository.save).toHaveBeenCalledWith(reserva);
    });
  });

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS — USUARIO
  // ─────────────────────────────────────────────
  describe("Casos válidos — usuario", () => {
    test("usuario elimina su propia reserva", async () => {
      const reserva   = crearReserva({ usuarioId: 1 });
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute({ reservaId: 1, usuarioId: 1, esGerente: false });
      expect(reserva.cancelar).toHaveBeenCalled();
      expect(resultado.eliminada).toBe(true);
    });

    test("no crea notificación cuando cancela el propio usuario", async () => {
      const reserva = crearReserva({ usuarioId: 1 });
      const repos   = crearRepositorios(reserva);
      const casoDeUso = new EliminarReserva(repos);
      await casoDeUso.execute({ reservaId: 1, usuarioId: 1, esGerente: false });
      expect(repos.notificacionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE CAMPOS OBLIGATORIOS
  // ─────────────────────────────────────────────
  describe("Validaciones de campos obligatorios", () => {
    test("lanza 400 si reservaId es null", async () => {
      const casoDeUso = crearCasoDeUso(crearReserva());
      await expect(casoDeUso.execute({ reservaId: null, usuarioId: 1, esGerente: true }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE RESERVA
  // ─────────────────────────────────────────────
  describe("Validaciones de reserva", () => {
    test("lanza 404 si la reserva no existe", async () => {
      const casoDeUso = new EliminarReserva({
        reservaRepository:      crearRepositorios(null).reservaRepository,
        notificacionRepository: crearRepositorios(null).notificacionRepository,
      });
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    test("lanza 403 si usuario intenta eliminar reserva de otro", async () => {
      const reserva   = crearReserva({ usuarioId: 99 });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute({ reservaId: 1, usuarioId: 1, esGerente: false }))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 400 si gerente intenta eliminar reserva en curso", async () => {
      const ahora    = new Date();
      const fechaHoy = ahora.toISOString().split("T")[0];
      const hh       = String(ahora.getHours()).padStart(2, "0");
      const mm       = String(ahora.getMinutes()).padStart(2, "0");
      const horaAhora = `${hh}:${mm}`;

      // Calcular hora inicio anterior y hora fin posterior a ahora
      const inicioDate = new Date(ahora.getTime() - 30 * 60000);
      const finDate    = new Date(ahora.getTime() + 30 * 60000);
      const horaInicio = `${String(inicioDate.getHours()).padStart(2, "0")}:${String(inicioDate.getMinutes()).padStart(2, "0")}`;
      const horaFin    = `${String(finDate.getHours()).padStart(2, "0")}:${String(finDate.getMinutes()).padStart(2, "0")}`;

      const reserva   = crearReserva({ fecha: fechaHoy, horaInicio, horaFin });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si gerente intenta eliminar reserva con menos de 24h", async () => {
      const ahora    = new Date();
      const fechaHoy = ahora.toISOString().split("T")[0];
      // Reserva en 2 horas — menos de 24h de antelación
      const futuro   = new Date(ahora.getTime() + 2 * 60 * 60000);
      const horaInicio = `${String(futuro.getHours()).padStart(2, "0")}:${String(futuro.getMinutes()).padStart(2, "0")}`;
      const horaFin    = `${String(futuro.getHours() + 1).padStart(2, "0")}:${String(futuro.getMinutes()).padStart(2, "0")}`;

      const reserva   = crearReserva({ fecha: fechaHoy, horaInicio, horaFin });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });
});