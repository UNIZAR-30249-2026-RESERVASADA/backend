const Notificacion = require("../../domain/entities/Notificacion");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class EliminarReserva {
  constructor({ reservaRepository, notificacionRepository }) {
    this.reservaRepository      = reservaRepository;
    this.notificacionRepository = notificacionRepository;
  }

  async execute({ reservaId, usuarioId, esGerente }) {
    if (!reservaId) throw domainError("reservaId es obligatorio", 400);

    const reserva = await this.reservaRepository.findById(reservaId);
    if (!reserva) throw domainError("Reserva no encontrada", 404);

    if (!esGerente && String(reserva.usuarioId) !== String(usuarioId)) {
      throw domainError("No tienes permiso para eliminar esta reserva", 403);
    }

    if (esGerente) {
      const ahora     = new Date();
      const fechaHoy  = ahora.toISOString().split("T")[0];
      const horaAhora = ahora.toTimeString().slice(0, 5);

      const enCurso = reserva.fecha === fechaHoy
        && reserva.horaInicio <= horaAhora
        && horaAhora < reserva.horaFin;

      if (enCurso) {
        throw domainError("No se puede eliminar una reserva que ya está en curso", 400);
      }

      const inicioReserva  = new Date(`${reserva.fecha}T${reserva.horaInicio}:00`);
      const horasRestantes = (inicioReserva - ahora) / (1000 * 60 * 60);

      if (horasRestantes < 24) {
        throw domainError(
          `No se puede eliminar una reserva con menos de 24 horas de antelación (faltan ${Math.floor(horasRestantes)}h)`,
          400
        );
      }

      // Crear notificación para el usuario
      if (this.notificacionRepository) {
        const notificacion = new Notificacion({
          usuarioId:   reserva.usuarioId,
          reservaId:   reserva.id,
          motivo:      Notificacion.MOTIVOS.ELIMINADA_POR_GERENTE,
          descripcion: `Tu reserva del ${reserva.fecha} a las ${reserva.horaInicio} ha sido cancelada por el gerente.`,
        });
        await this.notificacionRepository.save(notificacion);
      }

      // Cancelar la reserva (cambiar estado) en vez de eliminarla físicamente
      reserva.cancelar();
      await this.reservaRepository.save(reserva);
      return { id: reservaId, eliminada: true };
    }

    // Usuario cancelando su propia reserva — también cambia estado
    reserva.cancelar();
    await this.reservaRepository.save(reserva);
    return { id: reservaId, eliminada: true };
  }
}

module.exports = EliminarReserva;