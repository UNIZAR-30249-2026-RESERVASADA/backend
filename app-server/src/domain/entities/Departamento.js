/**
 * @aggregate Departamento
 * Raíz del agregado Departamento.
 *
 * Frontera del agregado:
 * - Solo la entidad raíz, sin objetos valor ni entidades internas.
 *
 * Referencias indirectas desde otros agregados:
 * - Espacio.departamentoId → este agregado
 * - Usuario.departamentoId → este agregado
 *
 * Invariante de clase:
 * - id y nombre nunca son null ni vacíos
 */
class Departamento {
  constructor({ id, nombre }) {
    // Precondición: id y nombre son obligatorios
    if (!id)     throw new Error("El departamento debe tener un id");
    if (!nombre) throw new Error("El departamento debe tener un nombre");

    this.id     = id;
    this.nombre = nombre;
  }

  /**
   * Comprueba si este departamento es el mismo que otro por id.
   * Función sin efectos secundarios.
   * Precondición: otroDepartamento es una instancia de Departamento con id válido
   * Postcondición: devuelve true si ambos ids son iguales como string
   * @param {Departamento} otroDepartamento
   * @returns {boolean}
   */
  esMismoDepartamento(otroDepartamento) {
    return String(this.id) === String(otroDepartamento.id);
  }
}

module.exports = Departamento;