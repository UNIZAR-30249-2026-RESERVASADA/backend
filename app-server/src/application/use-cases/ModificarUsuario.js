const Rol                         = require("../../domain/value-objects/Rol");
const InvalidacionReservasService = require("../../domain/services/InvalidacionReservasService");
const ReservaPolicy               = require("../../domain/policies/ReservaPolicy");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * @use-case ModificarUsuario
 * Permite a un gerente modificar el rol, esGerente y/o departamento de un usuario.
 * Solo accesible via API, sin GUI.
 *
 * Reglas de negocio:
 * - Solo docente_investigador puede simultanear con esGerente=true
 * - Gerente puro (rol=null) no puede tener departamento
 * - Si se quita el rol a un gerente+docente, se quita también el departamento
 * - Las transiciones de rol siguen la tabla definida en Rol.esTransicionValida
 * - Invalida reservas que ya no cumplan las condiciones tras el cambio
 */
class ModificarUsuario {
  constructor({ usuarioRepository, reservaRepository, espacioRepository, notificacionRepository }) {
    this.usuarioRepository      = usuarioRepository;
    this.reservaRepository      = reservaRepository;
    this.espacioRepository      = espacioRepository;
    this.notificacionRepository = notificacionRepository;
    this.invalidacionService    = new InvalidacionReservasService();
  }

  /**
   * Precondición: esGerente es true
   * Precondición: usuarioId es un identificador válido
   * Precondición: cambios contiene al menos uno de: rol, departamentoId, esGerente
   * Postcondición: el usuario tiene los nuevos valores
   * Postcondición: las reservas que ya no cumplan son canceladas y notificadas
   */
  async execute({ usuarioId, cambios, esGerente }) {
    if (!esGerente) throw domainError("Solo los gerentes pueden modificar usuarios", 403);
    if (!usuarioId) throw domainError("usuarioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw domainError(`Usuario ${usuarioId} no encontrado`, 404);

    let { rol, departamentoId, esGerente: nuevoEsGerente } = cambios;

    // Calcular valores efectivos tras el cambio
    const rolFinal       = rol             !== undefined ? rol             : usuario.rol;
    const gerenteFinal   = nuevoEsGerente  !== undefined ? nuevoEsGerente  : usuario.esGerente;
    let   dptoFinal      = departamentoId  !== undefined ? departamentoId  : usuario.departamentoId;

    // Validar transición de rol si cambia
    if (rol !== undefined && rol !== usuario.rol) {
      // Gerente puro (rol=null) puede recibir docente_investigador sin transición
      const esAsignacionDesdeGerente = usuario.esGerente && usuario.rol === null && rol === "docente_investigador";
      // Gerente+docente puede perder el rol para volver a gerente puro
      const esQuitarRolAGerente = usuario.esGerente && rol === null;

      if (!esAsignacionDesdeGerente && !esQuitarRolAGerente && !Rol.esTransicionValida(usuario.rol, rol)) {
        throw domainError(
          `No se puede cambiar el rol de "${usuario.rol ?? "ninguno"}" a "${rol ?? "ninguno"}"`,
          400
        );
      }
    }

    // Validar que esGerente=true solo es compatible con docente_investigador o null
    if (gerenteFinal && rolFinal !== null && rolFinal !== "docente_investigador") {
      throw domainError(
        `El flag esGerente solo puede activarse junto al rol docente_investigador. Rol actual: "${rolFinal}"`,
        400
      );
    }

    // Si el rol pasa a null (gerente puro), quitar departamento automáticamente
    if (rol === null && usuario.esGerente) {
      dptoFinal = null;
      departamentoId = null;
    }

    // Validar departamento según el rol final
    if (rolFinal) {
      const rolVO = new Rol(rolFinal);
      if (rolVO.requiereDepartamento() && !dptoFinal) {
        throw domainError(`El rol "${rolFinal}" requiere estar adscrito a un departamento`, 400);
      }
      if (!rolVO.permiteDepartamento() && dptoFinal) {
        throw domainError(`El rol "${rolFinal}" no puede estar adscrito a un departamento`, 400);
      }
    }

    // Aplicar cambios
    if (rol !== undefined && rol !== usuario.rol) {
      await this.usuarioRepository.updateRol(usuarioId, rol);
    }
    if (nuevoEsGerente !== undefined && nuevoEsGerente !== usuario.esGerente) {
      await this.usuarioRepository.updateEsGerente(usuarioId, nuevoEsGerente);
    }
    if (departamentoId !== undefined && departamentoId !== usuario.departamentoId) {
      await this.usuarioRepository.updateDepartamento(usuarioId, departamentoId);
    }
    // Si se quitó el rol a gerente, también quitar departamento
    if (rol === null && dptoFinal === null && usuario.departamentoId !== null) {
      await this.usuarioRepository.updateDepartamento(usuarioId, null);
    }

    // Delegar invalidación al servicio de dominio
    const reservasCanceladas = await this.invalidacionService.invalidarPorCambioUsuario({
      usuarioId,
      nuevoRol:            rolFinal,
      nuevoDepartamentoId: dptoFinal,
      reservaRepository:   this.reservaRepository,
      espacioRepository:   this.espacioRepository,
      notificacionRepository: this.notificacionRepository,
      ReservaPolicy,
    });

    const usuarioActualizado = await this.usuarioRepository.findById(usuarioId);
    return {
      id:             usuarioActualizado.id,
      nombre:         usuarioActualizado.nombre,
      email:          usuarioActualizado.email,
      rol:            usuarioActualizado.rol,
      esGerente:      usuarioActualizado.esGerente,
      departamentoId: usuarioActualizado.departamentoId,
      reservasCanceladas,
    };
  }
}

module.exports = ModificarUsuario;