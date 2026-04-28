/**
 * @use-case MarcarNotificacionesLeidas
 * Marca todas las notificaciones no leídas de un usuario como leídas.
 */
class MarcarNotificacionesLeidas {
  constructor({ notificacionRepository }) {
    this.notificacionRepository = notificacionRepository;
  }

  /**
   * Precondición: usuarioId es un identificador válido no nulo
   * Postcondición: todas las notificaciones del usuario tienen leida=true
   * @param {{ usuarioId: number }} params
   */
  async execute({ usuarioId }) {
    if (!usuarioId) throw new Error("usuarioId es obligatorio");
    await this.notificacionRepository.marcarLeidaPorUsuario(usuarioId);
    return { ok: true };
  }
}

module.exports = MarcarNotificacionesLeidas;