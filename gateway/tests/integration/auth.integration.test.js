const request = require("supertest");
const app = require("../../src/app");
const appServerClient = require("../../src/services/appServerClient");
const jwtService = require("../../src/services/jwtService");

jest.mock("../../src/services/appServerClient");
jest.mock("../../src/services/jwtService");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devuelve 400 si faltan campos obligatorios", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "" });

    expect(res.statusCode).toBe(400);
  });

  test("devuelve 200 con token y usuario si el login es correcto", async () => {
    appServerClient.login.mockResolvedValue({
      usuario: {
        id: 3,
        nombre: "Ana Docente",
        email: "ana.docente@unizar.es",
        rol: "docente_investigador",
        departamentoId: 1,
      },
      restriccionesReserva: {
        mensaje: "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto), Despachos (solo de tu dpto)",
        categoriasPermitidas: ["aula", "seminario", "sala común", "laboratorio", "despacho"],
        categoriasConRestriccionDepartamento: ["laboratorio", "despacho"],
        puedeReservarTodo: false,
      },
    });

    jwtService.signToken.mockReturnValue("jwt-falso");

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "ana.docente@unizar.es",
        password: "password",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      token: "jwt-falso",
      usuario: {
        id: 3,
        nombre: "Ana Docente",
        email: "ana.docente@unizar.es",
        rol: "docente_investigador",
        departamentoId: 1,
      },
      restriccionesReserva: {
        mensaje: "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto), Despachos (solo de tu dpto)",
        categoriasPermitidas: ["aula", "seminario", "sala común", "laboratorio", "despacho"],
        categoriasConRestriccionDepartamento: ["laboratorio", "despacho"],
        puedeReservarTodo: false,
      },
    });
  });
});