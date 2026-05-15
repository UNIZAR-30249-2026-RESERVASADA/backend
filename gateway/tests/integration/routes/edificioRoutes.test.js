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

describe("Edificio routes", () => {

  // ─────────────────────────────────────────────
  // PATCH /api/edificio/:id
  // ─────────────────────────────────────────────
  describe("PATCH /api/edificio/:id", () => {
    test("devuelve 200 si gerente modifica edificio", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.modificarEdificio.mockResolvedValue({ id: 1, horarioApertura: "09:00", horarioCierre: "19:00" });

      const res = await request(app)
        .patch("/api/edificio/1")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ horarioApertura: "09:00", horarioCierre: "19:00" });

      expect(res.status).toBe(200);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .patch("/api/edificio/1")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ horarioApertura: "09:00", horarioCierre: "19:00" });

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app)
        .patch("/api/edificio/1")
        .send({ horarioApertura: "09:00", horarioCierre: "19:00" });

      expect(res.status).toBe(401);
    });

    test("con afectarTodos=true llama al cliente correctamente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.modificarEdificio.mockResolvedValue({ id: 1 });

      await request(app)
        .patch("/api/edificio/1?afectarTodos=true")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ horarioApertura: "09:00", horarioCierre: "19:00" });

      expect(appServerClient.modificarEdificio).toHaveBeenCalledWith(
        1,
        expect.any(Object),
        true,
        true
      );
    });

    test("propaga error del app server", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Edificio no encontrado");
      error.statusCode = 404;
      appServerClient.modificarEdificio.mockRejectedValue(error);

      const res = await request(app)
        .patch("/api/edificio/9999")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ porcentajeOcupacion: 50 });

      expect(res.status).toBe(404);
    });
  });
});