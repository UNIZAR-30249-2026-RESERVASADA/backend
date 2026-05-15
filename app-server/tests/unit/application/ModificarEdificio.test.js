const ModificarEdificio = require("../../../src/application/use-cases/ModificarEdificio");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearEdificio(overrides = {}) {
  return {
    id:                  1,
    nombre:              "Ada Byron",
    horarioApertura:     "08:00",
    horarioCierre:       "20:00",
    porcentajeOcupacion: null,
    ...overrides,
  };
}

function crearEspacio(overrides = {}) {
  return {
    gid:                 5344,
    categoria:           "laboratorio",
    reservable:          true,
    aforo:               20,
    departamentoId:      1,
    usuariosAsignados:   [],
    horarioApertura:     null,
    horarioCierre:       null,
    porcentajeOcupacion: null,
    ...overrides,
  };
}

function crearRepositorios(overrides = {}) {
  const edificio = crearEdificio();
  return {
    edificioRepository: {
      findById: jest.fn().mockResolvedValue(edificio),
      update:   jest.fn().mockResolvedValue(null),
      ...overrides.edificioRepository,
    },
    espacioRepository: {
      findByEdificioId: jest.fn().mockResolvedValue([]),
      updatePorcentaje: jest.fn().mockResolvedValue(null),
      updateHorario:    jest.fn().mockResolvedValue(null),
      ...overrides.espacioRepository,
    },
    reservaRepository: {
      findVivasPorEspacio: jest.fn().mockResolvedValue([]),
      save:                jest.fn().mockResolvedValue(null),
      ...overrides.reservaRepository,
    },
    usuarioRepository: {
      findById: jest.fn().mockResolvedValue(null),
      ...overrides.usuarioRepository,
    },
    notificacionRepository: {
      save: jest.fn().mockResolvedValue(null),
      ...overrides.notificacionRepository,
    },
  };
}

function crearCasoDeUso(overrides = {}) {
  return new ModificarEdificio(crearRepositorios(overrides));
}

