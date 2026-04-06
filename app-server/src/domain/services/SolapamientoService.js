const PeriodoTiempo = require("../value-objects/PeriodoTiempo");

/**
 * Servicio de dominio: lógica de solapamiento entre reservas.
 * No pertenece a ninguna entidad concreta — opera sobre dos periodos.
 * Todas sus funciones son sin efectos secundarios (solo evalúan condiciones).
 */
class SolapamientoService {
  /**
   * Determina si dos reservas se solapan en el tiempo.
   * @param {Object} reservaA - { fecha, horaInicio, duracion }
   * @param {Object} reservaB - { fecha, horaInicio, duracion }
   * @returns {boolean}
   */
  static seSolapan(reservaA, reservaB) {
    const periodoA = new PeriodoTiempo(reservaA.fecha, reservaA.horaInicio, reservaA.duracion);
    const periodoB = new PeriodoTiempo(reservaB.fecha, reservaB.horaInicio, reservaB.duracion);
    return periodoA.seSOlapaConOtro(periodoB);
  }

  /**
   * Dado un periodo nuevo y una lista de reservas existentes,
   * devuelve las reservas que se solapan con él.
   * Función sin efectos secundarios — no modifica nada.
   * @param {{ fecha: string, horaInicio: string, duracion: number }} periodoNuevo
   * @param {Array<{ fecha: string, horaInicio: string, duracion: number }>} reservasExistentes
   * @returns {Array}
   */
  static filtrarSolapadas(periodoNuevo, reservasExistentes) {
    const periodo = new PeriodoTiempo(
      periodoNuevo.fecha,
      periodoNuevo.horaInicio,
      periodoNuevo.duracion
    );

    return reservasExistentes.filter((r) => {
      try {
        const periodoExistente = new PeriodoTiempo(r.fecha, r.horaInicio, r.duracion);
        return periodo.seSOlapaConOtro(periodoExistente);
      } catch {
        return false;
      }
    });
  }

  /**
   * Comprueba si existe algún solapamiento en una lista de reservas.
   * Útil para validación previa sin ir a la BD.
   * @param {Array} reservas
   * @returns {boolean}
   */
  static hayConflictoInterno(reservas) {
    for (let i = 0; i < reservas.length; i++) {
      for (let j = i + 1; j < reservas.length; j++) {
        if (SolapamientoService.seSolapan(reservas[i], reservas[j])) {
          return true;
        }
      }
    }
    return false;
  }
}

module.exports = SolapamientoService;