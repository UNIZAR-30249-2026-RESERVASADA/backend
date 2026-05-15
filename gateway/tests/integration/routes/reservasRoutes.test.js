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

const reservaMock = { id: 1, estado: "aceptada" };

const payloadReservaValido = {
  espacios:   [{ espacioId: 5344, numPersonas: 5 }],
  fecha:      "2026-05-21",
  horaInicio: "10:00",
  duracion:   60,
  tipoUso:    "docencia",
};

describe("Reservas routes", () => {

  // ─────────────────────────────────────────────
  // POST /api/reservas
  // ─────────────────────────────────────────────
  describe("POST /api/reservas", () => {
    test("devuelve 201 al crear reserva correctamente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.crearReserva.mockResolvedValue(reservaMock);

      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send(payloadReservaValido);

      expect(res.status).toBe(201);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app)
        .post("/api/reservas")
        .send(payloadReservaValido);
      expect(res.status).toBe(401);
    });

    test("devuelve 400 si falta fecha", async () => {
      const { fecha, ...sinFecha } = payloadReservaValido;
      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send(sinFecha);
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si falta horaInicio", async () => {
      const { horaInicio, ...sinHora } = payloadReservaValido;
      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send(sinHora);
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si falta duracion", async () => {
      const { duracion, ...sinDuracion } = payloadReservaValido;
      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send(sinDuracion);
      expect(res.status).toBe(400);
    });

    test("devuelve 400 si espacios está vacío", async () => {
      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ ...payloadReservaValido, espacios: [] });
      expect(res.status).toBe(400);
    });

    test("propaga error del app server correctamente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("No se pueden hacer reservas en fin de semana");
      error.statusCode = 400;
      appServerClient.crearReserva.mockRejectedValue(error);

      const res = await request(app)
        .post("/api/reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send(payloadReservaValido);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No se pueden hacer reservas en fin de semana");
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/reservas/mis-reservas
  // ─────────────────────────────────────────────
  describe("GET /api/reservas/mis-reservas", () => {
    test("devuelve 200 con lista de reservas", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerReservasUsuario.mockResolvedValue([reservaMock]);

      const res = await request(app)
        .get("/api/reservas/mis-reservas")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).get("/api/reservas/mis-reservas");
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /api/reservas/:id
  // ─────────────────────────────────────────────
  describe("DELETE /api/reservas/:id", () => {
    test("devuelve 200 al cancelar reserva propia", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.cancelarReservaPropia.mockResolvedValue({ id: 1, estado: "cancelada" });

      const res = await request(app)
        .delete("/api/reservas/1")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).delete("/api/reservas/1");
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/reservas/vivas (gerente)
  // ─────────────────────────────────────────────
  describe("GET /api/reservas/vivas", () => {
    test("devuelve 200 si es gerente", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerReservasVivas.mockResolvedValue([reservaMock]);

      const res = await request(app)
        .get("/api/reservas/vivas")
        .set("Authorization", `Bearer ${tokenGerente()}`);

      expect(res.status).toBe(200);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .get("/api/reservas/vivas")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).get("/api/reservas/vivas");
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /api/reservas/:id/admin (gerente)
  // ─────────────────────────────────────────────
  describe("DELETE /api/reservas/:id/admin", () => {
    test("devuelve 200 si gerente elimina reserva", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.eliminarReserva.mockResolvedValue({ id: 1, eliminada: true });

      const res = await request(app)
        .delete("/api/reservas/1/admin")
        .set("Authorization", `Bearer ${tokenGerente()}`);

      expect(res.status).toBe(200);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .delete("/api/reservas/1/admin")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).delete("/api/reservas/1/admin");
      expect(res.status).toBe(401);
    });
  });
});