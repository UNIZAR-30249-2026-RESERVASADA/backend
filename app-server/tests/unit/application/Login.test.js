const bcrypt = require("bcryptjs");
const Login  = require("../../../src/application/use-cases/Login");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function crearHash(password) {
  return bcrypt.hash(password, 10);
}

async function crearUsuario(overrides = {}) {
  return {
    id:             1,
    nombre:         "Test Usuario",
    email:          "test@unizar.es",
    contrasenia:    await crearHash("password123"),
    rol:            "docente_investigador",
    esGerente:      false,
    departamentoId: 1,
    ...overrides,
  };
}

async function crearCasoDeUso(usuarioOverrides = {}) {
  const usuario = await crearUsuario(usuarioOverrides);
  return new Login({
    usuarioRepository: {
      findByEmail: jest.fn().mockResolvedValue(usuario),
    },
  });
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("Login", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("devuelve el usuario correctamente con credenciales válidas", async () => {
      const casoDeUso = await crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        email:    "test@unizar.es",
        password: "password123",
      });
      expect(resultado.id).toBe(1);
      expect(resultado.nombre).toBe("Test Usuario");
      expect(resultado.email).toBe("test@unizar.es");
      expect(resultado.rol).toBe("docente_investigador");
      expect(resultado.esGerente).toBe(false);
      expect(resultado.departamentoId).toBe(1);
    });

    test("devuelve solo los campos necesarios (sin contrasenia)", async () => {
      const casoDeUso = await crearCasoDeUso();
      const resultado = await casoDeUso.execute({
        email:    "test@unizar.es",
        password: "password123",
      });
      expect(Object.keys(resultado)).toEqual([
        "id", "nombre", "email", "rol", "esGerente", "departamentoId",
      ]);
      expect(resultado.contrasenia).toBeUndefined();
    });

    test("funciona con usuario gerente puro", async () => {
      const casoDeUso = await crearCasoDeUso({ rol: null, esGerente: true, departamentoId: null });
      const resultado = await casoDeUso.execute({
        email:    "test@unizar.es",
        password: "password123",
      });
      expect(resultado.rol).toBeNull();
      expect(resultado.esGerente).toBe(true);
      expect(resultado.departamentoId).toBeNull();
    });

    test("funciona con usuario estudiante", async () => {
      const casoDeUso = await crearCasoDeUso({ rol: "estudiante", departamentoId: null });
      const resultado = await casoDeUso.execute({
        email:    "test@unizar.es",
        password: "password123",
      });
      expect(resultado.rol).toBe("estudiante");
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE CAMPOS OBLIGATORIOS
  // ─────────────────────────────────────────────
  describe("Validaciones de campos obligatorios", () => {
    test("lanza 400 si email es null", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: null, password: "password123" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si email está vacío", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "", password: "password123" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si password es null", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "test@unizar.es", password: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si password está vacío", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "test@unizar.es", password: "" }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si ambos son null", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: null, password: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE USUARIO
  // ─────────────────────────────────────────────
  describe("Validaciones de usuario", () => {
    test("lanza 404 si el usuario no existe", async () => {
      const casoDeUso = new Login({
        usuarioRepository: {
          findByEmail: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(casoDeUso.execute({ email: "noexiste@unizar.es", password: "password123" }))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    test("llama al repositorio con el email correcto", async () => {
      const mockRepo  = { findByEmail: jest.fn().mockResolvedValue(await crearUsuario()) };
      const casoDeUso = new Login({ usuarioRepository: mockRepo });
      await casoDeUso.execute({ email: "test@unizar.es", password: "password123" });
      expect(mockRepo.findByEmail).toHaveBeenCalledWith("test@unizar.es");
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE CONTRASEÑA
  // ─────────────────────────────────────────────
  describe("Validaciones de contraseña", () => {
    test("lanza 401 si la contraseña es incorrecta", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "test@unizar.es", password: "wrongpassword" }))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    test("lanza 401 si la contraseña es casi correcta", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "test@unizar.es", password: "password12" }))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    test("lanza 401 si la contraseña es correcta pero en mayúsculas", async () => {
      const casoDeUso = await crearCasoDeUso();
      await expect(casoDeUso.execute({ email: "test@unizar.es", password: "PASSWORD123" }))
        .rejects.toMatchObject({ statusCode: 401 });
    });
  });
});