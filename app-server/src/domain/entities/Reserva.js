const PeriodoTiempo    = require("../value-objects/PeriodoTiempo");
const CategoriaReserva = require("../value-objects/CategoriaReserva");

class Reserva {
  constructor({
    id = null,
    espacioId,
    usuarioId,
    fecha,
    horaInicio,
    duracion,
    numPersonas = null,
    tipoUso = null,
    descripcion = null,
    estado = "aceptada",
  }) {
    if (!espacioId) throw new Error("espacioId obligatorio");
    if (!usuarioId) throw new Error("usuarioId obligatorio");

    // PeriodoTiempo valida fecha, horaInicio y duracion internamente
    this._periodo = new PeriodoTiempo(fecha, horaInicio, duracion);

    if (numPersonas !== null && numPersonas !== undefined) {
      const n = Number(numPersonas);
      if (Number.isNaN(n) || n <= 0) throw new Error("numPersonas debe ser mayor que 0");
    }

    const TIPOS_USO_VALIDOS = ["docencia", "reunion", "examen", "otros"];
    if (tipoUso && !TIPOS_USO_VALIDOS.includes(tipoUso)) {
      throw new Error(`tipoUso no válido: '${tipoUso}'`);
    }

    if (descripcion && descripcion.length > 500) {
      throw new Error("descripcion no puede superar 500 caracteres");
    }

    this.id          = id;
    this.espacioId   = espacioId;
    this.usuarioId   = usuarioId;
    this.numPersonas = numPersonas !== null && numPersonas !== undefined ? Number(numPersonas) : null;
    this.tipoUso     = tipoUso;
    this.descripcion = descripcion;
    this.estado      = estado;
  }

  get fecha()      { return this._periodo.fecha; }
  get horaInicio() { return this._periodo.horaInicio; }
  get duracion()   { return this._periodo.duracion; }
  get horaFin()    { return this._periodo.horaFin; }
  get periodo()    { return this._periodo; }

  /**
   * Comprueba si esta reserva se solapa con otra.
   * Función sin efectos secundarios.
   * @param {Reserva} otraReserva
   * @returns {boolean}
   */
  seSOlapaConOtra(otraReserva) {
    return this._periodo.seSOlapaConOtro(otraReserva.periodo);
  }

  estaActiva() {
    return this.estado === "aceptada";
  }

  cancelar() {
    this.estado = "cancelada";
  }
}

module.exports = Reserva;