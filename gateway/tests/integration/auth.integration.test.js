const request = require("supertest");
const app = require("../../src/app");

describe("POST /api/auth/login", () => {
  test("devuelve 400 si faltan campos obligatorios", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "" });

    expect(res.statusCode).toBe(400);
  });
});