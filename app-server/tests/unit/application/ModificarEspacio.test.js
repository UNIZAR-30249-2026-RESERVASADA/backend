const ModificarEspacio = require("../../../src/application/use-cases/ModificarEspacio");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearEspacio(overrides = {}) {
  return {
    gid:              5344,
    nombre:           "LABORATORIO 0.01",
    uso:              "LABORATORIO",
    categoria:        "laboratorio",
    reservable:       true,
    aforo:            20,
    departamentoId:   1,
    asignadoAEina:    false,
    edificioId:       1,
    usuariosAsignados: [],
    horarioApertura:  null,
    horarioCierre:    null,
    porcentajeOcupacion: null,
    ...overrides,
  };
}

function crearUsuario(overrides = {}) {
  return {
    id:             3,
    nombre:         "Ana Docente",
    rol:            "docente_investigador",
    departamentoId: 1,
    ...overrides,
  };
}

function crearRepositorios(overrides = {}) {
  return {
    espacioRepository: {
      findById:          jest.fn().mockResolvedValue(crearEspacio()),
      updateReservable:  jest.fn().mockResolvedValue(null),
      updateCategoria:   jest.fn().mockResolvedValue(null),
      updateAsignacion:  jest.fn().mockResolvedValue(null),
      updateHorario:     jest.fn().mockResolvedValue(null),
      updatePorcentaje:  jest.fn().mockResolvedValue(null),
      findByEdificioId:  jest.fn().mockResolvedValue([]),
      ...overrides.espacioRepository,
    },
    usuarioRepository: {
      findById: jest.fn().mockResolvedValue(crearUsuario()),
      ...overrides.usuarioRepository,
    },
    reservaRepository: {
      findVivasPorEspacio: jest.fn().mockResolvedValue([]),
      save:                jest.fn().mockResolvedValue(null),
      ...overrides.reservaRepository,
    },
    notificacionRepository: {
      save: jest.fn().mockResolvedValue(null),
      ...overrides.notificacionRepository,
    },
  };
}

function crearCasoDeUso(overrides = {}) {
  const repos = crearRepositorios(overrides);
  // Segunda llamada a findById devuelve el espacio actualizado
  if (!overrides.espacioRepository?.findById) {
    repos.espacioRepository.findById
      .mockResolvedValueOnce(crearEspacio())
      .mockResolvedValueOnce(crearEspacio());
  }
  return new ModificarEspacio(repos);
}

