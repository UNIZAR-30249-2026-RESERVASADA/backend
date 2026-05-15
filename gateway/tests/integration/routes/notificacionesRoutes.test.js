const request       = require("supertest");
const app           = require("../../../src/app");
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
  return signToken({ id: 1, email: "docente@unizar.es", rol: "docente_investigador", esGerente: false, departamentoId: 1, nombre: "Docente" });
}

describe("Notificaciones routes", () => {

  // ─────────────────────────────────────────────
  // GET /api/notificaciones
  // ─────────────────────────────────────────────
  describe("GET /api/notificaciones", () => {
    test("devuelve 200 con lista de notificaciones", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.getNotificaciones.mockResolvedValue([{ id: 1, motivo: "horario" }]);

      const res = await request(app)
        .get("/api/notificaciones")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).get("/api/notificaciones");
      expect(res.status).toBe(401);
    });

    test("propaga error del app server", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Error interno");
      error.statusCode = 500;
      appServerClient.getNotificaciones.mockRejectedValue(error);

      const res = await request(app)
        .get("/api/notificaciones")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(500);
    });
  });

  // ─────────────────────────────────────────────
  // PATCH /api/notificaciones/leidas
  // ─────────────────────────────────────────────
  describe("PATCH /api/notificaciones/leidas", () => {
    test("devuelve 200 al marcar notificaciones como leídas", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.marcarNotificacionesLeidas.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/notificaciones/leidas")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).patch("/api/notificaciones/leidas");
      expect(res.status).toBe(401);
    });
  });
});