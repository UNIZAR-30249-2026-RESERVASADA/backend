const Reserva = require("../../../src/domain/entities/Reserva");

// Helper para crear reservas de prueba
function crearReserva(overrides = {}) {
  return new Reserva({
    espacios:   [{ espacioId: 5344, numPersonas: null }],
    usuarioId:  1,
    fecha:      "2026-05-21",
    horaInicio: "10:00",
    duracion:   60,
    estado:     "aceptada",
    ...overrides,
  });
}

describe("Reserva", () => {

  // ─────────────────────────────────────────────
  // CONSTRUCTOR — CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Constructor — casos válidos", () => {
    test("crea una reserva válida", () => {
      const r = crearReserva();
      expect(r.usuarioId).toBe(1);
      expect(r.fecha).toBe("2026-05-21");
      expect(r.horaInicio).toBe("10:00");
      expect(r.duracion).toBe(60);
      expect(r.estado).toBe("aceptada");
    });

    test("calcula horaFin correctamente", () => {
      const r = crearReserva({ horaInicio: "10:00", duracion: 60 });
      expect(r.horaFin).toBe("11:00");
    });

    test("estado por defecto es aceptada", () => {
      const r = new Reserva({
        espacios:   [{ espacioId: 5344, numPersonas: null }],
        usuarioId:  1,
        fecha:      "2026-05-21",
        horaInicio: "10:00",
        duracion:   60,
      });
      expect(r.estado).toBe("aceptada");
    });

    test("admite varios espacios", () => {
      const r = crearReserva({
        espacios: [
          { espacioId: 5344, numPersonas: 5 },
          { espacioId: 5345, numPersonas: 10 },
        ],
      });
      expect(r.espacios).toHaveLength(2);
    });

    test("admite tipoUso válido", () => {
      const r = crearReserva({ tipoUso: "docencia" });
      expect(r.tipoUso).toBe("docencia");
    });

    test("admite descripcion", () => {
      const r = crearReserva({ descripcion: "Clase de algoritmia" });
      expect(r.descripcion).toBe("Clase de algoritmia");
    });

    test("numPersonas se convierte a número", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: "5" }] });
      expect(r.espacios[0].numPersonas).toBe(5);
    });

    test("numPersonas null se mantiene null", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      expect(r.espacios[0].numPersonas).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // CONSTRUCTOR — CASOS INVÁLIDOS
  // ─────────────────────────────────────────────
  describe("Constructor — casos inválidos", () => {
    test("lanza error si espacios está vacío", () => {
      expect(() => crearReserva({ espacios: [] })).toThrow();
    });

    test("lanza error si espacios es null", () => {
      expect(() => crearReserva({ espacios: null })).toThrow();
    });

    test("lanza error si espacioId es null", () => {
      expect(() => crearReserva({ espacios: [{ espacioId: null }] })).toThrow();
    });

    test("lanza error si usuarioId es null", () => {
      expect(() => crearReserva({ usuarioId: null })).toThrow();
    });

    test("lanza error si tipoUso no es válido", () => {
      expect(() => crearReserva({ tipoUso: "inventado" })).toThrow();
    });

    test("lanza error si descripcion supera 500 caracteres", () => {
      expect(() => crearReserva({ descripcion: "a".repeat(501) })).toThrow();
    });

    test("lanza error si numPersonas es 0", () => {
      expect(() => crearReserva({ espacios: [{ espacioId: 5344, numPersonas: 0 }] })).toThrow();
    });

    test("lanza error si numPersonas es negativo", () => {
      expect(() => crearReserva({ espacios: [{ espacioId: 5344, numPersonas: -1 }] })).toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // espacioIds
  // ─────────────────────────────────────────────
  describe("espacioIds", () => {
    test("devuelve los ids de los espacios", () => {
      const r = crearReserva({
        espacios: [
          { espacioId: 5344, numPersonas: null },
          { espacioId: 5345, numPersonas: null },
        ],
      });
      expect(r.espacioIds).toEqual([5344, 5345]);
    });

    test("devuelve un solo id si hay un espacio", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      expect(r.espacioIds).toEqual([5344]);
    });
  });

  // ─────────────────────────────────────────────
  // incluyeEspacio
  // ─────────────────────────────────────────────
  describe("incluyeEspacio", () => {
    test("devuelve true si el espacio está incluido", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      expect(r.incluyeEspacio(5344)).toBe(true);
    });

    test("devuelve false si el espacio no está incluido", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      expect(r.incluyeEspacio(9999)).toBe(false);
    });

    test("funciona con string de id", () => {
      const r = crearReserva({ espacios: [{ espacioId: 5344, numPersonas: null }] });
      expect(r.incluyeEspacio("5344")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // estaActiva
  // ─────────────────────────────────────────────
  describe("estaActiva", () => {
    test("devuelve true si estado es aceptada", () => {
      const r = crearReserva({ estado: "aceptada" });
      expect(r.estaActiva()).toBe(true);
    });

    test("devuelve false si estado es cancelada", () => {
      const r = crearReserva({ estado: "cancelada" });
      expect(r.estaActiva()).toBe(false);
    });

    test("devuelve false si estado es finalizada", () => {
      const r = crearReserva({ estado: "finalizada" });
      expect(r.estaActiva()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // cancelar
  // ─────────────────────────────────────────────
  describe("cancelar", () => {
    test("cambia estado a cancelada", () => {
      const r = crearReserva();
      r.cancelar();
      expect(r.estado).toBe("cancelada");
    });

    test("estaActiva devuelve false tras cancelar", () => {
      const r = crearReserva();
      r.cancelar();
      expect(r.estaActiva()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // seSOlapaConOtra
  // ─────────────────────────────────────────────
  describe("seSOlapaConOtra", () => {
    test("detecta solapamiento exacto", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 });
      const r2 = crearReserva({ horaInicio: "10:00", duracion: 60 });
      expect(r1.seSOlapaConOtra(r2)).toBe(true);
    });

    test("no detecta solapamiento cuando son consecutivas", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r2 = crearReserva({ horaInicio: "11:00", duracion: 60 }); // 11:00-12:00
      expect(r1.seSOlapaConOtra(r2)).toBe(false);
    });

    test("no detecta solapamiento en fechas distintas", () => {
      const r1 = crearReserva({ fecha: "2026-05-21", horaInicio: "10:00", duracion: 60 });
      const r2 = crearReserva({ fecha: "2026-05-22", horaInicio: "10:00", duracion: 60 });
      expect(r1.seSOlapaConOtra(r2)).toBe(false);
    });

    test("detecta solapamiento parcial", () => {
      const r1 = crearReserva({ horaInicio: "10:00", duracion: 60 }); // 10:00-11:00
      const r2 = crearReserva({ horaInicio: "10:30", duracion: 60 }); // 10:30-11:30
      expect(r1.seSOlapaConOtra(r2)).toBe(true);
    });
  });
});