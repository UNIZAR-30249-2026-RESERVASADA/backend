const Reserva = require("../entities/Reserva");

/**
 * Factoría de Reserva.
 * Encapsula la creación de instancias de Reserva asegurando que
 * siempre se producen en un estado consistente y válido.
 */
class ReservaFactory {
  /**
   * Crea una nueva reserva en estado "aceptada".
   *
   * @param {object}   params
   * @param {Array<{espacioId: number, numPersonas: number|null}>} params.espacios
   * @param {number}   params.usuarioId
   * @param {string}   params.fecha       - formato YYYY-MM-DD
   * @param {string}   params.horaInicio  - formato HH:MM
   * @param {number}   params.duracion    - en minutos
   * @param {string|null} params.tipoUso
   * @param {string|null} params.descripcion
   * @returns {Reserva}
   */
  crear({ espacios, usuarioId, fecha, horaInicio, duracion, tipoUso, descripcion }) {
    return new Reserva({
      espacios,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      tipoUso:     tipoUso     || null,
      descripcion: descripcion || null,
      estado:      "aceptada",
    });
  }
}

module.exports = ReservaFactory;