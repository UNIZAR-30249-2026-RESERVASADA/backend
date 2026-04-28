/**
 * @use-case GetNotificaciones
 * Obtiene todas las notificaciones de un usuario autenticado.
 */
class GetNotificaciones {
  constructor({ notificacionRepository }) {
    this.notificacionRepository = notificacionRepository;
  }

  /**
   * Precondición: usuarioId es un identificador válido no nulo
   * Postcondición: devuelve array con las notificaciones del usuario ordenadas por fecha descendente
   * @param {{ usuarioId: number }} params
   */
  async execute({ usuarioId }) {
    if (!usuarioId) throw new Error("usuarioId es obligatorio");
    const notificaciones = await this.notificacionRepository.findByUsuario(usuarioId);
    return notificaciones.map(n => ({
      id:            n.id,
      reservaId:     n.reservaId,
      motivo:        n.motivo,
      textoMotivo:   n.textoMotivo(),
      descripcion:   n.descripcion,
      leida:         n.leida,
      fechaCreacion: n.fechaCreacion,
    }));
  }
}

module.exports = GetNotificaciones;