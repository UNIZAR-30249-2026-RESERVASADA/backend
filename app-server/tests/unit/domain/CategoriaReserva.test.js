// tests/unit/domain/CategoriaReserva.test.js

const CategoriaReserva = require("../../../src/domain/value-objects/CategoriaReserva");

describe("CategoriaReserva", () => {

  // ─────────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────────
  describe("Constructor", () => {
    test("crea una categoría válida aula", () => {
      const c = new CategoriaReserva("aula");
      expect(c.valor).toBe("aula");
    });

    test("crea una categoría válida laboratorio", () => {
      const c = new CategoriaReserva("laboratorio");
      expect(c.valor).toBe("laboratorio");
    });

    test("crea una categoría válida seminario", () => {
      const c = new CategoriaReserva("seminario");
      expect(c.valor).toBe("seminario");
    });

    test("crea una categoría válida despacho", () => {
      const c = new CategoriaReserva("despacho");
      expect(c.valor).toBe("despacho");
    });

    test("crea una categoría válida sala comun", () => {
      const c = new CategoriaReserva("sala comun");
      expect(c.valor).toBe("sala comun");
    });

    test("normaliza a minúsculas", () => {
      const c = new CategoriaReserva("AULA");
      expect(c.valor).toBe("aula");
    });

    test("lanza error si categoría no válida", () => {
      expect(() => new CategoriaReserva("inventada")).toThrow();
    });

    test("lanza error si categoría es null", () => {
      expect(() => new CategoriaReserva(null)).toThrow();
    });

    test("lanza error si categoría está vacía", () => {
      expect(() => new CategoriaReserva("")).toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // MÉTODOS DE COMPROBACIÓN
  // ─────────────────────────────────────────────
  describe("Métodos de comprobación", () => {
    test("esAula devuelve true para aula", () => {
      expect(new CategoriaReserva("aula").esAula()).toBe(true);
    });

    test("esAula devuelve false para laboratorio", () => {
      expect(new CategoriaReserva("laboratorio").esAula()).toBe(false);
    });

    test("esLaboratorio devuelve true para laboratorio", () => {
      expect(new CategoriaReserva("laboratorio").esLaboratorio()).toBe(true);
    });

    test("esSeminario devuelve true para seminario", () => {
      expect(new CategoriaReserva("seminario").esSeminario()).toBe(true);
    });

    test("esDespacho devuelve true para despacho", () => {
      expect(new CategoriaReserva("despacho").esDespacho()).toBe(true);
    });

    test("esSalaComun devuelve true para sala comun", () => {
      expect(new CategoriaReserva("sala comun").esSalaComun()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // EQUALS
  // ─────────────────────────────────────────────
  describe("equals", () => {
    test("dos categorías iguales son iguales", () => {
      const c1 = new CategoriaReserva("aula");
      const c2 = new CategoriaReserva("aula");
      expect(c1.equals(c2)).toBe(true);
    });

    test("dos categorías distintas no son iguales", () => {
      const c1 = new CategoriaReserva("aula");
      const c2 = new CategoriaReserva("laboratorio");
      expect(c1.equals(c2)).toBe(false);
    });

    test("devuelve false si el argumento no es CategoriaReserva", () => {
      const c1 = new CategoriaReserva("aula");
      expect(c1.equals(null)).toBe(false);
      expect(c1.equals("aula")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // ADMITE ASIGNACIÓN
  // ─────────────────────────────────────────────
  describe("admiteAsignacion", () => {
    test("aula admite EINA", () => {
      expect(new CategoriaReserva("aula").admiteAsignacion("eina")).toBe(true);
    });

    test("aula no admite departamento", () => {
      expect(new CategoriaReserva("aula").admiteAsignacion("departamento")).toBe(false);
    });

    test("aula no admite persona", () => {
      expect(new CategoriaReserva("aula").admiteAsignacion("persona")).toBe(false);
    });

    test("sala comun admite EINA", () => {
      expect(new CategoriaReserva("sala comun").admiteAsignacion("eina")).toBe(true);
    });

    test("sala comun no admite departamento", () => {
      expect(new CategoriaReserva("sala comun").admiteAsignacion("departamento")).toBe(false);
    });

    test("seminario admite EINA", () => {
      expect(new CategoriaReserva("seminario").admiteAsignacion("eina")).toBe(true);
    });

    test("seminario admite departamento", () => {
      expect(new CategoriaReserva("seminario").admiteAsignacion("departamento")).toBe(true);
    });

    test("seminario no admite persona", () => {
      expect(new CategoriaReserva("seminario").admiteAsignacion("persona")).toBe(false);
    });

    test("laboratorio admite EINA", () => {
      expect(new CategoriaReserva("laboratorio").admiteAsignacion("eina")).toBe(true);
    });

    test("laboratorio admite departamento", () => {
      expect(new CategoriaReserva("laboratorio").admiteAsignacion("departamento")).toBe(true);
    });

    test("laboratorio no admite persona", () => {
      expect(new CategoriaReserva("laboratorio").admiteAsignacion("persona")).toBe(false);
    });

    test("despacho admite departamento", () => {
      expect(new CategoriaReserva("despacho").admiteAsignacion("departamento")).toBe(true);
    });

    test("despacho admite persona", () => {
      expect(new CategoriaReserva("despacho").admiteAsignacion("persona")).toBe(true);
    });

    test("despacho no admite EINA", () => {
      expect(new CategoriaReserva("despacho").admiteAsignacion("eina")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TRANSICIONES VÁLIDAS
  // ─────────────────────────────────────────────
  describe("esTransicionValida", () => {
    // Aula
    test("aula → seminario es válida", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "seminario")).toBe(true);
    });

    test("aula → sala comun es válida", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "sala comun")).toBe(true);
    });

    test("aula → laboratorio NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "laboratorio")).toBe(false);
    });

    test("aula → despacho NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "despacho")).toBe(false);
    });

    // Laboratorio
    test("laboratorio → aula es válida", () => {
      expect(CategoriaReserva.esTransicionValida("laboratorio", "aula")).toBe(true);
    });

    test("laboratorio → seminario es válida", () => {
      expect(CategoriaReserva.esTransicionValida("laboratorio", "seminario")).toBe(true);
    });

    test("laboratorio → sala comun NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("laboratorio", "sala comun")).toBe(false);
    });

    test("laboratorio → despacho NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("laboratorio", "despacho")).toBe(false);
    });

    // Seminario
    test("seminario → aula es válida", () => {
      expect(CategoriaReserva.esTransicionValida("seminario", "aula")).toBe(true);
    });

    test("seminario → sala comun es válida", () => {
      expect(CategoriaReserva.esTransicionValida("seminario", "sala comun")).toBe(true);
    });

    test("seminario → laboratorio NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("seminario", "laboratorio")).toBe(false);
    });

    test("seminario → despacho NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("seminario", "despacho")).toBe(false);
    });

    // Sala comun
    test("sala comun → aula es válida", () => {
      expect(CategoriaReserva.esTransicionValida("sala comun", "aula")).toBe(true);
    });

    test("sala comun → seminario es válida", () => {
      expect(CategoriaReserva.esTransicionValida("sala comun", "seminario")).toBe(true);
    });

    test("sala comun → laboratorio NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("sala comun", "laboratorio")).toBe(false);
    });

    test("sala comun → despacho NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("sala comun", "despacho")).toBe(false);
    });

    // Despacho — nunca puede cambiar
    test("despacho → aula NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("despacho", "aula")).toBe(false);
    });

    test("despacho → laboratorio NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("despacho", "laboratorio")).toBe(false);
    });

    test("despacho → seminario NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("despacho", "seminario")).toBe(false);
    });

    test("despacho → sala comun NO es válida", () => {
      expect(CategoriaReserva.esTransicionValida("despacho", "sala comun")).toBe(false);
    });

    // Vuelta al tipo físico original
    test("aula con uso físico laboratorio puede volver a laboratorio", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "laboratorio", "laboratorio")).toBe(true);
    });

    test("seminario con uso físico laboratorio puede volver a laboratorio", () => {
      expect(CategoriaReserva.esTransicionValida("seminario", "laboratorio", "laboratorio")).toBe(true);
    });

    test("aula con uso físico seminario puede volver a seminario", () => {
      expect(CategoriaReserva.esTransicionValida("aula", "seminario", "seminario")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // VALORES ESTÁTICOS
  // ─────────────────────────────────────────────
  describe("VALORES", () => {
    test("contiene todas las categorías válidas", () => {
      expect(CategoriaReserva.VALORES).toContain("aula");
      expect(CategoriaReserva.VALORES).toContain("laboratorio");
      expect(CategoriaReserva.VALORES).toContain("seminario");
      expect(CategoriaReserva.VALORES).toContain("despacho");
      expect(CategoriaReserva.VALORES).toContain("sala comun");
    });
  });
});