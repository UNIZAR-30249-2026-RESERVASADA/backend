const ModificarUsuario = require("../../../src/application/use-cases/ModificarUsuario");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearUsuario(overrides = {}) {
  return {
    id:             1,
    nombre:         "Test Usuario",
    email:          "test@unizar.es",
    rol:            "estudiante",
    esGerente:      false,
    departamentoId: null,
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

function crearRepositorios(overrides = {}) {
  const usuarioActualizado = crearUsuario({ rol: "investigador_contratado", departamentoId: 1 });

  return {
    usuarioRepository: {
      findById:          jest.fn().mockResolvedValue(crearUsuario()),
      updateRol:         jest.fn().mockResolvedValue(null),
      updateDepartamento: jest.fn().mockResolvedValue(null),
      updateEsGerente:   jest.fn().mockResolvedValue(null),
      ...overrides.usuarioRepository,
    },
    reservaRepository: {
      findByUsuario: jest.fn().mockResolvedValue([]),
      save:          jest.fn().mockResolvedValue(null),
      ...overrides.reservaRepository,
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

function crearCasoDeUso(overrides = {}) {
  const repos = crearRepositorios(overrides);
  return new ModificarUsuario(repos);
}

const payloadBase = {
  usuarioId: 1,
  cambios:   { rol: "investigador_contratado", departamentoId: 1 },
  esGerente: true,
};

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("ModificarUsuario", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("estudiante → investigador_contratado con departamento", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "estudiante" }))
        .mockResolvedValueOnce(crearUsuario({ rol: "investigador_contratado", departamentoId: 1 }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toBeDefined();
    });

    test("investigador_contratado → docente_investigador", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "investigador_contratado", departamentoId: 1 }))
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 1 }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { rol: "docente_investigador" },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("tecnico_laboratorio → conserje", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "tecnico_laboratorio", departamentoId: 1 }))
        .mockResolvedValueOnce(crearUsuario({ rol: "conserje", departamentoId: null }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { rol: "conserje", departamentoId: null },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("conserje → tecnico_laboratorio", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "conserje", departamentoId: null }))
        .mockResolvedValueOnce(crearUsuario({ rol: "tecnico_laboratorio", departamentoId: 1 }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { rol: "tecnico_laboratorio", departamentoId: 1 },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("cambiar departamento sin cambiar rol", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 1 }))
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 2 }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { departamentoId: 2 },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("activar esGerente a docente_investigador", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 1, esGerente: false }))
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 1, esGerente: true }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { esGerente: true },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("gerente puro recibe rol docente_investigador", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: null, esGerente: true, departamentoId: null }))
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", esGerente: true, departamentoId: 1 }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { rol: "docente_investigador", departamentoId: 1 },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });

    test("gerente+docente pierde rol y vuelve a gerente puro", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", esGerente: true, departamentoId: 1 }))
        .mockResolvedValueOnce(crearUsuario({ rol: null, esGerente: true, departamentoId: null }));
      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { rol: null },
        esGerente: true,
      });
      expect(resultado).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE PERMISOS
  // ─────────────────────────────────────────────
  describe("Validaciones de permisos", () => {
    test("lanza 403 si no es gerente", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, esGerente: false }))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 400 si usuarioId es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, usuarioId: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si cambios está vacío", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: {} }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 404 si el usuario no existe", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: { findById: jest.fn().mockResolvedValue(null) },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE TRANSICIÓN DE ROL
  // ─────────────────────────────────────────────
  describe("Validaciones de transición de rol", () => {
    test("lanza 400 si transición inválida estudiante → docente_investigador", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { rol: "docente_investigador", departamentoId: 1 },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si transición inválida investigador_visitante → cualquier rol", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "investigador_visitante", departamentoId: 1 })),
        },
      });
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { rol: "estudiante" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si docente_investigador intenta cambiar a cualquier rol", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "docente_investigador", departamentoId: 1 })),
        },
      });
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { rol: "investigador_contratado" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE GERENTE
  // ─────────────────────────────────────────────
  describe("Validaciones de gerente", () => {
    test("lanza 400 si esGerente:true con rol tecnico_laboratorio", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "tecnico_laboratorio", departamentoId: 1 })),
        },
      });
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { esGerente: true },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si esGerente:true con rol conserje", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "conserje", departamentoId: null })),
        },
      });
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { esGerente: true },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE DEPARTAMENTO
  // ─────────────────────────────────────────────
  describe("Validaciones de departamento", () => {
    test("lanza 400 si rol requiere departamento y no se indica", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { rol: "investigador_contratado", departamentoId: null },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si rol no permite departamento y se indica", async () => {
      const repos = crearRepositorios();
      repos.usuarioRepository.findById
        .mockResolvedValueOnce(crearUsuario({ rol: "estudiante", departamentoId: null }));
      const casoDeUso = new ModificarUsuario(repos);
      await expect(casoDeUso.execute({
        usuarioId: 1,
        cambios:   { departamentoId: 1 },
        esGerente: true,
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // INVALIDACIÓN DE RESERVAS
  // ─────────────────────────────────────────────
  describe("Invalidación de reservas", () => {
    test("cancela reservas que ya no cumplan tras cambio de departamento", async () => {
      const reservaActiva = {
        id:         99,
        usuarioId:  1,
        fecha:      "2026-06-01",
        horaInicio: "10:00",
        horaFin:    "11:00",
        duracion:   60,
        estado:     "aceptada",
        espacios:   [{ espacioId: 5344, numPersonas: null }],
        estaActiva: () => true,
        cancelar:   jest.fn(),
        periodo:    { seSOlapaConOtro: () => false },
      };

      const repos = crearRepositorios({
        usuarioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 1 }))
            .mockResolvedValueOnce(crearUsuario({ rol: "docente_investigador", departamentoId: 2 })),
          updateRol:          jest.fn().mockResolvedValue(null),
          updateDepartamento: jest.fn().mockResolvedValue(null),
          updateEsGerente:    jest.fn().mockResolvedValue(null),
        },
        reservaRepository: {
          findByUsuario: jest.fn().mockResolvedValue([reservaActiva]),
          save:          jest.fn().mockResolvedValue(null),
        },
        espacioRepository: {
          findById: jest.fn().mockResolvedValue(crearEspacio({ departamentoId: 1 })),
        },
      });

      const casoDeUso = new ModificarUsuario(repos);
      const resultado = await casoDeUso.execute({
        usuarioId: 1,
        cambios:   { departamentoId: 2 },
        esGerente: true,
      });

      expect(reservaActiva.cancelar).toHaveBeenCalled();
      expect(resultado.reservasCanceladas).toContain(99);
    });
  });
});