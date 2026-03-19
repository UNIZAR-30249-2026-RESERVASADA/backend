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
    if (!contrasenia) throw new Error("La contraseña es obligatoria");

    this.id = id;
    this.nombre = nombre ?? "";
    this.email = email;
    this.contrasenia = contrasenia;
    this.rol = rol;
    this.esGerente = !!esGerente;
    this.departamentoId = departamentoId;
  }

  esAdmin() {
    return this.rol === "docente_investigador" && this.esGerente;
  }
}

module.exports = Usuario;