const CATEGORIAS_VALIDAS = [
  "aula",
  "seminario",
  "laboratorio",
  "despacho",
  "sala comun",
];

// La categoría de reserva es una clasificación flexible sobre el tipo físico del espacio.
// El gerente puede cambiarla libremente — un laboratorio puede reservarse como aula
// temporalmente y volver a ser laboratorio después. No hay restricciones entre categorías.
// La única restricción es que despacho no cambia porque es un tipo físico especial.
const TRANSICIONES_VALIDAS = {
  aula:        ["seminario", "laboratorio", "sala comun", "despacho"],
  laboratorio: ["aula", "seminario", "sala comun", "despacho"],
  seminario:   ["aula", "laboratorio", "sala comun", "despacho"],
  despacho:    [],
  "sala comun":["aula", "seminario", "laboratorio", "despacho"],
};

// Tipos de asignación permitidos por categoría según el enunciado C4
const ASIGNACIONES_VALIDAS = {
  aula:        ["eina"],
  "sala comun":["eina"],
  seminario:   ["eina", "departamento"],
  laboratorio: ["eina", "departamento"],
  despacho:    ["departamento", "persona"],
};

class CategoriaReserva {
  constructor(valor) {
    const normalizado = (valor || "").toString().trim().toLowerCase();
    if (!CATEGORIAS_VALIDAS.includes(normalizado)) {
      throw new Error(`Categoría no válida: '${valor}'. Valores permitidos: ${CATEGORIAS_VALIDAS.join(", ")}`);
    }
    this._valor = normalizado;
  }

  get valor() { return this._valor; }

  equals(otraCategoria) {
    if (!(otraCategoria instanceof CategoriaReserva)) return false;
    return this._valor === otraCategoria._valor;
  }

  esAula()        { return this._valor === "aula"; }
  esSeminario()   { return this._valor === "seminario"; }
  esLaboratorio() { return this._valor === "laboratorio"; }
  esDespacho()    { return this._valor === "despacho"; }
  esSalaComun()   { return this._valor === "sala comun"; }

  /**
   * Comprueba si un tipo de asignación es válido para esta categoría.
   * Función sin efectos secundarios.
   * @param {"eina"|"departamento"|"persona"} tipoAsignacion
   * @returns {boolean}
   */
  admiteAsignacion(tipoAsignacion) {
    return (ASIGNACIONES_VALIDAS[this._valor] || []).includes(tipoAsignacion);
  }

  /**
   * Devuelve los tipos de asignación válidos para esta categoría.
   * Función sin efectos secundarios.
   * @returns {string[]}
   */
  asignacionesPermitidas() {
    return ASIGNACIONES_VALIDAS[this._valor] || [];
  }

  toString() { return this._valor; }

  static get VALORES() { return [...CATEGORIAS_VALIDAS]; }

  /**
   * Comprueba si una transición de categoría es válida.
   * Si se proporciona el tipo físico del espacio (uso), las transiciones
   * se calculan desde el tipo físico original, no desde la categoría actual.
   * Así un laboratorio con categoría "aula" puede volver a "laboratorio"
   * porque su tipo físico lo permite.
   *
   * @param {string} categoriaOrigen - categoría de reserva actual
   * @param {string} categoriaDestino - categoría de reserva nueva
   * @param {string|null} usoFisico - tipo físico del espacio (uso original)
   */
  static esTransicionValida(categoriaOrigen, categoriaDestino, usoFisico = null) {
    const origen  = (categoriaOrigen  instanceof CategoriaReserva) ? categoriaOrigen.valor  : (categoriaOrigen  || "").toLowerCase();
    const destino = (categoriaDestino instanceof CategoriaReserva) ? categoriaDestino.valor : (categoriaDestino || "").toLowerCase();

    // Normalizar el uso físico al mismo formato que las categorías
    // El uso físico del GeoJSON puede tener valores como "SALA INFORMÁTICA"
    let usoNorm = null;
    if (usoFisico) {
      const u = usoFisico.toString().toLowerCase().trim();
      if (u.includes("laboratorio") || u.includes("lab") || u.includes("sala inform") || u.includes("informatica") || u.includes("informática")) usoNorm = "laboratorio";
      else if (u.includes("aula"))      usoNorm = "aula";
      else if (u.includes("seminario")) usoNorm = "seminario";
      else if (u.includes("despacho"))  usoNorm = "despacho";
      else if (u.includes("comun") || u.includes("común")) usoNorm = "sala comun";
      else usoNorm = u;
    }

    // Usar el tipo físico como base para calcular las transiciones si está disponible
    const base = usoNorm && TRANSICIONES_VALIDAS[usoNorm] !== undefined ? usoNorm : origen;
    const permitidas = TRANSICIONES_VALIDAS[base] || [];

    // Siempre se puede volver a la categoría del tipo físico original
    if (usoNorm && destino === usoNorm) return true;

    return permitidas.includes(destino);
  }
}

module.exports = CategoriaReserva;