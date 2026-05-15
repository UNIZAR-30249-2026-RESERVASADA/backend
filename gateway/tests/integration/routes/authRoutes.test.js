const request = require("supertest");
const app     = require("../../../src/app");

jest.mock("../../../src/services/appServerClient", () => ({
  login:                      jest.fn(),
  obtenerMetadatosEspacios:   jest.fn(),
  crearReserva:               jest.fn(),
  obtenerReservasUsuario:     jest.fn(),
  cancelarReservaPropia:      jest.fn(),
  obtenerReservasVivas:       jest.fn(),
  eliminarReserva:            jest.fn(),
  modificarEspacio:           jest.fn(),
  modificarEdificio:          jest.fn(),
  getNotificaciones:          jest.fn(),
  marcarNotificacionesLeidas: jest.fn(),
  crearUsuario:               jest.fn(),
  modificarUsuario:           jest.fn(),
  obtenerUsuario:             jest.fn(),
}));

const usuarioMock = {
  id:             1,
  nombre:         "Docente Test",
  email:          "docente@unizar.es",
  rol:            "docente_investigador",
  esGerente:      false,
  departamentoId: 1,
};

describe("POST /api/auth/login", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("devuelve 200 con token y usuario", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.login.mockResolvedValue(usuarioMock);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "docente@unizar.es", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("usuario");
      expect(res.body.usuario.email).toBe("docente@unizar.es");
    });

    test("el token devuelto es un JWT válido", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.login.mockResolvedValue(usuarioMock);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "docente@unizar.es", password: "password123" });

      const jwt           = require("jsonwebtoken");
      const { jwtSecret } = require("../../../src/config/jwt");
      const decoded       = jwt.verify(res.body.token, jwtSecret);
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe("docente@unizar.es");
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIÓN DTO
  // ─────────────────────────────────────────────
  describe("Validación DTO", () => {
    test("devuelve 400 si falta email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "password123" });
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si falta password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "docente@unizar.es" });
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si email no tiene formato válido", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "noesunemail", password: "password123" });
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si body está vacío", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // ERRORES DEL APP SERVER
  // ─────────────────────────────────────────────
  describe("Errores del app server", () => {
    test("devuelve 404 si usuario no encontrado", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      appServerClient.login.mockRejectedValue(error);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "noexiste@unizar.es", password: "password123" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Usuario no encontrado");
    });

    test("devuelve 401 si contraseña incorrecta", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Password incorrecto");
      error.statusCode = 401;
      appServerClient.login.mockRejectedValue(error);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "docente@unizar.es", password: "wrongpassword" });

      expect(res.status).toBe(401);
    });
  });
});