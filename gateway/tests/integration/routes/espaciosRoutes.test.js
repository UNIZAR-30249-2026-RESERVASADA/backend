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

function tokenGerente() {
  return signToken({ id: 2, email: "gerente@unizar.es", rol: null, esGerente: true, departamentoId: null, nombre: "Gerente" });
}

describe("Espacios routes", () => {

  // ─────────────────────────────────────────────
  // GET /api/espacios/metadatos
  // ─────────────────────────────────────────────
  describe("GET /api/espacios/metadatos", () => {
    test("devuelve 200 con lista de espacios con token", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerMetadatosEspacios.mockResolvedValue([{ gid: 5344, nombre: "LAB 0.01" }]);

      const res = await request(app)
        .get("/api/espacios/metadatos")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("devuelve 200 sin token porque es ruta pública", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerMetadatosEspacios.mockResolvedValue([]);

      const res = await request(app).get("/api/espacios/metadatos");
      expect(res.status).toBe(200);
    });

    test("propaga error del app server", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Error interno");
      error.statusCode = 500;
      appServerClient.obtenerMetadatosEspacios.mockRejectedValue(error);

      const res = await request(app)
        .get("/api/espacios/metadatos")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(500);
    });
  });

  // ─────────────────────────────────────────────
  // PATCH /api/espacios/:id
  // ─────────────────────────────────────────────
  describe("PATCH /api/espacios/:id", () => {
    test("devuelve 200 si gerente modifica espacio", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.modificarEspacio.mockResolvedValue({ gid: 5344, reservable: false });

      const res = await request(app)
        .patch("/api/espacios/5344")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ reservable: false });

      expect(res.status).toBe(200);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .patch("/api/espacios/5344")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ reservable: false });

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app)
        .patch("/api/espacios/5344")
        .send({ reservable: false });

      expect(res.status).toBe(401);
    });

    test("propaga error del app server", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Espacio no encontrado");
      error.statusCode = 404;
      appServerClient.modificarEspacio.mockRejectedValue(error);

      const res = await request(app)
        .patch("/api/espacios/9999")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ reservable: false });

      expect(res.status).toBe(404);
    });
  });
});