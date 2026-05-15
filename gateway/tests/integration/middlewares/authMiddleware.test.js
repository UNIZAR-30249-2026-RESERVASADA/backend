const request    = require("supertest");
const app        = require("../../../src/app");
const { signToken } = require("../../../src/services/jwtService");

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

function tokenDocente() {
  return signToken({ id: 1, email: "docente@unizar.es", rol: "docente_investigador", esGerente: false, departamentoId: 1, nombre: "Docente Test" });
}

function tokenGerente() {
  return signToken({ id: 2, email: "gerente@unizar.es", rol: null, esGerente: true, departamentoId: null, nombre: "Gerente Test" });
}

describe("authMiddleware", () => {

  // ─────────────────────────────────────────────
  // SIN TOKEN
  // ─────────────────────────────────────────────
  describe("Sin token", () => {
    test("devuelve 401 si no hay Authorization header", async () => {
      const res = await request(app).get("/api/reservas/mis-reservas");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token no proporcionado");
    });

    test("devuelve 401 si Authorization no empieza por Bearer", async () => {
      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", "Basic abc123");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token no proporcionado");
    });

    test("devuelve 401 si el token está vacío", async () => {
      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", "Bearer ");
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // TOKEN INVÁLIDO
  // ─────────────────────────────────────────────
  describe("Token inválido", () => {
    test("devuelve 401 si el token está malformado", async () => {
      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", "Bearer tokeninvalido");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token inválido o expirado");
    });

    test("devuelve 401 si el token está firmado con secret incorrecto", async () => {
      const jwt = require("jsonwebtoken");
      const tokenMalo = jwt.sign({ id: 1 }, "secretoIncorrecto", { expiresIn: "1h" });
      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", `Bearer ${tokenMalo}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token inválido o expirado");
    });
  });

  // ─────────────────────────────────────────────
  // TOKEN VÁLIDO
  // ─────────────────────────────────────────────
  describe("Token válido", () => {
    test("pasa el middleware con token válido de docente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerReservasUsuario.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`);
      expect(res.status).toBe(200);
    });

    test("pasa el middleware con token de gerente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerReservasUsuario.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", `Bearer ${tokenGerente()}`);
      expect(res.status).toBe(200);
    });
  });
});