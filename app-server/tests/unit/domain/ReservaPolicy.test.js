const ReservaPolicy = require("../../../src/domain/policies/ReservaPolicy");

describe("ReservaPolicy.puedeReservar", () => {
  test("estudiante puede reservar sala común", () => {
    expect(
      ReservaPolicy.puedeReservar("estudiante", "sala común", null, null)
    ).toBe(true);
  });

  test("estudiante no puede reservar aula", () => {
    expect(
      ReservaPolicy.puedeReservar("estudiante", "aula", null, null)
    ).toBe(false);
  });

  test("docente_investigador puede reservar aula", () => {
    expect(
      ReservaPolicy.puedeReservar("docente_investigador", "aula", 1, null)
    ).toBe(true);
  });

  test("docente_investigador puede reservar laboratorio de su departamento", () => {
    expect(
      ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", 1, 1)
    ).toBe(true);
  });

  test("docente_investigador no puede reservar laboratorio de otro departamento", () => {
    expect(
      ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", 1, 2)
    ).toBe(false);
  });

  test("tecnico_laboratorio no puede reservar aula", () => {
    expect(
      ReservaPolicy.puedeReservar("tecnico_laboratorio", "aula", 1, null)
    ).toBe(false);
  });

  test("gerente puede reservar cualquier espacio", () => {
    expect(
      ReservaPolicy.puedeReservar("gerente", "despacho", null, 2)
    ).toBe(true);
  });
});

describe("ReservaPolicy.obtenerRestriccionesUI", () => {
  test("devuelve restricciones estructuradas para estudiante", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("estudiante");

    expect(result.rol).toBe("estudiante");
    expect(result.puedeReservarTodo).toBe(false);
    expect(result.categoriasPermitidas).toContain("sala común");
  });

  test("devuelve puedeReservarTodo=true para gerente", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("gerente");

    expect(result.rol).toBe("gerente");
    expect(result.puedeReservarTodo).toBe(true);
  });
});