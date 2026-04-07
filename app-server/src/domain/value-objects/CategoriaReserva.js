/**
 * Objeto valor que representa la categoría reservable de un espacio.
 *
 * Invariante de clase:
 * - _valor es siempre uno de los valores permitidos: aula, seminario, laboratorio, despacho, sala comun
 * - _valor está siempre normalizado en minúsculas y sin espacios extra
 */
const CATEGORIAS_VALIDAS = [
  "aula",
  "seminario",
  "laboratorio",
  "despacho",
  "sala comun",
];

const TRANSICIONES_VALIDAS = {
  aula:         ["seminario", "sala comun"],
  laboratorio:  ["aula", "seminario"],
  seminario:    ["aula", "sala comun"],
  despacho:     [],
  "sala comun": ["aula", "seminario"],
};

class CategoriaReserva {
  /**
   * Precondición: valor es una cadena no vacía con un valor de categoría válido
   * Postcondición: objeto inmutable con _valor normalizado
   * @param {string} valor
   */
  constructor(valor) {
    const normalizado = (valor || "").toString().trim().toLowerCase();
    if (!CATEGORIAS_VALIDAS.includes(normalizado)) {
      throw new Error(`Categoría no válida: '${valor}'. Valores permitidos: ${CATEGORIAS_VALIDAS.join(", ")}`);
    }
    this._valor = normalizado;
  }

  get valor() { return this._valor; }

  /**
   * Función sin efectos secundarios.
   * Postcondición: devuelve true si ambas categorías tienen el mismo valor
   * @param {CategoriaReserva} otraCategoria
   * @returns {boolean}
   */
  equals(otraCategoria) {
    if (!(otraCategoria instanceof CategoriaReserva)) return false;
    return this._valor === otraCategoria._valor;
  }

  // Interfaces reveladoras — funciones sin efectos secundarios
  esAula()        { return this._valor === "aula"; }
  esSeminario()   { return this._valor === "seminario"; }
  esLaboratorio() { return this._valor === "laboratorio"; }
  esDespacho()    { return this._valor === "despacho"; }
  esSalaComun()   { return this._valor === "sala comun"; }

  toString() { return this._valor; }

  static get VALORES() { return [...CATEGORIAS_VALIDAS]; }

  /**
   * Comprueba si la transición entre dos categorías es válida.
   * Función sin efectos secundarios.
   * Precondición: categoriaOrigen y categoriaDestino son valores de categoría válidos
   * Postcondición: devuelve true si la transición está permitida
   */
  static esTransicionValida(categoriaOrigen, categoriaDestino) {
    const origen  = (categoriaOrigen  instanceof CategoriaReserva) ? categoriaOrigen.valor  : categoriaOrigen;
    const destino = (categoriaDestino instanceof CategoriaReserva) ? categoriaDestino.valor : categoriaDestino;
    return (TRANSICIONES_VALIDAS[origen] || []).includes(destino);
  }
}

module.exports = CategoriaReserva;