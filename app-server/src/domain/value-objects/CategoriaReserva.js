const CATEGORIAS_VALIDAS = [
  "aula",
  "seminario",
  "laboratorio",
  "despacho",
  "sala comun",
];

const TRANSICIONES_VALIDAS = {
  aula:       ["seminario", "sala comun"],
  laboratorio:["aula", "seminario"],
  seminario:  ["aula", "sala comun"],
  despacho:   [],
  "sala comun":["aula", "seminario"],
};

class CategoriaReserva {
  constructor(valor) {
    const normalizado = (valor || "").toString().trim().toLowerCase();
    if (!CATEGORIAS_VALIDAS.includes(normalizado)) {
      throw new Error(`Categoría no válida: '${valor}'. Valores permitidos: ${CATEGORIAS_VALIDAS.join(", ")}`);
    }
    this._valor = normalizado;
  }

  get valor() {
    return this._valor;
  }

  equals(otraCategoria) {
    if (!(otraCategoria instanceof CategoriaReserva)) return false;
    return this._valor === otraCategoria._valor;
  }

  esAula()       { return this._valor === "aula"; }
  esSeminario()  { return this._valor === "seminario"; }
  esLaboratorio(){ return this._valor === "laboratorio"; }
  esDespacho()   { return this._valor === "despacho"; }
  esSalaComun()  { return this._valor === "sala comun"; }

  toString() {
    return this._valor;
  }

  static get VALORES() {
    return [...CATEGORIAS_VALIDAS];
  }

  static esTransicionValida(categoriaOrigen, categoriaDestino) {
    const origen  = (categoriaOrigen  instanceof CategoriaReserva) ? categoriaOrigen.valor  : categoriaOrigen;
    const destino = (categoriaDestino instanceof CategoriaReserva) ? categoriaDestino.valor : categoriaDestino;
    return (TRANSICIONES_VALIDAS[origen] || []).includes(destino);
  }
}

module.exports = CategoriaReserva;