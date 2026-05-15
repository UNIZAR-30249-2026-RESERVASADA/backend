const ObtenerUsuario = require("../../../src/application/use-cases/ObtenerUsuario");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearUsuario(overrides = {}) {
  return {
    id:             1,
    nombre:         "Test Usuario",
    email:          "test@unizar.es",
    rol:            "docente_investigador",
    esGerente:      false,
    departamentoId: 1,
    ...overrides,
  };
}

function crearRepositorio(overrides = {}) {
  return {
    findById: jest.fn().mockResolvedValue(crearUsuario()),
    ...overrides,
  };
}

function crearCasoDeUso(overrides = {}) {
  return new ObtenerUsuario({
    usuarioRepository: crearRepositorio(overrides.usuarioRepository),
  });
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("ObtenerUsuario", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("devuelve el usuario correctamente", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({ usuarioId: 1 });
      expect(resultado.id).toBe(1);
      expect(resultado.nombre).toBe("Test Usuario");
      expect(resultado.email).toBe("test@unizar.es");
      expect(resultado.rol).toBe("docente_investigador");
      expect(resultado.esGerente).toBe(false);
      expect(resultado.departamentoId).toBe(1);
    });

    test("devuelve usuario gerente puro correctamente", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: null, esGerente: true, departamentoId: null })),
        },
      });
      const resultado = await casoDeUso.execute({ usuarioId: 1 });
      expect(resultado.rol).toBeNull();
      expect(resultado.esGerente).toBe(true);
      expect(resultado.departamentoId).toBeNull();
    });

    test("devuelve usuario estudiante correctamente", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(crearUsuario({ rol: "estudiante", departamentoId: null })),
        },
      });
      const resultado = await casoDeUso.execute({ usuarioId: 1 });
      expect(resultado.rol).toBe("estudiante");
      expect(resultado.departamentoId).toBeNull();
    });

    test("llama al repositorio con el id correcto", async () => {
      const mockRepo = crearRepositorio();
      const casoDeUso = new ObtenerUsuario({ usuarioRepository: mockRepo });
      await casoDeUso.execute({ usuarioId: 42 });
      expect(mockRepo.findById).toHaveBeenCalledWith(42);
    });

    test("devuelve solo los campos necesarios", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({ usuarioId: 1 });
      expect(Object.keys(resultado)).toEqual([
        "id", "nombre", "email", "rol", "esGerente", "departamentoId",
      ]);
    });
  });

  // ─────────────────────────────────────────────
  // CASOS INVÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos inválidos", () => {
    test("lanza 400 si usuarioId es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ usuarioId: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si usuarioId es undefined", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ usuarioId: undefined }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 404 si el usuario no existe", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findById: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(casoDeUso.execute({ usuarioId: 9999 }))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});