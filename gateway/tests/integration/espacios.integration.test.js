const request = require("supertest");
const app = require("../../src/app");
const appServerClient = require("../../src/services/appServerClient");

jest.mock("../../src/services/appServerClient");

describe("GET /api/espacios/metadatos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devuelve 200 y la lista de metadatos", async () => {
    const metadatosMock = [
      {
        id_espacio: 5333,
        categoria: "aula",
        reservable: true,
        aforo: 30,
        ocupado: false,
      },
      {
        id_espacio: 5334,
        categoria: "laboratorio",
        reservable: true,
        aforo: 20,
        ocupado: false,
      },
    ];

    appServerClient.obtenerMetadatosEspacios.mockResolvedValue(metadatosMock);

    const res = await request(app).get("/api/espacios/metadatos");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(metadatosMock);
    expect(appServerClient.obtenerMetadatosEspacios).toHaveBeenCalledTimes(1);
  });

  test("devuelve 500 si falla el appServerClient", async () => {
    appServerClient.obtenerMetadatosEspacios.mockRejectedValue(
      new Error("Error obteniendo metadatos")
    );

    const res = await request(app).get("/api/espacios/metadatos");

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message");
  });
});