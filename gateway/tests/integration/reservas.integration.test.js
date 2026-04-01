const request = require("supertest");
const app = require("../../src/app");
const appServerClient = require("../../src/services/appServerClient");
const jwtService = require("../../src/services/jwtService");

jest.mock("../../src/services/appServerClient");
jest.mock("../../src/services/jwtService");

describe("POST /api/reservas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devuelve 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/reservas")
      .send({
        espacioId: 1,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      });

    expect(res.statusCode).toBe(401);
  });

  test("devuelve 400 si el body es inválido", async () => {
    jwtService.verifyToken.mockReturnValue({
      id: 3,
      email: "ana.docente@unizar.es",
      rol: "docente_investigador",
      departamentoId: 1,
      nombre: "Ana Docente",
    });

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", "Bearer token-falso")
      .send({
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      });

    expect(res.statusCode).toBe(400);
  });

  test("devuelve 201 y llama al appServerClient con usuarioId sacado del token", async () => {
    jwtService.verifyToken.mockReturnValue({
      id: 3,
      email: "ana.docente@unizar.es",
      rol: "docente_investigador",
      departamentoId: 1,
      nombre: "Ana Docente",
    });

    appServerClient.crearReserva.mockResolvedValue({
      id: 101,
      estado: "aceptada",
    });

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", "Bearer token-falso")
      .send({
        espacioId: 5333,
        fecha: "2026-03-31",
        horaInicio: "18:14",
        duracion: 1,
        numPersonas: 1,
        tipoUso: "docencia",
        descripcion: "hola",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      id: 101,
      estado: "aceptada",
    });

    expect(appServerClient.crearReserva).toHaveBeenCalledWith({
      espacioId: 5333,
      fecha: "2026-03-31",
      horaInicio: "18:14",
      duracion: 1,
      numPersonas: 1,
      tipoUso: "docencia",
      descripcion: "hola",
      usuarioId: 3,
    });
  });
});