const bcrypt  = require("bcryptjs");
const Rol     = require("../../domain/value-objects/Rol");
const Usuario = require("../../domain/entities/Usuario");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * @use-case CrearUsuario
 * Permite a un gerente añadir una persona nueva al sistema.
 * Solo accesible via API, sin GUI.
 */
class CrearUsuario {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  /**
   * Precondición: esGerente es true
   * Precondición: email es único en el sistema
   * Precondición: rol es un valor válido
   * Postcondición: el usuario queda persistido en el sistema
   */
  async execute({ nombre, email, contrasenia, rol, departamentoId, nuevoEsGerente, esGerente }) {
    if (!esGerente) throw domainError("Solo los gerentes pueden crear usuarios", 403);
    if (!nombre)    throw domainError("nombre es obligatorio", 400);
    if (!email)     throw domainError("email es obligatorio", 400);
    if (!contrasenia) throw domainError("contrasenia es obligatoria", 400);

    // Verificar email único
    const existente = await this.usuarioRepository.findByEmail(email);
    if (existente) throw domainError(`Ya existe un usuario con el email ${email}`, 409);

    // Validar rol usando el value object — lanza error si no es válido
    if (rol) {
      let rolVO;
      try { rolVO = new Rol(rol); } catch { throw domainError(`Rol no válido: ${rol}`, 400); }

      if (rolVO.requiereDepartamento() && !departamentoId) {
        throw domainError(`El rol "${rol}" requiere estar adscrito a un departamento`, 400);
      }
      if (!rolVO.permiteDepartamento() && departamentoId) {
        throw domainError(`El rol "${rol}" no puede estar adscrito a un departamento`, 400);
      }
    }

    const contraseniaHash = await bcrypt.hash(contrasenia, 10);

    const usuario = new Usuario({
      nombre,
      email,
      contrasenia:    contraseniaHash,
      rol:            rol             || null,
      esGerente:      nuevoEsGerente  || false,
      departamentoId: departamentoId  || null,
    });

    const creado = await this.usuarioRepository.save(usuario);
    return {
      id:             creado.id,
      nombre:         creado.nombre,
      email:          creado.email,
      rol:            creado.rol,
      esGerente:      creado.esGerente,
      departamentoId: creado.departamentoId,
    };
  }
}

module.exports = CrearUsuario;