const payloadBase = {
  edificioId: 1,
  cambios:    { porcentajeOcupacion: 75 },
  esGerente:  true,
};

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("ModificarEdificio", () => {

  // ─────────────────────────────────────────────
  // VALIDACIONES DE PERMISOS
  // ─────────────────────────────────────────────
  describe("Validaciones de permisos", () => {
    test("lanza 403 si no es gerente", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, esGerente: false }))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 400 si edificioId es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, edificioId: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si cambios está vacío", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: {} }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 404 si el edificio no existe", async () => {
      const casoDeUso = crearCasoDeUso({
        edificioRepository: { findById: jest.fn().mockResolvedValue(null), update: jest.fn() },
      });
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE PORCENTAJE
  // ─────────────────────────────────────────────
  describe("Validaciones de porcentaje", () => {
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

    test("lanza 400 si porcentaje no numérico", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: "abc" } }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("no lanza error si porcentaje es null (quitar porcentaje)", async () => {
      const repos = crearRepositorios();
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ porcentajeOcupacion: null }));
      const casoDeUso = new ModificarEdificio(repos);
      await expect(casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: null } }))
        .resolves.toBeDefined();
    });

    test("cambia porcentaje correctamente", async () => {
      const repos = crearRepositorios();
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ porcentajeOcupacion: 75 }));
      const casoDeUso = new ModificarEdificio(repos);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(repos.edificioRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        porcentajeOcupacion: 75,
      }));
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE HORARIO
  // ─────────────────────────────────────────────
  describe("Validaciones de horario", () => {
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

    test("lanza 400 si formato de apertura inválido", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "9:00", horarioCierre: "20:00" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si formato de cierre inválido", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "08:00", horarioCierre: "veinte" },
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("cambia horario correctamente", async () => {
      const repos = crearRepositorios();
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ horarioApertura: "09:00", horarioCierre: "19:00" }));
      const casoDeUso = new ModificarEdificio(repos);
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        cambios: { horarioApertura: "09:00", horarioCierre: "19:00" },
      });
      expect(repos.edificioRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        horarioApertura: "09:00",
        horarioCierre:   "19:00",
      }));
    });
  });

  // ─────────────────────────────────────────────
  // AFECTAR TODOS — PORCENTAJE
  // ─────────────────────────────────────────────
  describe("afectarTodos — porcentaje", () => {
    test("con afectarTodos=false solo revisa espacios sin porcentaje propio", async () => {
      const espacioSinPct  = crearEspacio({ gid: 5344, porcentajeOcupacion: null });
      const espacioConPct  = crearEspacio({ gid: 5345, porcentajeOcupacion: 80 });
      const repos = crearRepositorios({
        espacioRepository: {
          findByEdificioId: jest.fn().mockResolvedValue([espacioSinPct, espacioConPct]),
          updatePorcentaje: jest.fn().mockResolvedValue(null),
          updateHorario:    jest.fn().mockResolvedValue(null),
        },
      });
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ porcentajeOcupacion: 50 }));
      const casoDeUso = new ModificarEdificio(repos);
      await casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: 50 }, afectarTodos: false });
      // Solo invalida el espacio sin porcentaje propio
      expect(repos.reservaRepository.findVivasPorEspacio).toHaveBeenCalledWith(5344);
      expect(repos.reservaRepository.findVivasPorEspacio).not.toHaveBeenCalledWith(5345);
    });

    test("con afectarTodos=true pone null en espacios con porcentaje propio", async () => {
      const espacioConPct = crearEspacio({ gid: 5345, porcentajeOcupacion: 80 });
      const repos = crearRepositorios({
        espacioRepository: {
          findByEdificioId: jest.fn().mockResolvedValue([espacioConPct]),
          updatePorcentaje: jest.fn().mockResolvedValue(null),
          updateHorario:    jest.fn().mockResolvedValue(null),
        },
      });
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ porcentajeOcupacion: 50 }));
      const casoDeUso = new ModificarEdificio(repos);
      await casoDeUso.execute({ ...payloadBase, cambios: { porcentajeOcupacion: 50 }, afectarTodos: true });
      expect(repos.espacioRepository.updatePorcentaje).toHaveBeenCalledWith(5345, null);
    });
  });

  // ─────────────────────────────────────────────
  // AFECTAR TODOS — HORARIO
  // ─────────────────────────────────────────────
  describe("afectarTodos — horario", () => {
    test("con afectarTodos=false solo revisa espacios sin horario propio", async () => {
      const espacioSinHorario = crearEspacio({ gid: 5344, horarioApertura: null, horarioCierre: null });
      const espacioConHorario = crearEspacio({ gid: 5345, horarioApertura: "09:00", horarioCierre: "18:00" });
      const repos = crearRepositorios({
        espacioRepository: {
          findByEdificioId: jest.fn().mockResolvedValue([espacioSinHorario, espacioConHorario]),
          updatePorcentaje: jest.fn().mockResolvedValue(null),
          updateHorario:    jest.fn().mockResolvedValue(null),
        },
      });
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ horarioApertura: "09:00", horarioCierre: "19:00" }));
      const casoDeUso = new ModificarEdificio(repos);
      await casoDeUso.execute({
        ...payloadBase,
        cambios:      { horarioApertura: "09:00", horarioCierre: "19:00" },
        afectarTodos: false,
      });
      expect(repos.reservaRepository.findVivasPorEspacio).toHaveBeenCalledWith(5344);
      expect(repos.reservaRepository.findVivasPorEspacio).not.toHaveBeenCalledWith(5345);
    });

    test("con afectarTodos=true pone null en espacios con horario propio", async () => {
      const espacioConHorario = crearEspacio({ gid: 5345, horarioApertura: "09:00", horarioCierre: "18:00" });
      const repos = crearRepositorios({
        espacioRepository: {
          findByEdificioId: jest.fn().mockResolvedValue([espacioConHorario]),
          updatePorcentaje: jest.fn().mockResolvedValue(null),
          updateHorario:    jest.fn().mockResolvedValue(null),
        },
      });
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ horarioApertura: "09:00", horarioCierre: "19:00" }));
      const casoDeUso = new ModificarEdificio(repos);
      await casoDeUso.execute({
        ...payloadBase,
        cambios:      { horarioApertura: "09:00", horarioCierre: "19:00" },
        afectarTodos: true,
      });
      expect(repos.espacioRepository.updateHorario).toHaveBeenCalledWith(5345, null, null);
    });
  });

  // ─────────────────────────────────────────────
  // DEVUELVE DATOS ACTUALIZADOS
  // ─────────────────────────────────────────────
  describe("Devuelve datos actualizados", () => {
    test("devuelve el edificio actualizado con reservasCanceladas", async () => {
      const repos = crearRepositorios();
      repos.edificioRepository.findById
        .mockResolvedValueOnce(crearEdificio())
        .mockResolvedValueOnce(crearEdificio({ porcentajeOcupacion: 75 }));
      const casoDeUso = new ModificarEdificio(repos);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toHaveProperty("id");
      expect(resultado).toHaveProperty("horarioApertura");
      expect(resultado).toHaveProperty("horarioCierre");
      expect(resultado).toHaveProperty("porcentajeOcupacion");
      expect(resultado).toHaveProperty("reservasCanceladas");
      expect(Array.isArray(resultado.reservasCanceladas)).toBe(true);
    });
  });
});