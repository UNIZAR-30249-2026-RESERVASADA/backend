const ReservaPolicy = require("../../../src/domain/policies/ReservaPolicy");

describe("ReservaPolicy.puedeReservar", () => {
  test("devuelve false si no hay rolUsuario", () => {
    expect(
      ReservaPolicy.puedeReservar(null, "aula", null, null)
    ).toBe(false);
  });

  test("devuelve false si no hay categoriaEspacio", () => {
    expect(
      ReservaPolicy.puedeReservar("estudiante", null, null, null)
    ).toBe(false);
  });

  describe("rol estudiante", () => {
    test("puede reservar sala común", () => {
      expect(
        ReservaPolicy.puedeReservar("estudiante", "sala común", null, null)
      ).toBe(true);
    });

    test("no puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("estudiante", "aula", null, null)
      ).toBe(false);
    });
  });

  describe("rol investigador_contratado", () => {
    test("puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "aula", 1, null)
      ).toBe(true);
    });

    test("puede reservar seminario", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "seminario", 1, null)
      ).toBe(true);
    });

    test("puede reservar sala común", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "sala común", 1, null)
      ).toBe(true);
    });

    test("puede reservar laboratorio de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar laboratorio de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", 1, 2)
      ).toBe(false);
    });

    test("no puede reservar laboratorio si el espacio no tiene departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "laboratorio", 1, null)
      ).toBe(false);
    });

    test("puede reservar despacho de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "despacho", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar despacho de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_contratado", "despacho", 1, 2)
      ).toBe(false);
    });
  });

  describe("rol docente_investigador", () => {
    test("puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "aula", 1, null)
      ).toBe(true);
    });

    test("puede reservar seminario", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "seminario", 1, null)
      ).toBe(true);
    });

    test("puede reservar sala común", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "sala común", 1, null)
      ).toBe(true);
    });

    test("puede reservar laboratorio de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar laboratorio de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", 1, 2)
      ).toBe(false);
    });

    test("no puede reservar laboratorio si el espacio no tiene departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "laboratorio", 1, null)
      ).toBe(false);
    });

    test("puede reservar despacho de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "despacho", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar despacho de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("docente_investigador", "despacho", 1, 2)
      ).toBe(false);
    });
  });

  describe("rol tecnico_laboratorio", () => {
    test("puede reservar laboratorio de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar laboratorio de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", 1, 2)
      ).toBe(false);
    });

    test("no puede reservar laboratorio si el espacio no tiene departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("tecnico_laboratorio", "laboratorio", 1, null)
      ).toBe(false);
    });

    test("no puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("tecnico_laboratorio", "aula", 1, null)
      ).toBe(false);
    });
  });

  describe("rol conserje", () => {
    test("puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("conserje", "aula", null, null)
      ).toBe(true);
    });

    test("puede reservar seminario", () => {
      expect(
        ReservaPolicy.puedeReservar("conserje", "seminario", null, null)
      ).toBe(true);
    });

    test("puede reservar sala común", () => {
      expect(
        ReservaPolicy.puedeReservar("conserje", "sala común", null, null)
      ).toBe(true);
    });

    test("no puede reservar laboratorio", () => {
      expect(
        ReservaPolicy.puedeReservar("conserje", "laboratorio", null, 1)
      ).toBe(false);
    });
  });

  describe("rol investigador_visitante", () => {
    test("puede reservar aula", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "aula", 1, null)
      ).toBe(true);
    });

    test("puede reservar seminario", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "seminario", 1, null)
      ).toBe(true);
    });

    test("puede reservar sala común", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "sala común", 1, null)
      ).toBe(true);
    });

    test("puede reservar laboratorio de su departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", 1, 1)
      ).toBe(true);
    });

    test("no puede reservar laboratorio de otro departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", 1, 2)
      ).toBe(false);
    });

    test("no puede reservar laboratorio si el espacio no tiene departamento", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "laboratorio", 1, null)
      ).toBe(false);
    });

    test("no puede reservar despacho", () => {
      expect(
        ReservaPolicy.puedeReservar("investigador_visitante", "despacho", 1, 1)
      ).toBe(false);
    });
  });

  describe("rol gerente", () => {
    test("puede reservar cualquier espacio", () => {
      expect(
        ReservaPolicy.puedeReservar("gerente", "despacho", null, 2)
      ).toBe(true);
    });
  });

  test("devuelve false para rol desconocido", () => {
    expect(
      ReservaPolicy.puedeReservar("rol_raro", "aula", null, null)
    ).toBe(false);
  });
});

describe("ReservaPolicy.obtenerRestriccionesUI", () => {
  test("devuelve restricciones para estudiante", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("estudiante");

    expect(result.rol).toBe("estudiante");
    expect(result.puedeReservarTodo).toBe(false);
    expect(result.categoriasPermitidas).toContain("sala común");
    expect(result.categoriasConRestriccionDepartamento).toEqual([]);
    expect(result.mensaje).toContain("Solo Salas comunes");
  });

  test("devuelve restricciones para docente_investigador", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("docente_investigador");

    expect(result.rol).toBe("docente_investigador");
    expect(result.puedeReservarTodo).toBe(false);
    expect(result.categoriasPermitidas).toContain("laboratorio");
    expect(result.categoriasPermitidas).toContain("despacho");
    expect(result.categoriasConRestriccionDepartamento).toContain("laboratorio");
    expect(result.categoriasConRestriccionDepartamento).toContain("despacho");
  });

  test("devuelve restricciones para gerente", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("gerente");

    expect(result.rol).toBe("gerente");
    expect(result.puedeReservarTodo).toBe(true);
    expect(result.mensaje).toContain("cualquier espacio");
  });

  test("devuelve restricciones por defecto para rol desconocido", () => {
    const result = ReservaPolicy.obtenerRestriccionesUI("inventado");

    expect(result.rol).toBe("inventado");
    expect(result.puedeReservarTodo).toBe(false);
    expect(result.categoriasPermitidas).toEqual([]);
    expect(result.mensaje).toBe("Sin permisos definidos");
  });
});