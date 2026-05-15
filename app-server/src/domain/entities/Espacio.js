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
 * - departamentoId      → raíz del agregado Departamento
 * - edificioId         → raíz del agregado Edificio
 * - usuariosAsignados  → lista de ids de raíces del agregado Usuario
 *
 * Invariante de clase:
 * - reservable es siempre un booleano
 * - asignadoAEina es siempre un booleano
 * - _categoria es un CategoriaReserva válido o null si la categoría no es reservable
 * - aforo, si está definido, es un número no negativo
 * - usuariosAsignados es siempre un array (puede estar vacío)
 * - horarioApertura y horarioCierre son null si el espacio hereda el horario del edificio
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
    asignadoAEina     = false,
    departamentoId    = null,
    edificioId        = null,
    usuariosAsignados = [],
    horarioApertura     = null,
    horarioCierre       = null,
    porcentajeOcupacion = null,
  }) {
    this._categoriaRaw = categoria || null;

    const categoriaLower = (categoria || "").toLowerCase();
    this._categoria = CATEGORIAS_RESERVABLES.includes(categoriaLower)
      ? new CategoriaReserva(categoria)
      : null;

    this.gid               = gid;
    this.idEspacio         = idEspacio;
    this.nombre            = nombre;
    this.uso               = uso;
    this.edificio          = edificio;
    this.planta            = planta;
    this.superficie        = superficie;
    this.reservable        = !!reservable;
    this.aforo             = aforo;
    this.geom              = geom;
    this.asignadoAEina     = !!asignadoAEina;
    this.departamentoId    = departamentoId;
    this.edificioId        = edificioId;
    this.usuariosAsignados = Array.isArray(usuariosAsignados) ? usuariosAsignados : [];
    this.horarioApertura     = horarioApertura     || null;
    this.horarioCierre       = horarioCierre       || null;
    this.porcentajeOcupacion = porcentajeOcupacion ?? null;
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
    const aforoPermitido = Math.ceil(this.aforo * (porcentajeMaximo / 100));
    return numPersonas <= aforoPermitido;
  }

  /**
   * Comprueba si el espacio está asignado a un usuario concreto.
   * Función sin efectos secundarios.
   * Precondición: usuarioId es un número válido
   * Postcondición: devuelve true si el usuario está en la lista de asignados
   * @param {number} usuarioId
   * @returns {boolean}
   */
  estaAsignadoA(usuarioId) {
    return this.usuariosAsignados.some((id) => String(id) === String(usuarioId));
  }

  /**
   * Devuelve el porcentaje de ocupación efectivo del espacio.
   * Si el espacio tiene porcentaje propio lo usa, si no hereda el del edificio.
   * Función sin efectos secundarios.
   * @param {{ porcentajeOcupacion: number|null }|null} edificio
   * @returns {number} porcentaje entre 0 y 100
   */
  getPorcentajeEfectivo(edificio = null) {
    return this.porcentajeOcupacion ?? edificio?.porcentajeOcupacion ?? 100;
  }

  /**
   * Devuelve el horario efectivo del espacio.
   * Si el espacio tiene horario propio lo usa, si no hereda el del edificio.
   * Función sin efectos secundarios.
   * @param {{ horarioApertura: string|null, horarioCierre: string|null }|null} edificio
   * @returns {{ apertura: string|null, cierre: string|null }}
   */
  getHorarioEfectivo(edificio = null) {
    const apertura = this.horarioApertura ?? edificio?.horarioApertura ?? null;
    const cierre   = this.horarioCierre   ?? edificio?.horarioCierre   ?? null;
    return { apertura, cierre };
  }

  /**
   * Comprueba si el espacio tiene horario propio definido.
   * Función sin efectos secundarios.
   * @returns {boolean}
   */
  tieneHorarioPropio() {
    return this.horarioApertura !== null || this.horarioCierre !== null;
  }
}

module.exports = Espacio;