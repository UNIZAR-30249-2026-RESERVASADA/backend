const CategoriaReserva = require("../value-objects/CategoriaReserva");

const CATEGORIAS_RESERVABLES = ["aula", "seminario", "laboratorio", "despacho", "sala comun"];

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

  tieneCategoriaReservable() {
    return this._categoria !== null;
  }

  puedeReservarse() {
    return this.reservable === true && this.tieneCategoriaReservable();
  }

  admiteOcupacion(numPersonas, porcentajeMaximo = 100) {
    if (!this.aforo) return true;
    const aforoPermitido = Math.floor(this.aforo * (porcentajeMaximo / 100));
    return numPersonas <= aforoPermitido;
  }
}

module.exports = Espacio;