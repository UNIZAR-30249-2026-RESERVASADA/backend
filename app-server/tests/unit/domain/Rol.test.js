// tests/unit/domain/Rol.test.js

const Rol = require("../../../src/domain/value-objects/Rol");

describe("Rol", () => {

  // ─────────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────────
  describe("Constructor", () => {
    test("crea un rol válido estudiante", () => {
      const r = new Rol("estudiante");
      expect(r.valor).toBe("estudiante");
    });

    test("crea un rol válido investigador_contratado", () => {
      const r = new Rol("investigador_contratado");
      expect(r.valor).toBe("investigador_contratado");
    });

    test("crea un rol válido docente_investigador", () => {
      const r = new Rol("docente_investigador");
      expect(r.valor).toBe("docente_investigador");
    });

    test("crea un rol válido tecnico_laboratorio", () => {
      const r = new Rol("tecnico_laboratorio");
      expect(r.valor).toBe("tecnico_laboratorio");
    });

    test("crea un rol válido conserje", () => {
      const r = new Rol("conserje");
      expect(r.valor).toBe("conserje");
    });

    test("crea un rol válido gerente", () => {
      const r = new Rol("gerente");
      expect(r.valor).toBe("gerente");
    });

    test("crea un rol válido investigador_visitante", () => {
      const r = new Rol("investigador_visitante");
      expect(r.valor).toBe("investigador_visitante");
    });

    test("normaliza a minúsculas", () => {
      const r = new Rol("ESTUDIANTE");
      expect(r.valor).toBe("estudiante");
    });

    test("lanza error si rol no válido", () => {
      expect(() => new Rol("superadmin")).toThrow();
    });

    test("lanza error si rol es null", () => {
      expect(() => new Rol(null)).toThrow();
    });

    test("lanza error si rol está vacío", () => {
      expect(() => new Rol("")).toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // MÉTODOS DE COMPROBACIÓN
  // ─────────────────────────────────────────────
  describe("Métodos de comprobación", () => {
    test("esEstudiante devuelve true para estudiante", () => {
      expect(new Rol("estudiante").esEstudiante()).toBe(true);
    });

    test("esEstudiante devuelve false para otro rol", () => {
      expect(new Rol("conserje").esEstudiante()).toBe(false);
    });

    test("esInvestigadorContratado devuelve true", () => {
      expect(new Rol("investigador_contratado").esInvestigadorContratado()).toBe(true);
    });

    test("esDocenteInvestigador devuelve true", () => {
      expect(new Rol("docente_investigador").esDocenteInvestigador()).toBe(true);
    });

    test("esTecnicoLaboratorio devuelve true", () => {
      expect(new Rol("tecnico_laboratorio").esTecnicoLaboratorio()).toBe(true);
    });

    test("esConserje devuelve true", () => {
      expect(new Rol("conserje").esConserje()).toBe(true);
    });

    test("esGerente devuelve true", () => {
      expect(new Rol("gerente").esGerente()).toBe(true);
    });

    test("esInvestigadorVisitante devuelve true", () => {
      expect(new Rol("investigador_visitante").esInvestigadorVisitante()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // REQUIERE DEPARTAMENTO
  // ─────────────────────────────────────────────
  describe("requiereDepartamento", () => {
    test("investigador_contratado requiere departamento", () => {
      expect(new Rol("investigador_contratado").requiereDepartamento()).toBe(true);
    });

    test("docente_investigador requiere departamento", () => {
      expect(new Rol("docente_investigador").requiereDepartamento()).toBe(true);
    });

    test("tecnico_laboratorio requiere departamento", () => {
      expect(new Rol("tecnico_laboratorio").requiereDepartamento()).toBe(true);
    });

    test("investigador_visitante requiere departamento", () => {
      expect(new Rol("investigador_visitante").requiereDepartamento()).toBe(true);
    });

    test("estudiante no requiere departamento", () => {
      expect(new Rol("estudiante").requiereDepartamento()).toBe(false);
    });

    test("conserje no requiere departamento", () => {
      expect(new Rol("conserje").requiereDepartamento()).toBe(false);
    });

    test("gerente no requiere departamento", () => {
      expect(new Rol("gerente").requiereDepartamento()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // PERMITE DEPARTAMENTO
  // ─────────────────────────────────────────────
  describe("permiteDepartamento", () => {
    test("investigador_contratado permite departamento", () => {
      expect(new Rol("investigador_contratado").permiteDepartamento()).toBe(true);
    });

    test("docente_investigador permite departamento", () => {
      expect(new Rol("docente_investigador").permiteDepartamento()).toBe(true);
    });

    test("tecnico_laboratorio permite departamento", () => {
      expect(new Rol("tecnico_laboratorio").permiteDepartamento()).toBe(true);
    });

    test("investigador_visitante permite departamento", () => {
      expect(new Rol("investigador_visitante").permiteDepartamento()).toBe(true);
    });

    test("estudiante no permite departamento", () => {
      expect(new Rol("estudiante").permiteDepartamento()).toBe(false);
    });

    test("conserje no permite departamento", () => {
      expect(new Rol("conserje").permiteDepartamento()).toBe(false);
    });

    test("gerente no permite departamento", () => {
      expect(new Rol("gerente").permiteDepartamento()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // EQUALS
  // ─────────────────────────────────────────────
  describe("equals", () => {
    test("dos roles iguales son iguales", () => {
      const r1 = new Rol("estudiante");
      const r2 = new Rol("estudiante");
      expect(r1.equals(r2)).toBe(true);
    });

    test("dos roles distintos no son iguales", () => {
      const r1 = new Rol("estudiante");
      const r2 = new Rol("conserje");
      expect(r1.equals(r2)).toBe(false);
    });

    test("devuelve false si el argumento no es Rol", () => {
      const r1 = new Rol("estudiante");
      expect(r1.equals(null)).toBe(false);
      expect(r1.equals("estudiante")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TRANSICIONES VÁLIDAS
  // ─────────────────────────────────────────────
  describe("esTransicionValida", () => {
    test("estudiante → investigador_contratado es válida", () => {
      expect(Rol.esTransicionValida("estudiante", "investigador_contratado")).toBe(true);
    });

    test("estudiante → docente_investigador NO es válida", () => {
      expect(Rol.esTransicionValida("estudiante", "docente_investigador")).toBe(false);
    });

    test("estudiante → conserje NO es válida", () => {
      expect(Rol.esTransicionValida("estudiante", "conserje")).toBe(false);
    });

    test("investigador_contratado → docente_investigador es válida", () => {
      expect(Rol.esTransicionValida("investigador_contratado", "docente_investigador")).toBe(true);
    });

    test("investigador_contratado → estudiante NO es válida", () => {
      expect(Rol.esTransicionValida("investigador_contratado", "estudiante")).toBe(false);
    });

    test("docente_investigador → ningún rol es válida", () => {
      expect(Rol.esTransicionValida("docente_investigador", "estudiante")).toBe(false);
      expect(Rol.esTransicionValida("docente_investigador", "investigador_contratado")).toBe(false);
      expect(Rol.esTransicionValida("docente_investigador", "conserje")).toBe(false);
    });

    test("tecnico_laboratorio → conserje es válida", () => {
      expect(Rol.esTransicionValida("tecnico_laboratorio", "conserje")).toBe(true);
    });

    test("tecnico_laboratorio → estudiante NO es válida", () => {
      expect(Rol.esTransicionValida("tecnico_laboratorio", "estudiante")).toBe(false);
    });

    test("conserje → tecnico_laboratorio es válida", () => {
      expect(Rol.esTransicionValida("conserje", "tecnico_laboratorio")).toBe(true);
    });

    test("conserje → estudiante NO es válida", () => {
      expect(Rol.esTransicionValida("conserje", "estudiante")).toBe(false);
    });

    test("gerente → ningún rol es válida", () => {
      expect(Rol.esTransicionValida("gerente", "estudiante")).toBe(false);
      expect(Rol.esTransicionValida("gerente", "docente_investigador")).toBe(false);
    });

    test("investigador_visitante → ningún rol es válida", () => {
      expect(Rol.esTransicionValida("investigador_visitante", "estudiante")).toBe(false);
      expect(Rol.esTransicionValida("investigador_visitante", "investigador_contratado")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // VALORES ESTÁTICOS
  // ─────────────────────────────────────────────
  describe("VALORES", () => {
    test("contiene todos los roles válidos", () => {
      expect(Rol.VALORES).toContain("estudiante");
      expect(Rol.VALORES).toContain("investigador_contratado");
      expect(Rol.VALORES).toContain("docente_investigador");
      expect(Rol.VALORES).toContain("tecnico_laboratorio");
      expect(Rol.VALORES).toContain("conserje");
      expect(Rol.VALORES).toContain("gerente");
      expect(Rol.VALORES).toContain("investigador_visitante");
    });
  });

  // ─────────────────────────────────────────────
  // TOSTRING
  // ─────────────────────────────────────────────
  describe("toString", () => {
    test("devuelve el valor del rol", () => {
      expect(new Rol("estudiante").toString()).toBe("estudiante");
    });
  });
});