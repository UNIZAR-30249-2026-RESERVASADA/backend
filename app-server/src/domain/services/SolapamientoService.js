const Reserva = require("../entities/Reserva");

/**
 * Servicio de dominio: lógica de solapamiento entre reservas.
 * Opera sobre instancias de Reserva, no sobre periodos directamente.
 * Todas sus funciones son sin efectos secundarios (solo evalúan condiciones).
 */
class SolapamientoService {
  /**
   * Dado una nueva reserva y una lista de reservas existentes,
   * devuelve las que se solapan con ella.
   * Función sin efectos secundarios — no modifica nada.
   * Precondición: nuevaReserva es una instancia de Reserva válida
   * Precondición: reservasExistentes es un array de instancias de Reserva
   * Postcondición: devuelve el subconjunto de reservasExistentes que se solapan con nuevaReserva
   * @param {Reserva} nuevaReserva
   * @param {Reserva[]} reservasExistentes
   * @returns {Reserva[]}
   */
  static filtrarSolapadas(nuevaReserva, reservasExistentes) {
    return reservasExistentes.filter((r) => nuevaReserva.seSOlapaConOtra(r));
  }

  /**
   * Comprueba si existe algún solapamiento dentro de una lista de reservas.
   * Función sin efectos secundarios — no modifica nada.
   * Precondición: reservas es un array de instancias de Reserva
   * Postcondición: devuelve true si hay al menos un par de reservas solapadas
   * @param {Reserva[]} reservas
   * @returns {boolean}
   */
  static hayConflictoInterno(reservas) {
    for (let i = 0; i < reservas.length; i++) {
      for (let j = i + 1; j < reservas.length; j++) {
        if (reservas[i].seSOlapaConOtra(reservas[j])) return true;
      }
    }
    return false;
  }
}

module.exports = SolapamientoService;