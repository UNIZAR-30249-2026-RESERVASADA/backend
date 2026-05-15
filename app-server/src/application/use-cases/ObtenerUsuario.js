function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class ObtenerUsuario {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute({ usuarioId }) {
    if (!usuarioId) throw domainError("usuarioId es obligatorio", 400);

    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw domainError("Usuario no encontrado", 404);

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

module.exports = ObtenerUsuario;