const CategoriaReserva = require("../value-objects/CategoriaReserva");

const CATEGORIAS_RESERVABLES = ["aula", "seminario", "laboratorio", "despacho", "sala comun"];

/**
 * @aggregate Espacio
 * Raíz del agregado Espacio.
 *
 * Frontera del agregado:
 * - CategoriaReserva (value object) — categoría reservable del espacio
 *
 * Referencias indirectas a raíces de otros agregados:
 * - departamentoId → raíz del agregado Departamento
 * - edificioId    → raíz del agregado Edificio
 *
 * Invariante de clase:
 * - reservable es siempre un booleano
 * - _categoria es un CategoriaReserva válido o null si la categoría no es reservable
 * - aforo, si está definido, es un número no negativo
 */
class Espacio {
  constructor({
    gid,
    idEspacio,
    nombre,
    uso,
    categoria,
    edificio,
    planta,
    superficie,
    reservable,
    aforo,
    geom,
    departamentoId = null,
    edificioId     = null,
  }) {
    this._categoriaRaw = categoria || null;

    const categoriaLower = (categoria || "").toLowerCase();
    this._categoria = CATEGORIAS_RESERVABLES.includes(categoriaLower)
      ? new CategoriaReserva(categoria)
      : null;

    this.gid            = gid;
    this.idEspacio      = idEspacio;
    this.nombre         = nombre;
    this.uso            = uso;
    this.edificio       = edificio;
    this.planta         = planta;
    this.superficie     = superficie;
    this.reservable     = !!reservable;
    this.aforo          = aforo;
    this.geom           = geom;
    this.departamentoId = departamentoId;
    this.edificioId     = edificioId;
  }

  get categoria() {
    return this._categoria ? this._categoria.valor : this._categoriaRaw;
  }

  get categoriaVO() {
    return this._categoria;
  }

  /**
   * Función sin efectos secundarios.
   * Postcondición: devuelve true solo si _categoria no es null
   * @returns {boolean}
   */
  tieneCategoriaReservable() {
    return this._categoria !== null;
  }

  /**
   * Función sin efectos secundarios.
   * Postcondición: devuelve true solo si reservable === true y tiene categoría reservable válida
   * @returns {boolean}
   */
  puedeReservarse() {
    return this.reservable === true && this.tieneCategoriaReservable();
  }

  /**
   * Comprueba si el espacio admite el número de personas indicado.
   * Función sin efectos secundarios.
   * Precondición: numPersonas es un número positivo, porcentajeMaximo está entre 0 y 100
   * Postcondición: devuelve true si numPersonas <= aforo * (porcentajeMaximo / 100)
   * @param {number} numPersonas
   * @param {number} porcentajeMaximo - 0-100, por defecto 100
   * @returns {boolean}
   */
  admiteOcupacion(numPersonas, porcentajeMaximo = 100) {
    if (!this.aforo) return true;
    const aforoPermitido = Math.floor(this.aforo * (porcentajeMaximo / 100));
    return numPersonas <= aforoPermitido;
  }
}

module.exports = Espacio;