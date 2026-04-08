const PeriodoTiempo = require("../value-objects/PeriodoTiempo");

/**
 * @aggregate Reserva
 * Raíz del agregado Reserva.
 *
 * Frontera del agregado:
 * - PeriodoTiempo (value object) — encapsula fecha, horaInicio y duracion
 *
 * Referencias indirectas a raíces de otros agregados:
 * - espacios   → lista de { espacioId, numPersonas } — raíces del agregado Espacio
 * - usuarioId  → raíz del agregado Usuario
 *
 * Invariante de clase:
 * - espacios es un array con al menos un elemento
 * - cada elemento de espacios tiene espacioId obligatorio y numPersonas opcional
 * - usuarioId nunca es null
 * - estado es siempre uno de: "aceptada", "cancelada", "finalizada", "rechazada"
 * - _periodo es siempre un PeriodoTiempo válido
 * - descripcion, si está definida, no supera 500 caracteres
 */
class Reserva {
  constructor({
    id = null,
    espacios,
    usuarioId,
    fecha,
    horaInicio,
    duracion,
    tipoUso = null,
    descripcion = null,
    estado = "aceptada",
  }) {
    // Precondición: espacios debe ser un array con al menos un elemento
    if (!espacios || !Array.isArray(espacios) || espacios.length === 0) {
      throw new Error("espacios debe ser un array con al menos un espacio");
    }
    for (const e of espacios) {
      if (!e.espacioId) throw new Error("Cada espacio debe tener espacioId");
      if (e.numPersonas !== null && e.numPersonas !== undefined) {
        const n = Number(e.numPersonas);
        if (Number.isNaN(n) || n <= 0) throw new Error("numPersonas debe ser mayor que 0");
      }
    }

    // Precondición: usuarioId es obligatorio
    if (!usuarioId) throw new Error("usuarioId obligatorio");

    // PeriodoTiempo valida fecha, horaInicio y duracion internamente
    this._periodo = new PeriodoTiempo(fecha, horaInicio, duracion);

    const TIPOS_USO_VALIDOS = ["docencia", "reunion", "examen", "otros"];
    if (tipoUso && !TIPOS_USO_VALIDOS.includes(tipoUso)) {
      throw new Error(`tipoUso no válido: '${tipoUso}'`);
    }

    if (descripcion && descripcion.length > 500) {
      throw new Error("descripcion no puede superar 500 caracteres");
    }

    this.id          = id;
    this.espacios    = espacios.map((e) => ({
      espacioId:   Number(e.espacioId),
      numPersonas: e.numPersonas != null ? Number(e.numPersonas) : null,
    }));
    this.usuarioId   = usuarioId;
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
   * Devuelve los ids de los espacios de la reserva.
   * Función sin efectos secundarios.
   * @returns {number[]}
   */
  get espacioIds() {
    return this.espacios.map((e) => e.espacioId);
  }

  /**
   * Comprueba si esta reserva incluye un espacio concreto.
   * Función sin efectos secundarios.
   * @param {number} espacioId
   * @returns {boolean}
   */
  incluyeEspacio(espacioId) {
    return this.espacios.some((e) => e.espacioId === Number(espacioId));
  }

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