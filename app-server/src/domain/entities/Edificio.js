/**
 * @aggregate Edificio
 * Raíz del agregado Edificio.
 *
 * Frontera del agregado:
 * - Solo la entidad raíz, sin objetos valor ni entidades internas.
 *
 * Referencias indirectas desde otros agregados:
 * - Espacio.edificioId → este agregado
 *
 * Invariante de clase:
 * - id, nombre y campus nunca son null
 * - horarioCierre nunca es null
 * - porcentajeOcupacion, si está definido, es un número entre 0 y 100
 */
class Edificio {
  constructor({
    id,
    idEdificio,
    nombre,
    direccion,
    campus,
    horarioApertura,
    horarioCierre,
    porcentajeOcupacion = null,
  }) {
    // Precondición: id, nombre, campus y horarioCierre son obligatorios
    if (!id)           throw new Error("El edificio debe tener un id");
    if (!nombre)       throw new Error("El edificio debe tener un nombre");
    if (!campus)       throw new Error("El edificio debe tener un campus");
    if (!horarioCierre) throw new Error("El edificio debe tener horario de cierre");

    this.id                  = id;
    this.idEdificio          = idEdificio;
    this.nombre              = nombre;
    this.direccion           = direccion || null;
    this.campus              = campus;
    this.horarioApertura     = horarioApertura || null;
    this.horarioCierre       = horarioCierre;
    this.porcentajeOcupacion = porcentajeOcupacion;
  }

  /**
   * Comprueba si el edificio está abierto a una hora dada.
   * Función sin efectos secundarios.
   * Precondición: hora tiene formato HH:MM
   * Postcondición: devuelve true si horarioApertura <= hora <= horarioCierre,
   *                o true si no hay horario definido
   * @param {string} hora - formato HH:MM
   * @returns {boolean}
   */
  estaAbierto(hora) {
    if (!this.horarioApertura || !this.horarioCierre) return true;
    return hora >= this.horarioApertura && hora <= this.horarioCierre;
  }

  /**
   * Devuelve el porcentaje máximo de ocupación permitido.
   * Función sin efectos secundarios.
   * Postcondición: devuelve un número entre 0 y 100. Si no está definido devuelve 100.
   * @returns {number}
   */
  getPorcentajeOcupacionMaximo() {
    return this.porcentajeOcupacion ?? 100;
  }
}

module.exports = Edificio;