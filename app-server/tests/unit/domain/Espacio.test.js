const Espacio = require("../../../src/domain/entities/Espacio");

// Helper para crear espacios de prueba
function crearEspacio(overrides = {}) {
  return new Espacio({
    gid:              5344,
    idEspacio:        "CRE.1065.00.130",
    nombre:           "LABORATORIO 0.01",
    uso:              "LABORATORIO",
    categoria:        "laboratorio",
    edificio:         "ADA BYRON",
    planta:           "0",
    superficie:       50,
    reservable:       true,
    aforo:            20,
    asignadoAEina:    false,
    departamentoId:   1,
    edificioId:       1,
    usuariosAsignados: [],
    ...overrides,
  });
}

describe("Espacio", () => {

  // ─────────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────────
  describe("Constructor", () => {
    test("crea un espacio válido", () => {
      const e = crearEspacio();
      expect(e.gid).toBe(5344);
      expect(e.categoria).toBe("laboratorio");
      expect(e.reservable).toBe(true);
      expect(e.aforo).toBe(20);
    });

    test("reservable es false por defecto si no se indica", () => {
      const e = crearEspacio({ reservable: undefined });
      expect(e.reservable).toBe(false);
    });

    test("asignadoAEina es false por defecto", () => {
      const e = crearEspacio({ asignadoAEina: undefined });
      expect(e.asignadoAEina).toBe(false);
    });

    test("usuariosAsignados es array vacío por defecto", () => {
      const e = crearEspacio({ usuariosAsignados: undefined });
      expect(e.usuariosAsignados).toEqual([]);
    });

    test("categoría no reservable → _categoria es null", () => {
      const e = crearEspacio({ categoria: "pasillo" });
      expect(e.tieneCategoriaReservable()).toBe(false);
    });

    test("horarioApertura y horarioCierre son null por defecto", () => {
      const e = crearEspacio();
      expect(e.horarioApertura).toBeNull();
      expect(e.horarioCierre).toBeNull();
    });

    test("porcentajeOcupacion es null por defecto", () => {
      const e = crearEspacio();
      expect(e.porcentajeOcupacion).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // tieneCategoriaReservable
  // ─────────────────────────────────────────────
  describe("tieneCategoriaReservable", () => {
    test("devuelve true para laboratorio", () => {
      expect(crearEspacio({ categoria: "laboratorio" }).tieneCategoriaReservable()).toBe(true);
    });

    test("devuelve true para aula", () => {
      expect(crearEspacio({ categoria: "aula" }).tieneCategoriaReservable()).toBe(true);
    });

    test("devuelve true para seminario", () => {
      expect(crearEspacio({ categoria: "seminario" }).tieneCategoriaReservable()).toBe(true);
    });

    test("devuelve true para despacho", () => {
      expect(crearEspacio({ categoria: "despacho" }).tieneCategoriaReservable()).toBe(true);
    });

    test("devuelve true para sala comun", () => {
      expect(crearEspacio({ categoria: "sala comun" }).tieneCategoriaReservable()).toBe(true);
    });

    test("devuelve false para pasillo", () => {
      expect(crearEspacio({ categoria: "pasillo" }).tieneCategoriaReservable()).toBe(false);
    });

    test("devuelve false para otros", () => {
      expect(crearEspacio({ categoria: "otros" }).tieneCategoriaReservable()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // puedeReservarse
  // ─────────────────────────────────────────────
  describe("puedeReservarse", () => {
    test("devuelve true si reservable y categoría reservable", () => {
      expect(crearEspacio({ reservable: true, categoria: "laboratorio" }).puedeReservarse()).toBe(true);
    });

    test("devuelve false si no reservable aunque categoría reservable", () => {
      expect(crearEspacio({ reservable: false, categoria: "laboratorio" }).puedeReservarse()).toBe(false);
    });

    test("devuelve false si reservable pero categoría no reservable", () => {
      expect(crearEspacio({ reservable: true, categoria: "pasillo" }).puedeReservarse()).toBe(false);
    });

    test("devuelve false si no reservable y categoría no reservable", () => {
      expect(crearEspacio({ reservable: false, categoria: "pasillo" }).puedeReservarse()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // admiteOcupacion
  // ─────────────────────────────────────────────
  describe("admiteOcupacion", () => {
    test("devuelve true si numPersonas es igual al aforo", () => {
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(20)).toBe(true);
    });

    test("devuelve true si numPersonas es menor al aforo", () => {
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(10)).toBe(true);
    });

    test("devuelve false si numPersonas supera el aforo", () => {
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(21)).toBe(false);
    });

    test("aplica porcentaje correctamente", () => {
      // aforo 20 al 50% → 10 plazas
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(10, 50)).toBe(true);
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(11, 50)).toBe(false);
    });

    test("redondea hacia arriba con Math.ceil", () => {
      // aforo 3 al 50% → Math.ceil(1.5) = 2 plazas
      expect(crearEspacio({ aforo: 3 }).admiteOcupacion(2, 50)).toBe(true);
      expect(crearEspacio({ aforo: 3 }).admiteOcupacion(3, 50)).toBe(false);
    });

    test("devuelve true si no hay aforo definido", () => {
      expect(crearEspacio({ aforo: null }).admiteOcupacion(9999)).toBe(true);
    });

    test("devuelve true con porcentaje 100 por defecto", () => {
      expect(crearEspacio({ aforo: 20 }).admiteOcupacion(20, 100)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // estaAsignadoA
  // ─────────────────────────────────────────────
  describe("estaAsignadoA", () => {
    test("devuelve true si el usuario está asignado", () => {
      const e = crearEspacio({ usuariosAsignados: [3] });
      expect(e.estaAsignadoA(3)).toBe(true);
    });

    test("devuelve false si el usuario no está asignado", () => {
      const e = crearEspacio({ usuariosAsignados: [3] });
      expect(e.estaAsignadoA(99)).toBe(false);
    });

    test("devuelve false si no hay usuarios asignados", () => {
      const e = crearEspacio({ usuariosAsignados: [] });
      expect(e.estaAsignadoA(3)).toBe(false);
    });

    test("funciona con string de id", () => {
      const e = crearEspacio({ usuariosAsignados: [3] });
      expect(e.estaAsignadoA("3")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // getPorcentajeEfectivo
  // ─────────────────────────────────────────────
  describe("getPorcentajeEfectivo", () => {
    test("usa el porcentaje propio si está definido", () => {
      const e = crearEspacio({ porcentajeOcupacion: 75 });
      expect(e.getPorcentajeEfectivo({ porcentajeOcupacion: 50 })).toBe(75);
    });

    test("hereda el porcentaje del edificio si el propio es null", () => {
      const e = crearEspacio({ porcentajeOcupacion: null });
      expect(e.getPorcentajeEfectivo({ porcentajeOcupacion: 50 })).toBe(50);
    });

    test("devuelve 100 si no hay porcentaje propio ni del edificio", () => {
      const e = crearEspacio({ porcentajeOcupacion: null });
      expect(e.getPorcentajeEfectivo(null)).toBe(100);
    });
  });

  // ─────────────────────────────────────────────
  // getHorarioEfectivo
  // ─────────────────────────────────────────────
  describe("getHorarioEfectivo", () => {
    test("usa el horario propio si está definido", () => {
      const e = crearEspacio({ horarioApertura: "09:00", horarioCierre: "18:00" });
      const h = e.getHorarioEfectivo({ horarioApertura: "08:00", horarioCierre: "20:00" });
      expect(h.apertura).toBe("09:00");
      expect(h.cierre).toBe("18:00");
    });

    test("hereda el horario del edificio si el propio es null", () => {
      const e = crearEspacio({ horarioApertura: null, horarioCierre: null });
      const h = e.getHorarioEfectivo({ horarioApertura: "08:00", horarioCierre: "20:00" });
      expect(h.apertura).toBe("08:00");
      expect(h.cierre).toBe("20:00");
    });

    test("devuelve null si no hay horario propio ni del edificio", () => {
      const e = crearEspacio({ horarioApertura: null, horarioCierre: null });
      const h = e.getHorarioEfectivo(null);
      expect(h.apertura).toBeNull();
      expect(h.cierre).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // tieneHorarioPropio
  // ─────────────────────────────────────────────
  describe("tieneHorarioPropio", () => {
    test("devuelve true si tiene horario propio", () => {
      const e = crearEspacio({ horarioApertura: "09:00", horarioCierre: "18:00" });
      expect(e.tieneHorarioPropio()).toBe(true);
    });

    test("devuelve false si no tiene horario propio", () => {
      const e = crearEspacio({ horarioApertura: null, horarioCierre: null });
      expect(e.tieneHorarioPropio()).toBe(false);
    });
  });
});