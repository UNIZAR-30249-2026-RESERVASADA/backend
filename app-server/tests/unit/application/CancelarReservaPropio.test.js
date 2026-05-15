const CancelarReservaPropia = require("../../../src/application/use-cases/CancelarReservaPropia");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function crearReserva(overrides = {}) {
  return {
    id:         1,
    usuarioId:  1,
    fecha:      "2026-05-21",
    horaInicio: "10:00",
    horaFin:    "11:00",
    estado:     "aceptada",
    estaActiva: jest.fn().mockReturnValue(true),
    cancelar:   jest.fn(),
    ...overrides,
  };
}

function crearRepositorio(reserva, overrides = {}) {
  return {
    findById: jest.fn().mockResolvedValue(reserva),
    save:     jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function crearCasoDeUso(reserva, overrides = {}) {
  return new CancelarReservaPropia({
    reservaRepository: crearRepositorio(reserva, overrides.reservaRepository),
  });
}

const payloadBase = { reservaId: 1, usuarioId: 1 };

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe("CancelarReservaPropia", () => {

  // ─────────────────────────────────────────────
  // CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos válidos", () => {
    test("cancela la reserva correctamente", async () => {
      const reserva   = crearReserva();
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(reserva.cancelar).toHaveBeenCalled();
      expect(resultado.id).toBe(1);
    });

    test("guarda la reserva cancelada", async () => {
      const reserva   = crearReserva();
      const repo      = crearRepositorio(reserva);
      const casoDeUso = new CancelarReservaPropia({ reservaRepository: repo });
      await casoDeUso.execute(payloadBase);
      expect(repo.save).toHaveBeenCalledWith(reserva);
    });

    test("devuelve id y estado de la reserva", async () => {
      const reserva   = crearReserva();
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute(payloadBase);
      expect(resultado).toHaveProperty("id");
      expect(resultado).toHaveProperty("estado");
    });

    test("funciona con usuarioId como string", async () => {
      const reserva   = crearReserva({ usuarioId: 1 });
      const casoDeUso = crearCasoDeUso(reserva);
      const resultado = await casoDeUso.execute({ reservaId: 1, usuarioId: "1" });
      expect(reserva.cancelar).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE CAMPOS OBLIGATORIOS
  // ─────────────────────────────────────────────
  describe("Validaciones de campos obligatorios", () => {
    test("lanza 400 si reservaId es null", async () => {
      const casoDeUso = crearCasoDeUso(crearReserva());
      await expect(casoDeUso.execute({ reservaId: null, usuarioId: 1 }))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("lanza 400 si usuarioId es null", async () => {
      const casoDeUso = crearCasoDeUso(crearReserva());
      await expect(casoDeUso.execute({ reservaId: 1, usuarioId: null }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES DE RESERVA
  // ─────────────────────────────────────────────
  describe("Validaciones de reserva", () => {
    test("lanza 404 si la reserva no existe", async () => {
      const casoDeUso = new CancelarReservaPropia({
        reservaRepository: crearRepositorio(null),
      });
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    test("lanza 403 si la reserva no pertenece al usuario", async () => {
      const reserva   = crearReserva({ usuarioId: 99 });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute({ reservaId: 1, usuarioId: 1 }))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    test("lanza 400 si la reserva no está activa", async () => {
      const reserva   = crearReserva({ estaActiva: jest.fn().mockReturnValue(false) });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    test("no cancela si la reserva ya está cancelada", async () => {
      const reserva   = crearReserva({ estado: "cancelada", estaActiva: jest.fn().mockReturnValue(false) });
      const casoDeUso = crearCasoDeUso(reserva);
      await expect(casoDeUso.execute(payloadBase))
        .rejects.toMatchObject({ statusCode: 400 });
      expect(reserva.cancelar).not.toHaveBeenCalled();
    });
  });
});