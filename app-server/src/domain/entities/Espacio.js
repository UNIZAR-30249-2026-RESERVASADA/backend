const CategoriaReserva = require("../value-objects/CategoriaReserva");

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
    edificioId = null,
  }) {
    // CategoriaReserva valida que el valor sea uno de los permitidos
    this._categoria = new CategoriaReserva(categoria);

    this.gid          = gid;
    this.idEspacio    = idEspacio;
    this.nombre       = nombre;
    this.uso          = uso;
    this.edificio     = edificio;
    this.planta       = planta;
    this.superficie   = superficie;
    this.reservable   = !!reservable;
    this.aforo        = aforo;
    this.geom         = geom;
    this.departamentoId = departamentoId;
    this.edificioId   = edificioId;
  }

  get categoria() {
    return this._categoria.valor;
  }

  get categoriaVO() {
    return this._categoria;
  }

  /**
   * Comprueba si el espacio admite el número de personas indicado,
   * teniendo en cuenta el porcentaje máximo de ocupación.
   * Función sin efectos secundarios.
   * @param {number} numPersonas
   * @param {number} porcentajeMaximo - 0-100, por defecto 100
   * @returns {boolean}
   */
  admiteOcupacion(numPersonas, porcentajeMaximo = 100) {
    if (!this.aforo) return true;
    const aforoPermitido = Math.floor(this.aforo * (porcentajeMaximo / 100));
    return numPersonas <= aforoPermitido;
  }

  puedeReservarse() {
    return this.reservable === true;
  }
}

module.exports = Espacio;