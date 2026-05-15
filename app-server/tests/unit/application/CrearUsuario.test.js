const CrearUsuario = require("../../../src/application/use-cases/CrearUsuario");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearRepositorio(overrides = {}) {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    save:        jest.fn().mockImplementation((u) => Promise.resolve({
      id:             1,
      nombre:         u.nombre,
      email:          u.email,
      rol:            u.rol,
      esGerente:      u.esGerente,
      departamentoId: u.departamentoId,
    })),
    ...overrides,
  };
}

function crearCasoDeUso(overrides = {}) {
  return new CrearUsuario({
    usuarioRepository: crearRepositorio(overrides.usuarioRepository),
  });
}

const payloadBase = {
  nombre:        "Test Usuario",
  email:         "test@unizar.es",
  contrasenia:   "password123",
  rol:           "docente_investigador",
  departamentoId: 1,
  nuevoEsGerente: false,
  esGerente:     true,
};

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("CrearUsuario", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("crea un estudiante correctamente", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "estudiante",
        departamentoId: null,
      });
      expect(resultado.email).toBe("test@unizar.es");
      expect(resultado.rol).toBe("estudiante");
    });

    test("crea un docente investigador con departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado.rol).toBe("docente_investigador");
    });

    test("crea un conserje sin departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "conserje",
        departamentoId: null,
      });
      expect(resultado.rol).toBe("conserje");
    });

    test("crea un investigador contratado con departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "investigador_contratado",
        departamentoId: 1,
      });
      expect(resultado.rol).toBe("investigador_contratado");
    });

    test("crea un técnico de laboratorio con departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "tecnico_laboratorio",
        departamentoId: 1,
      });
      expect(resultado.rol).toBe("tecnico_laboratorio");
    });

    test("crea un investigador visitante con departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "investigador_visitante",
        departamentoId: 1,
      });
      expect(resultado.rol).toBe("investigador_visitante");
    });

    test("crea un gerente puro sin rol ni departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            null,
        departamentoId: null,
        nuevoEsGerente: true,
      });
      expect(resultado.esGerente).toBe(true);
    });

    test("crea un gerente + docente investigador", async () => {
      const casoDeUso = crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        ...payloadBase,
        rol:            "docente_investigador",
        departamentoId: 1,
        nuevoEsGerente: true,
      });
      expect(resultado.esGerente).toBe(true);
      expect(resultado.rol).toBe("docente_investigador");
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
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE CAMPOS OBLIGATORIOS
  // ─────────────────────────────────────────────
  describe("Validaciones de campos obligatorios", () => {
    test("lanza 400 si nombre es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, nombre: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si email es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, email: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si contrasenia es null", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, contrasenia: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE EMAIL ÚNICO
  // ─────────────────────────────────────────────
  describe("Validaciones de email único", () => {
    test("lanza 409 si el email ya existe", async () => {
      const casoDeUso = crearCasoDeUso({
        usuarioRepository: {
          findByEmail: jest.fn().mockResolvedValue({ id: 99, email: "test@unizar.es" }),
        },
      });
      await expect(casoDeUso.execute(payloadBase)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE ROL
  // ─────────────────────────────────────────────
  describe("Validaciones de rol", () => {
    test("lanza 400 si rol no es válido", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({ ...payloadBase, rol: "superadmin" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si rol requiere departamento y no se indica", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "docente_investigador",
        departamentoId: null,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si rol no permite departamento y se indica", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "estudiante",
        departamentoId: 1,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si conserje tiene departamento", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "conserje",
        departamentoId: 1,
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE GERENTE
  // ─────────────────────────────────────────────
  describe("Validaciones de gerente", () => {
    test("lanza 400 si esGerente con rol estudiante", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "estudiante",
        departamentoId: null,
        nuevoEsGerente: true,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si esGerente con rol tecnico_laboratorio", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "tecnico_laboratorio",
        departamentoId: 1,
        nuevoEsGerente: true,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si esGerente con rol conserje", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "conserje",
        departamentoId: null,
        nuevoEsGerente: true,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si esGerente con rol investigador_visitante", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "investigador_visitante",
        departamentoId: 1,
        nuevoEsGerente: true,
      })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("no lanza error si esGerente con rol docente_investigador", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            "docente_investigador",
        departamentoId: 1,
        nuevoEsGerente: true,
      })).resolves.toBeDefined();
    });

    test("no lanza error si esGerente sin rol (gerente puro)", async () => {
      const casoDeUso = crearCasoDeUso();
      await expect(casoDeUso.execute({
        ...payloadBase,
        rol:            null,
        departamentoId: null,
        nuevoEsGerente: true,
      })).resolves.toBeDefined();
    });
  });
});