const payloadBase = {
  espacioId: 5344,
  cambios:   { reservable: false },
  esGerente: true,
};

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("ModificarEspacio", () => {

  // ─────────────────────────────────────────────
  // VALIDACIONES DE PERMISOS
  // ─────────────────────────────────────────────
  describe("Validaciones de permisos", () => {
    test("lanza 403 si no es gerente", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, esGerente: false }))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 400 si espacioId es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, espacioId: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si cambios está vacío", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: {} }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 404 si el espacio no existe", async () => {
      const repos = crearRepositorios({
        espacioRepository: { findById: jest.fn().mockResolvedValue(null) },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────────────────────────
  // RESERVABLE
  // ─────────────────────────────────────────────
  describe("Reservable", () => {
    test("cambia reservable a false correctamente", async () => {
      const repos = crearRepositorios();
      repos.espacioRepository.findById
        .mockResolvedValueOnce(crearEspacio())
        .mockResolvedValueOnce(crearEspacio({ reservable: false }));
      const casoDeUso = new ModificarEspacio(repos);
      const resultado = await casoDeUso.execute({ ...payloadBase, cambios: { reservable: false } });
      expect(repos.espacioRepository.updateReservable).toHaveBeenCalledWith(5344, false);
    });

    test("cambia reservable a true correctamente", async () => {
      const repos = crearRepositorios();
      repos.espacioRepository.findById
        .mockResolvedValueOnce(crearEspacio({ reservable: false }))
        .mockResolvedValueOnce(crearEspacio({ reservable: true }));
      const casoDeUso = new ModificarEspacio(repos);
      await casoDeUso.execute({ ...payloadBase, cambios: { reservable: true } });
      expect(repos.espacioRepository.updateReservable).toHaveBeenCalledWith(5344, true);
    });

    test("lanza 400 si despacho con docente asignado intenta ponerse reservable", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({
              categoria:         "despacho",
              usuariosAsignados: [{ id: 3, rol: "docente_investigador", departamentoId: 1 }],
            }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { reservable: true },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // PORCENTAJE
  // ─────────────────────────────────────────────
  describe("Porcentaje de ocupación", () => {
    test("cambia porcentaje correctamente", async () => {
      const repos = crearRepositorios();
      repos.espacioRepository.findById
        .mockResolvedValueOnce(crearEspacio())
        .mockResolvedValueOnce(crearEspacio({ porcentajeOcupacion: 50 }));
      const casoDeUso = new ModificarEspacio(repos);
      await casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: 50 } });
      expect(repos.espacioRepository.updatePorcentaje).toHaveBeenCalledWith(5344, 50);
    });

    test("lanza 400 si porcentaje mayor de 100", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: 150 } }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si porcentaje negativo", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: -10 } }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // HORARIO
  // ─────────────────────────────────────────────
  describe("Horario", () => {
    test("cambia horario correctamente", async () => {
      const repos = crearRepositorios();
      repos.espacioRepository.findById
        .mockResolvedValueOnce(crearEspacio())
        .mockResolvedValueOnce(crearEspacio({ horarioApertura: "09:00", horarioCierre: "18:00" }));
      const casoDeUso = new ModificarEspacio(repos);
      await casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "09:00", horarioCierre: "18:00" },
      });
      expect(repos.espacioRepository.updateHorario).toHaveBeenCalledWith(5344, "09:00", "18:00");
    });

    test("lanza 400 si apertura posterior al cierre", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "20:00", horarioCierre: "09:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si apertura igual al cierre", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "10:00", horarioCierre: "10:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si solo viene apertura sin cierre", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "09:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si solo viene cierre sin apertura", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioCierre: "18:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si formato de hora inválido", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "9:00", horarioCierre: "18:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // CATEGORÍA
  // ─────────────────────────────────────────────
  describe("Categoría", () => {
    test("lanza 400 si transición de categoría inválida", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { categoria: "sala comun" }, // laboratorio → sala comun no permitido
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si categoría no válida", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { categoria: "inventada" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si despacho intenta cambiar de categoría", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho", uso: "DESPACHO" }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { categoria: "aula" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // ASIGNACIÓN
  // ─────────────────────────────────────────────
  describe("Asignación", () => {
    test("lanza 400 si EINA y departamento a la vez", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { asignadoAEina: true, departamentoId: 1 },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si aula intenta asignarse a departamento", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "aula", uso: "AULA", asignadoAEina: true, departamentoId: null }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "aula" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { departamentoId: 1 },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si despacho intenta asignarse a EINA", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho", uso: "DESPACHO", departamentoId: 1, asignadoAEina: false }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { asignadoAEina: true },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si despacho intenta asignarse a más de una persona", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho", uso: "DESPACHO", departamentoId: 1, asignadoAEina: false }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario()),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { usuariosAsignados: [3, 5] },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si se asigna usuario con rol no válido", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho", uso: "DESPACHO", departamentoId: 1, asignadoAEina: false }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "estudiante" })),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { usuariosAsignados: [10] },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si despacho con investigador contratado es reservable", async () => {
      const repos = crearRepositorios({
        espacioRepository: {
          findById: jest.fn()
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho", uso: "DESPACHO", departamentoId: 1, asignadoAEina: false }))
            .mockResolvedValueOnce(crearEspacio({ categoria: "despacho" })),
          updateReservable: jest.fn(),
          updateCategoria:  jest.fn(),
          updateAsignacion: jest.fn(),
          updateHorario:    jest.fn(),
          updatePorcentaje: jest.fn(),
          findByEdificioId: jest.fn().mockResolvedValue([]),
        },
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "investigador_contratado" })),
        },
      });
      const casoDeUso = new ModificarEspacio(repos);
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { usuariosAsignados: [5], reservable: true },
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});