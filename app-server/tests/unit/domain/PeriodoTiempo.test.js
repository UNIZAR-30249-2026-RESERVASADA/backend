const PeriodoTiempo = require("../../../src/domain/value-objects/PeriodoTiempo");

describe("PeriodoTiempo", () => {

  // ─────────────────────────────────────────────
  // CONSTRUCTOR — CASOS VÁLIDOS
  // ─────────────────────────────────────────────
  describe("Constructor — casos válidos", () => {
    test("crea un periodo válido", () => {
      const p = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p.fecha).toBe("2026-05-21");
      expect(p.horaInicio).toBe("10:00");
      expect(p.duracion).toBe(60);
    });

    test("calcula horaFin correctamente", () => {
      const p = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p.horaFin).toBe("11:00");
    });

    test("calcula horaFin con minutos", () => {
      const p = new PeriodoTiempo("2026-05-21", "10:30", 60);
      expect(p.horaFin).toBe("11:30");
    });

    test("calcula horaFin que cruza la hora", () => {
      const p = new PeriodoTiempo("2026-05-21", "10:45", 30);
      expect(p.horaFin).toBe("11:15");
    });

    test("calcula horaFin con duracion de 90 minutos", () => {
      const p = new PeriodoTiempo("2026-05-21", "09:00", 90);
      expect(p.horaFin).toBe("10:30");
    });

    test("calcula horaFin con duracion de 120 minutos", () => {
      const p = new PeriodoTiempo("2026-05-21", "08:00", 120);
      expect(p.horaFin).toBe("10:00");
    });
  });

  // ─────────────────────────────────────────────
  // CONSTRUCTOR — CASOS INVÁLIDOS
  // ─────────────────────────────────────────────
  describe("Constructor — casos inválidos", () => {
    test("lanza error si fecha es null", () => {
      expect(() => new PeriodoTiempo(null, "10:00", 60)).toThrow();
    });

    test("lanza error si horaInicio es null", () => {
      expect(() => new PeriodoTiempo("2026-05-21", null, 60)).toThrow();
    });

    test("lanza error si duracion es 0", () => {
      expect(() => new PeriodoTiempo("2026-05-21", "10:00", 0)).toThrow();
    });

    test("lanza error si duracion es negativa", () => {
      expect(() => new PeriodoTiempo("2026-05-21", "10:00", -30)).toThrow();
    });

    test("lanza error si duracion no es número", () => {
      expect(() => new PeriodoTiempo("2026-05-21", "10:00", "abc")).toThrow();
    });

    test("lanza error si formato de fecha es incorrecto", () => {
      expect(() => new PeriodoTiempo("21-05-2026", "10:00", 60)).toThrow();
    });

    test("lanza error si formato de horaInicio es incorrecto", () => {
      expect(() => new PeriodoTiempo("2026-05-21", "10:00:00", 60)).toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // SOLAPAMIENTO
  // ─────────────────────────────────────────────
  describe("seSOlapaConOtro", () => {
    test("se solapa cuando son iguales", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p1.seSOlapaConOtro(p2)).toBe(true);
    });

    test("se solapa cuando uno empieza dentro del otro", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60); // 10:00-11:00
      const p2 = new PeriodoTiempo("2026-05-21", "10:30", 60); // 10:30-11:30
      expect(p1.seSOlapaConOtro(p2)).toBe(true);
    });

    test("se solapa cuando uno contiene al otro", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "09:00", 120); // 09:00-11:00
      const p2 = new PeriodoTiempo("2026-05-21", "09:30", 60);  // 09:30-10:30
      expect(p1.seSOlapaConOtro(p2)).toBe(true);
    });

    test("no se solapa cuando son consecutivos", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60); // 10:00-11:00
      const p2 = new PeriodoTiempo("2026-05-21", "11:00", 60); // 11:00-12:00
      expect(p1.seSOlapaConOtro(p2)).toBe(false);
    });

    test("no se solapa cuando el segundo es después", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60); // 10:00-11:00
      const p2 = new PeriodoTiempo("2026-05-21", "12:00", 60); // 12:00-13:00
      expect(p1.seSOlapaConOtro(p2)).toBe(false);
    });

    test("no se solapa cuando el segundo es antes", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "12:00", 60); // 12:00-13:00
      const p2 = new PeriodoTiempo("2026-05-21", "10:00", 60); // 10:00-11:00
      expect(p1.seSOlapaConOtro(p2)).toBe(false);
    });

    test("no se solapa cuando son fechas distintas", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-22", "10:00", 60);
      expect(p1.seSOlapaConOtro(p2)).toBe(false);
    });

    test("devuelve false si el argumento no es PeriodoTiempo", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p1.seSOlapaConOtro(null)).toBe(false);
      expect(p1.seSOlapaConOtro({})).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // EQUALS
  // ─────────────────────────────────────────────
  describe("equals", () => {
    test("dos periodos iguales son iguales", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p1.equals(p2)).toBe(true);
    });

    test("dos periodos con distinta fecha no son iguales", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-22", "10:00", 60);
      expect(p1.equals(p2)).toBe(false);
    });

    test("dos periodos con distinta horaInicio no son iguales", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-21", "11:00", 60);
      expect(p1.equals(p2)).toBe(false);
    });

    test("dos periodos con distinta duracion no son iguales", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      const p2 = new PeriodoTiempo("2026-05-21", "10:00", 90);
      expect(p1.equals(p2)).toBe(false);
    });

    test("devuelve false si el argumento no es PeriodoTiempo", () => {
      const p1 = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p1.equals(null)).toBe(false);
      expect(p1.equals({})).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TOSTRING
  // ─────────────────────────────────────────────
  describe("toString", () => {
    test("devuelve string con formato correcto", () => {
      const p = new PeriodoTiempo("2026-05-21", "10:00", 60);
      expect(p.toString()).toBe("2026-05-21 10:00 (60 min)");
    });
  });
});