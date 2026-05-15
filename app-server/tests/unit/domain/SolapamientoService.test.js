// tests/unit/domain/SolapamientoService.test.js

const SolapamientoService = require("../../../src/domain/services/SolapamientoService");
const Reserva             = require("../../../src/domain/entities/Reserva");

// Helper para crear reservas de prueba
function crearReserva({ id = null, espacioId = 5344, fecha = "2026-05-21", horaInicio, duracion }) {
  return new Reserva({
    id,
    espacios:   [{ espacioId, numPersonas: null }],
    usuarioId:  1,
    fecha,
    horaInicio,
    duracion,
    estado:     "aceptada",
  });
}

describe("SolapamientoService", () => {

  // ─────────────────────────────────────────────
  // filtrarSolapadas
  // ─────────────────────────────────────────────
  describe("filtrarSolapadas", () => {
    test("devuelve vacío si no hay reservas existentes", () => {
      const nueva = crearReserva({ horaInicio: "10:00", duracion: 60 });
      expect(SolapamientoService.filtrarSolapadas(nueva, [])).toHaveLength(0);
    });

    test("detecta solapamiento exacto", () => {
      const nueva     = crearReserva({ horaInicio: "10:00", duracion: 60 });
      const existente = crearReserva({ horaInicio: "10:00", duracion: 60 });
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(1);
    });

    test("detecta solapamiento parcial al inicio", () => {
      const nueva     = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const existente = crearReserva({ horaInicio: "09:30", duracion: 60 }); // 09:30-10:30
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(1);
    });

    test("detecta solapamiento parcial al final", () => {
      const nueva     = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const existente = crearReserva({ horaInicio: "10:30", duracion: 60 }); // 10:30-11:30
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(1);
    });

    test("detecta solapamiento cuando existente contiene a la nueva", () => {
      const nueva     = crearReserva({ horaInicio: "10:00", duracion: 60 });  // 10:00-11:00
      const existente = crearReserva({ horaInicio: "09:00", duracion: 120 }); // 09:00-11:00
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(1);
    });

    test("detecta solapamiento cuando nueva contiene a la existente", () => {
      const nueva     = crearReserva({ horaInicio: "09:00", duracion: 120 }); // 09:00-11:00
      const existente = crearReserva({ horaInicio: "10:00", duracion: 60 });  // 10:00-11:00
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(1);
    });

    test("no detecta solapamiento cuando son consecutivas", () => {
      const nueva     = crearReserva({ horaInicio: "11:00", duracion: 60 }); // 11:00-12:00
      const existente = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(0);
    });

    test("no detecta solapamiento cuando la nueva es antes", () => {
      const nueva     = crearReserva({ horaInicio: "08:00", duracion: 60 }); // 08:00-09:00
      const existente = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(0);
    });

    test("no detecta solapamiento cuando son fechas distintas", () => {
      const nueva     = crearReserva({ fecha: "2026-05-21", horaInicio: "10:00", duracion: 60 });
      const existente = crearReserva({ fecha: "2026-05-22", horaInicio: "10:00", duracion: 60 });
      expect(SolapamientoService.filtrarSolapadas(nueva, [existente])).toHaveLength(0);
    });

    test("devuelve solo las solapadas de varias reservas", () => {
      const nueva = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r1    = crearReserva({ horaInicio: "09:00", duracion: 60 }); // 09:00-10:00 — NO solapa
      const r2    = crearReserva({ horaInicio: "10:30", duracion: 60 }); // 10:30-11:30 — SÍ solapa
      const r3    = crearReserva({ horaInicio: "11:00", duracion: 60 }); // 11:00-12:00 — NO solapa
      const r4    = crearReserva({ horaInicio: "10:00", duracion: 30 }); // 10:00-10:30 — SÍ solapa

      const solapadas = SolapamientoService.filtrarSolapadas(nueva, [r1, r2, r3, r4]);
      expect(solapadas).toHaveLength(2);
      expect(solapadas).toContain(r2);
      expect(solapadas).toContain(r4);
    });
  });

  // ─────────────────────────────────────────────
  // hayConflictoInterno
  // ─────────────────────────────────────────────
  describe("hayConflictoInterno", () => {
    test("devuelve false con lista vacía", () => {
      expect(SolapamientoService.hayConflictoInterno([])).toBe(false);
    });

    test("devuelve false con una sola reserva", () => {
      const r = crearReserva({ horaInicio: "10:00", duracion: 60 });
      expect(SolapamientoService.hayConflictoInterno([r])).toBe(false);
    });

    test("devuelve false cuando no hay conflictos", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r2 = crearReserva({ horaInicio: "11:00", duracion: 60 }); // 11:00-12:00
      const r3 = crearReserva({ horaInicio: "12:00", duracion: 60 }); // 12:00-13:00
      expect(SolapamientoService.hayConflictoInterno([r1, r2, r3])).toBe(false);
    });

    test("devuelve true cuando hay conflicto entre dos reservas", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r2 = crearReserva({ horaInicio: "10:30", duracion: 60 }); // 10:30-11:30
      expect(SolapamientoService.hayConflictoInterno([r1, r2])).toBe(true);
    });

    test("devuelve true cuando hay conflicto entre varias reservas", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r2 = crearReserva({ horaInicio: "11:00", duracion: 60 }); // 11:00-12:00
      const r3 = crearReserva({ horaInicio: "10:30", duracion: 60 }); // 10:30-11:30 — conflicto con r1 y r2
      expect(SolapamientoService.hayConflictoInterno([r1, r2, r3])).toBe(true);
    });

    test("devuelve false con reservas en fechas distintas aunque misma hora", () => {
      const r1 = crearReserva({ fecha: "2026-05-21", horaInicio: "10:00", duracion: 60 });
      const r2 = crearReserva({ fecha: "2026-05-22", horaInicio: "10:00", duracion: 60 });
      expect(SolapamientoService.hayConflictoInterno([r1, r2])).toBe(false);
    });
  });
});