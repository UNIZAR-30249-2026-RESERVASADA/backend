/**
 * @use-case GetNotificaciones
 * Obtiene todas las notificaciones de un usuario autenticado,
 * enriquecidas con información de la reserva y los espacios asociados.
 */
class GetNotificaciones {
  constructor({ notificacionRepository, reservaRepository, espacioRepository }) {
    this.notificacionRepository = notificacionRepository;
    this.reservaRepository      = reservaRepository;
    this.espacioRepository      = espacioRepository;
  }

  /**
   * Precondición: usuarioId es un identificador válido no nulo
   * Postcondición: devuelve array con las notificaciones enriquecidas con datos de reserva y espacios
   * @param {{ usuarioId: number }} params
   */
  async execute({ usuarioId }) {
    if (!usuarioId) throw new Error("usuarioId es obligatorio");

    const notificaciones = await this.notificacionRepository.findByUsuario(usuarioId);

    const resultado = [];
    for (const n of notificaciones) {
      let reservaInfo = null;

      if (n.reservaId) {
        const reserva = await this.reservaRepository.findById(n.reservaId);
        if (reserva) {
          // Obtener nombres de espacios
          const nombresEspacios = [];
          for (const { espacioId } of reserva.espacios) {
            const espacio = await this.espacioRepository.findById(espacioId);
            if (espacio) nombresEspacios.push(espacio.nombre || espacio.idEspacio || `Espacio ${espacioId}`);
          }
          reservaInfo = {
            fecha:      reserva.fecha,
            horaInicio: reserva.horaInicio,
            horaFin:    reserva.horaFin,
            estado:     reserva.estado,
            espacios:   nombresEspacios,
          };
        }
      }

      resultado.push({
        id:            n.id,
        reservaId:     n.reservaId,
        motivo:        n.motivo,
        textoMotivo:   n.textoMotivo(),
        descripcion:   n.descripcion,
        leida:         n.leida,
        fechaCreacion: n.fechaCreacion,
        reserva:       reservaInfo,
      });
    }

    return resultado;
  }
}

module.exports = GetNotificaciones;