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

const usuarioMock = { id: 10, nombre: "Nuevo Usuario", email: "nuevo@unizar.es", rol: "estudiante", esGerente: false, departamentoId: null };

describe("Usuarios routes", () => {

  // ─────────────────────────────────────────────
  // GET /api/usuarios/me
  // ─────────────────────────────────────────────
  describe("GET /api/usuarios/me", () => {
    test("devuelve 200 con datos del usuario", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.obtenerUsuario.mockResolvedValue(usuarioMock);

      const res = await request(app)
        .get("/api/usuarios/me")
        .set("Authorization", `Bearer ${tokenDocente()}`);

      expect(res.status).toBe(200);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app).get("/api/usuarios/me");
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/usuarios
  // ─────────────────────────────────────────────
  describe("POST /api/usuarios", () => {
    test("devuelve 201 si gerente crea usuario", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.crearUsuario.mockResolvedValue(usuarioMock);

      const res = await request(app)
        .post("/api/usuarios")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ nombre: "Nuevo", email: "nuevo@unizar.es", contrasenia: "pass123", rol: "estudiante" });

      expect(res.status).toBe(201);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .post("/api/usuarios")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ nombre: "Nuevo", email: "nuevo@unizar.es", contrasenia: "pass123", rol: "estudiante" });

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app)
        .post("/api/usuarios")
        .send({ nombre: "Nuevo", email: "nuevo@unizar.es", contrasenia: "pass123", rol: "estudiante" });

      expect(res.status).toBe(401);
    });

    test("propaga error 409 si email ya existe", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      const error = new Error("Ya existe un usuario con ese email");
      error.statusCode = 409;
      appServerClient.crearUsuario.mockRejectedValue(error);

      const res = await request(app)
        .post("/api/usuarios")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ nombre: "Nuevo", email: "existente@unizar.es", contrasenia: "pass123", rol: "estudiante" });

      expect(res.status).toBe(409);
    });
  });

  // ─────────────────────────────────────────────
  // PATCH /api/usuarios/:id
  // ─────────────────────────────────────────────
  describe("PATCH /api/usuarios/:id", () => {
    test("devuelve 200 si gerente modifica usuario", async () => {
      const appServerClient = require("../../../src/services/appServerClient");
      appServerClient.modificarUsuario.mockResolvedValue(usuarioMock);

      const res = await request(app)
        .patch("/api/usuarios/1")
        .set("Authorization", `Bearer ${tokenGerente()}`)
        .send({ rol: "investigador_contratado", departamentoId: 1 });

      expect(res.status).toBe(200);
    });

    test("devuelve 403 si no es gerente", async () => {
      const res = await request(app)
        .patch("/api/usuarios/1")
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ rol: "investigador_contratado" });

      expect(res.status).toBe(403);
    });

    test("devuelve 401 sin token", async () => {
      const res = await request(app)
        .patch("/api/usuarios/1")
        .send({ rol: "investigador_contratado" });

      expect(res.status).toBe(401);
    });
  });
});