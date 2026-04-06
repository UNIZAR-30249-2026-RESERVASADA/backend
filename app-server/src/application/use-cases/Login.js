const bcrypt = require("bcryptjs");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class Login {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute({ email, password }) {
    if (!email)    throw domainError("Email es obligatorio", 400);
    if (!password) throw domainError("Password es obligatorio", 400);

    const usuario = await this.usuarioRepository.findByEmail(email);
    if (!usuario) throw domainError("Usuario no encontrado", 404);

    const passwordValida = await bcrypt.compare(password, usuario.contrasenia);
    if (!passwordValida) throw domainError("Password incorrecto", 401);

    return {
      id:             usuario.id,
      nombre:         usuario.nombre,
      email:          usuario.email,
      rol:            usuario.rol,
      esGerente:      usuario.esGerente,
      departamentoId: usuario.departamentoId,
    };
  }
}

module.exports = Login;