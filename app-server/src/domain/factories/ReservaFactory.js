const Reserva = require("../entities/Reserva");

/**
 * Factoría de Reserva.
 * Encapsula la creación de instancias de Reserva asegurando que
 * siempre se producen en un estado consistente y válido.
 * No tiene responsabilidad en el modelo del dominio, pero vive
 * en la capa del dominio.
 */
class ReservaFactory {
  /**
   * Crea una nueva reserva en estado "aceptada".
   * El constructor de Reserva delega en PeriodoTiempo la validación
   * de fecha, horaInicio y duracion.
   *
   * @param {object} params
   * @param {number} params.espacioId
   * @param {number} params.usuarioId
   * @param {string} params.fecha       - formato YYYY-MM-DD
   * @param {string} params.horaInicio  - formato HH:MM
   * @param {number} params.duracion    - en minutos
   * @param {number|null} params.numPersonas
   * @param {string|null} params.tipoUso
   * @param {string|null} params.descripcion
   * @returns {Reserva}
   */
  crear({ espacioId, usuarioId, fecha, horaInicio, duracion, numPersonas, tipoUso, descripcion }) {
    return new Reserva({
      espacioId,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      numPersonas: numPersonas || null,
      tipoUso:     tipoUso    || null,
      descripcion: descripcion || null,
      estado:      "aceptada",
    });
  }
}

module.exports = ReservaFactory;