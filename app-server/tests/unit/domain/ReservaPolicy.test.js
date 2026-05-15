const ReservaPolicy = require("../../../src/domain/policies/ReservaPolicy");

// Helper para crear departamentos mock
function dept(id) {
  return {
    id,
    esMismoDepartamento: (otro) => otro && String(otro.id) === String(id),
  };
}

const DEPT_INF  = dept(1);
const DEPT_ELEC = dept(2);

describe("ReservaPolicy.puedeReservar", () => {

  // ─────────────────────────────────────────────
  // GERENTE
  // ─────────────────────────────────────────────
  describe("Gerente", () => {
    test("puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("gerente", "aula")).toBe(true);
    });
    test("puede reservar laboratorio", () => {
      expect(ReservaPolicy.puedeReservar("gerente", "laboratorio")).toBe(true);
    });
    test("puede reservar despacho", () => {
      expect(ReservaPolicy.puedeReservar("gerente", "despacho")).toBe(true);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("gerente", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("gerente", "sala comun")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // ESTUDIANTE
  // ─────────────────────────────────────────────
  describe("Estudiante", () => {
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", "sala comun")).toBe(true);
    });
    test("no puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", "aula")).toBe(false);
    });
    test("no puede reservar laboratorio", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", "laboratorio")).toBe(false);
    });
    test("no puede reservar despacho", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", "despacho")).toBe(false);
    });
    test("no puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", "seminario")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // CONSERJE
  // ─────────────────────────────────────────────
  describe("Conserje", () => {
    test("puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("conserje", "aula")).toBe(true);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("conserje", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("conserje", "sala comun")).toBe(true);
    });
    test("puede reservar laboratorio", () => {
      expect(ReservaPolicy.puedeReservar("conserje", "laboratorio")).toBe(true);
    });
    test("no puede reservar despacho", () => {
      expect(ReservaPolicy.puedeReservar("conserje", "despacho")).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // TÉCNICO DE LABORATORIO
  // ─────────────────────────────────────────────
  describe("Técnico de laboratorio", () => {
    test("puede reservar laboratorio de su departamento", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar laboratorio de otro departamento", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    test("no puede reservar laboratorio de la EINA", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", DEPT_INF, null)).toBe(false);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "sala comun")).toBe(true);
    });
    test("no puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "aula")).toBe(false);
    });
    test("no puede reservar despacho", () => {
      expect(ReservaPolicy.puedeReservar("tecnico_laboratorio", "despacho", DEPT_INF, DEPT_INF)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // INVESTIGADOR CONTRATADO
  // ─────────────────────────────────────────────
  describe("Investigador contratado", () => {
    test("puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "aula")).toBe(true);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "sala comun")).toBe(true);
    });
    test("puede reservar laboratorio de su departamento", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar laboratorio de otro departamento", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    test("no puede reservar laboratorio de la EINA", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", DEPT_INF, null)).toBe(false);
    });
    // O3 — despacho asignado a departamento
    test("puede reservar despacho de su departamento (O3)", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "despacho", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar despacho de otro departamento (O3)", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "despacho", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    // O7 — despacho asignado a investigador visitante
    test("puede reservar despacho con visitante de su departamento (O7)", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "despacho", DEPT_INF, DEPT_INF, false, true)).toBe(true);
    });
    test("no puede reservar despacho con visitante de otro departamento (O7)", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "despacho", DEPT_INF, DEPT_ELEC, false, true)).toBe(false);
    });
    // Despacho asignado a persona no visitante — bloqueado
    test("no puede reservar despacho asignado a persona no visitante", () => {
      expect(ReservaPolicy.puedeReservar("investigador_contratado", "despacho", DEPT_INF, null, false, false)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // DOCENTE INVESTIGADOR
  // ─────────────────────────────────────────────
  describe("Docente investigador", () => {
    test("puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "aula")).toBe(true);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "sala comun")).toBe(true);
    });
    test("puede reservar laboratorio de su departamento", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar laboratorio de otro departamento", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    test("no puede reservar laboratorio de la EINA", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", DEPT_INF, null)).toBe(false);
    });
    // O3
    test("puede reservar despacho de su departamento (O3)", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "despacho", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar despacho de otro departamento (O3)", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "despacho", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    // O7
    test("puede reservar despacho con visitante de su departamento (O7)", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "despacho", DEPT_INF, DEPT_INF, false, true)).toBe(true);
    });
    test("no puede reservar despacho con visitante de otro departamento (O7)", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "despacho", DEPT_INF, DEPT_ELEC, false, true)).toBe(false);
    });
    test("no puede reservar despacho asignado a persona no visitante", () => {
      expect(ReservaPolicy.puedeReservar("docente_investigador", "despacho", DEPT_INF, null, false, false)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // INVESTIGADOR VISITANTE
  // ─────────────────────────────────────────────
  describe("Investigador visitante", () => {
    test("puede reservar aula", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "aula")).toBe(true);
    });
    test("puede reservar seminario", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "seminario")).toBe(true);
    });
    test("puede reservar sala comun", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "sala comun")).toBe(true);
    });
    test("puede reservar laboratorio de su departamento", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", DEPT_INF, DEPT_INF)).toBe(true);
    });
    test("no puede reservar laboratorio de otro departamento", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", DEPT_INF, DEPT_ELEC)).toBe(false);
    });
    test("no puede reservar laboratorio de la EINA", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", DEPT_INF, null)).toBe(false);
    });
    test("no puede reservar despacho", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "despacho", DEPT_INF, DEPT_INF, false, false)).toBe(false);
    });
    test("no puede reservar despacho aunque esté asignado a él", () => {
      expect(ReservaPolicy.puedeReservar("investigador_visitante", "despacho", DEPT_INF, null, true, true)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // CASOS INVÁLIDOS
  // ─────────────────────────────────────────────
  describe("Casos inválidos", () => {
    test("devuelve false si rol es null", () => {
      expect(ReservaPolicy.puedeReservar(null, "aula")).toBe(false);
    });
    test("devuelve false si categoria es null", () => {
      expect(ReservaPolicy.puedeReservar("estudiante", null)).toBe(false);
    });
    test("devuelve false si ambos son null", () => {
      expect(ReservaPolicy.puedeReservar(null, null)).toBe(false);
    });
  });
});