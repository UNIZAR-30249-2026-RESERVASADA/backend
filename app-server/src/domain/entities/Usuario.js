const Rol = require("../value-objects/Rol");

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
    if (!email) throw new Error("El email es obligatorio");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("El email no tiene un formato válido");
    }
    if (!contrasenia) throw new Error("La contraseña es obligatoria");

    // Rol valida que el valor sea uno de los permitidos
    this._rol = rol ? new Rol(rol) : null;

    this.id            = id;
    this.nombre        = nombre ?? "";
    this.email         = email;
    this.contrasenia   = contrasenia;
    this.esGerente     = !!esGerente;
    this.departamentoId = departamentoId;
  }

  get rol() {
    return this._rol ? this._rol.valor : null;
  }

  get rolVO() {
    return this._rol;
  }

  /**
   * Comprueba si el usuario tiene permisos de administración.
   * Función sin efectos secundarios.
   */
  esAdmin() {
    return this._rol !== null && this._rol.esDocenteInvestigador() && this.esGerente;
  }

  /**
   * Comprueba si el rol de este usuario puede cambiar al rol indicado.
   * Función sin efectos secundarios.
   * @param {string} nuevoRol
   * @returns {boolean}
   */
  puedeTransicionarA(nuevoRol) {
    if (!this._rol) return false;
    return Rol.esTransicionValida(this._rol.valor, nuevoRol);
  }

  tieneDepartamento() {
    return this.departamentoId !== null;
  }
}

module.exports = Usuario;