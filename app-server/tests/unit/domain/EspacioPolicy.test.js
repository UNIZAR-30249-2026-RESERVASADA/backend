const {
  normalizarCategoriaInicial,
  esReservableInicialmente,
} = require("../../../src/domain/policies/EspacioPolicy");

describe("EspacioPolicy.normalizarCategoriaInicial", () => {
  test("detecta aula como categoria aula", () => {
    expect(normalizarCategoriaInicial("AULA")).toBe("aula");
  });

  test("detecta laboratorio como categoria laboratorio", () => {
    expect(normalizarCategoriaInicial("LABORATORIO")).toBe("laboratorio");
  });

  test("detecta sala informática como laboratorio", () => {
    expect(normalizarCategoriaInicial("SALA INFORMÁTICA")).toBe("laboratorio");
  });

  test("detecta despacho como categoria despacho", () => {
    expect(normalizarCategoriaInicial("DESPACHO")).toBe("despacho");
  });

  test("detecta sala común como sala comun", () => {
    expect(normalizarCategoriaInicial("SALA COMÚN")).toBe("sala comun");
  });

  test("detecta pasillo como pasillo", () => {
    expect(normalizarCategoriaInicial("PASILLO")).toBe("pasillo");
  });

  test("devuelve otros si no reconoce la categoria", () => {
    expect(normalizarCategoriaInicial("almacen raro")).toBe("otros");
  });
});

describe("EspacioPolicy.esReservableInicialmente", () => {
  test("aula es reservable", () => {
    expect(esReservableInicialmente("aula")).toBe(true);
  });

  test("seminario es reservable", () => {
    expect(esReservableInicialmente("seminario")).toBe(true);
  });

  test("laboratorio es reservable", () => {
    expect(esReservableInicialmente("laboratorio")).toBe(true);
  });

  test("sala comun es reservable", () => {
    expect(esReservableInicialmente("sala comun")).toBe(true);
  });

  test("despacho es reservable", () => {
    expect(esReservableInicialmente("despacho")).toBe(true);
  });

  test("pasillo no es reservable", () => {
    expect(esReservableInicialmente("pasillo")).toBe(false);
  });

  test("otros no es reservable", () => {
    expect(esReservableInicialmente("otros")).toBe(false);
  });
});