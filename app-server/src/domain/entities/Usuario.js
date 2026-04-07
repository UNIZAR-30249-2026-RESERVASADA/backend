const Rol = require("../value-objects/Rol");

/**
 * @aggregate Usuario
 * Raíz del agregado Usuario.
 *
 * Frontera del agregado:
 * - Rol (value object) — rol del usuario en el sistema
 *
 * Referencias indirectas a raíces de otros agregados:
 * - departamentoId → raíz del agregado Departamento
 *
 * Invariante de clase:
 * - email nunca es null y tiene siempre formato válido
 * - contrasenia nunca es null
 * - _rol es un Rol válido o null si no tiene rol asignado
 * - esGerente es siempre un booleano
 */
class Usuario {
  constructor({
    id = null,
    nombre,
    email,
    contrasenia,
    rol = null,
    esGerente = false,
    departamentoId = null,
  }) {
    // Precondición: email y contrasenia son obligatorios
    if (!email) throw new Error("El email es obligatorio");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("El email no tiene un formato válido");
    }
    if (!contrasenia) throw new Error("La contraseña es obligatoria");

    // Rol valida que el valor sea uno de los permitidos
    this._rol = rol ? new Rol(rol) : null;

    this.id             = id;
    this.nombre         = nombre ?? "";
    this.email          = email;
    this.contrasenia    = contrasenia;
    this.esGerente      = !!esGerente;
    this.departamentoId = departamentoId;
  }

  get rol()   { return this._rol ? this._rol.valor : null; }
  get rolVO() { return this._rol; }

  /**
   * Comprueba si el usuario tiene permisos de administración.
   * Función sin efectos secundarios.
   * Postcondición: devuelve true solo si el rol es docente_investigador y esGerente es true
   * @returns {boolean}
   */
  esAdmin() {
    return this._rol !== null && this._rol.esDocenteInvestigador() && this.esGerente;
  }

  /**
   * Comprueba si el rol de este usuario puede cambiar al rol indicado.
   * Función sin efectos secundarios.
   * Precondición: nuevoRol es una cadena con un valor de rol válido
   * Postcondición: devuelve true si la transición está permitida según las reglas del dominio
   * @param {string} nuevoRol
   * @returns {boolean}
   */
  puedeTransicionarA(nuevoRol) {
    if (!this._rol) return false;
    return Rol.esTransicionValida(this._rol.valor, nuevoRol);
  }

  /**
   * Función sin efectos secundarios.
   * Postcondición: devuelve true si departamentoId no es null
   * @returns {boolean}
   */
  tieneDepartamento() {
    return this.departamentoId !== null;
  }
}

module.exports = Usuario;