const ReservarEspacio = require("../../../src/application/use-cases/ReservarEspacio");
const ReservaPolicy   = require("../../../src/domain/policies/ReservaPolicy");
const ReservaFactory  = require("../../../src/domain/factories/ReservaFactory");

// ─────────────────────────────────────────────
// HELPERS — mocks reutilizables
// ─────────────────────────────────────────────

function crearUsuario(overrides = {}) {
  return {
    id:             1,
    rol:            "docente_investigador",
    esGerente:      false,
    departamentoId: 1,
    ...overrides,
  };
}

function crearEspacio(overrides = {}) {
  return {
    gid:              5344,
    nombre:           "LABORATORIO 0.01",
    categoria:        "laboratorio",
    reservable:       true,
    aforo:            20,
    departamentoId:   1,
    asignadoAEina:    false,
    edificioId:       1,
    usuariosAsignados: [],
    horarioApertura:  null,
    horarioCierre:    null,
    puedeReservarse:  () => true,
    admiteOcupacion:  () => true,
    estaAsignadoA:    () => false,
    ...overrides,
  };
}

function crearDepartamento(id = 1) {
  return {
    id,
    nombre:              id === 1 ? "Informática e Ingeniería de Sistemas" : "Ingeniería Electrónica y Comunicaciones",
    esMismoDepartamento: (otro) => otro && String(otro.id) === String(id),
  };
}

function crearRepositorios(overrides = {}) {
  return {
    usuarioRepository: {
      findById: jest.fn().mockResolvedValue(crearUsuario()),
      ...overrides.usuarioRepository,
    },
    espacioRepository: {
      findById: jest.fn().mockResolvedValue(crearEspacio()),
      ...overrides.espacioRepository,
    },
    reservaRepository: {
      findByEspacioYFecha: jest.fn().mockResolvedValue([]),
      save:               jest.fn().mockResolvedValue({ id: 1 }),
      ...overrides.reservaRepository,
    },
    edificioRepository: {
      findById: jest.fn().mockResolvedValue({
        id:                  1,
        horarioApertura:     "08:00",
        horarioCierre:       "20:00",
        getPorcentajeOcupacionMaximo: () => 100,
      }),
      ...overrides.edificioRepository,
    },
    departamentoRepository: {
      findById: jest.fn().mockResolvedValue(crearDepartamento(1)),
      ...overrides.departamentoRepository,
    },
  };
}

function crearCasoDeUso(overrides = {}) {
  const repos = crearRepositorios(overrides);
  return new ReservarEspacio({
    ...repos,
    reservaFactory: new ReservaFactory(),
    ReservaPolicy,
  });
}

// Payload base válido
const payloadBase = {
  espacios:   [{ espacioId: 5344, numPersonas: 5 }],
  usuarioId:  1,
  fecha:      "2026-05-21",
  horaInicio: "10:00",
  duracion:   60,
  tipoUso:    "docencia",
  descripcion: "test",
};

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("ReservarEspacio", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("crea reserva correctamente", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toBeDefined();
    });

    test("gerente puede reservar cualquier espacio", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ esGerente: true, rol: "docente_investigador" })),
        },
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ departamentoId: 2 })),
        },
      });
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toBeDefined();
    });

    test("docente INF puede reservar lab INF", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toBeDefined();
    });

    test("reserva con varios espacios", async () => {
      const espacioMock = crearEspacio();
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(espacioMock),
        },
      });
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        espacios: [
          { espacioId: 5344, numPersonas: 5 },
          { espacioId: 5345, numPersonas: 5 },
        ],
      });
      expect(resultado).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE USUARIO
  // ─────────────────────────────────────────────
  describe("Validaciones de usuario", () => {
    test("lanza 404 si el usuario no existe", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: { findById: jest.fn().mockResolvedValue(null) },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 404 });
    });

    test("lanza 400 si el usuario no tiene rol ni es gerente", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: null, esGerente: false })),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE ESPACIOS
  // ─────────────────────────────────────────────
  describe("Validaciones de espacios", () => {
    test("lanza 400 si espacios está vacío", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, espacios: [] }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si espacios es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, espacios: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 404 si el espacio no existe", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: { findById: jest.fn().mockResolvedValue(null) },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 404 });
    });

    test("lanza 400 si el espacio no es reservable", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ puedeReservarse: () => false })),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE FECHA Y HORA
  // ─────────────────────────────────────────────
  describe("Validaciones de fecha y hora", () => {
    test("lanza 400 si la reserva es en fin de semana", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, fecha: "2026-05-23" })) // sábado
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si la reserva es en domingo", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, fecha: "2026-05-24" })) // domingo
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si la reserva es con menos de 24h de antelación", async () => {
      const casoDeUso = crearCasoDeUso();
      const ahora = new Date();
      const fechaHoy = ahora.toISOString().split("T")[0];
      await expect(casoDeUso.execute({ ...payloadBase, fecha: fechaHoy, horaInicio: "10:00" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si la hora de inicio es antes de la apertura del espacio", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ horarioApertura: "09:00", horarioCierre: "20:00" })),
        },
      });
      await expect(casoDeUso.execute({ ...payloadBase, horaInicio: "08:00" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si la reserva termina después del cierre del espacio", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ horarioApertura: "08:00", horarioCierre: "10:30" })),
        },
      });
      await expect(casoDeUso.execute({ ...payloadBase, horaInicio: "10:00", duracion: 60 }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE PERMISOS
  // ─────────────────────────────────────────────
  describe("Validaciones de permisos", () => {
    test("lanza 403 si estudiante intenta reservar laboratorio", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "estudiante", departamentoId: null })),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 403 si técnico intenta reservar lab de otro departamento", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "tecnico_laboratorio", departamentoId: 1 })),
        },
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ departamentoId: 2 })),
        },
        departamentoRepository: {
          findById: jest.fn().mockImplementation((id) => Promise.resolve(crearDepartamento(id))),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 403 si docente intenta reservar lab de la EINA", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ departamentoId: null, asignadoAEina: true })),
        },
        departamentoRepository: {
          findById: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 403 si conserje intenta reservar despacho", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "conserje", departamentoId: null })),
        },
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ categoria: "despacho", departamentoId: 1 })),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE AFORO
  // ─────────────────────────────────────────────
  describe("Validaciones de aforo", () => {
    test("lanza 400 si numPersonas supera el aforo", async () => {
      const casoDeUso = crearCasoDeUso({
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({
            aforo:            10,
            admiteOcupacion:  () => false,
          })),
        },
      });
      await expect(casoDeUso.execute({ ...payloadBase, espacios: [{ espacioId: 5344, numPersonas: 999 }] }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE SOLAPAMIENTO
  // ─────────────────────────────────────────────
  describe("Validaciones de solapamiento", () => {
    test("lanza 400 si hay solapamiento con reserva existente", async () => {
      const reservaExistente = {
        id:         99,
        espacios:   [{ espacioId: 5344, numPersonas: null }],
        usuarioId:  2,
        fecha:      "2026-05-21",
        horaInicio: "10:00",
        duracion:   60,
        horaFin:    "11:00",
        estado:     "aceptada",
        seSOlapaConOtra: () => true,
        periodo: {
          fecha:      "2026-05-21",
          horaInicio: "10:00",
          duracion:   60,
          horaFin:    "11:00",
          seSOlapaConOtro: () => true,
        },
      };

      const casoDeUso = crearCasoDeUso({
        reservaRepository: {
          findByEspacioYFecha: jest.fn().mockResolvedValue([reservaExistente]),
          save:               jest.fn(),
        },
      });

      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});