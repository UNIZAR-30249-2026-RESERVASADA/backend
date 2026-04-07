const PeriodoTiempo = require("../value-objects/PeriodoTiempo");

/**
 * @aggregate Reserva
 * Raíz del agregado Reserva.
 *
 * Frontera del agregado:
 * - PeriodoTiempo (value object) — encapsula fecha, horaInicio y duracion
 *
 * Referencias indirectas a raíces de otros agregados:
 * - espacioId → raíz del agregado Espacio
 * - usuarioId → raíz del agregado Usuario
 *
 * Invariante de clase:
 * - espacioId y usuarioId nunca son null
 * - estado es siempre uno de: "aceptada", "cancelada", "finalizada", "rechazada"
 * - _periodo es siempre un PeriodoTiempo válido
 * - numPersonas, si está definido, es un número entero positivo
 * - descripcion, si está definida, no supera 500 caracteres
 */
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
    // Precondición: espacioId y usuarioId son obligatorios
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
   * Precondición: otraReserva es una instancia de Reserva con periodo válido
   * Postcondición: devuelve true si los periodos se solapan, false en caso contrario
   * @param {Reserva} otraReserva
   * @returns {boolean}
   */
  seSOlapaConOtra(otraReserva) {
    return this._periodo.seSOlapaConOtro(otraReserva.periodo);
  }

  /**
   * Función sin efectos secundarios.
   * Postcondición: devuelve true solo si estado === "aceptada"
   * @returns {boolean}
   */
  estaActiva() {
    return this.estado === "aceptada";
  }

  /**
   * Precondición: estado debe ser "aceptada"
   * Postcondición: estado pasa a ser "cancelada"
   */
  cancelar() {
    this.estado = "cancelada";
  }
}

module.exports = Reserva;