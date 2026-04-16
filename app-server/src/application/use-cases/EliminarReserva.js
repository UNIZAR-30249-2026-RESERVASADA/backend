function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class EliminarReserva {
  constructor({ reservaRepository }) {
    this.reservaRepository = reservaRepository;
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

      // Comprobar si la reserva está en curso
      const enCurso = reserva.fecha === fechaHoy
        && reserva.horaInicio <= horaAhora
        && horaAhora < reserva.horaFin;

      if (enCurso) {
        throw domainError(
          "No se puede eliminar una reserva que ya está en curso",
          400
        );
      }

      // Comprobar si quedan menos de 24 horas para el inicio
      const inicioReserva  = new Date(`${reserva.fecha}T${reserva.horaInicio}:00`);
      const horasRestantes = (inicioReserva - ahora) / (1000 * 60 * 60);

      if (horasRestantes < 24) {
        throw domainError(
          `No se puede eliminar una reserva con menos de 24 horas de antelación (faltan ${Math.floor(horasRestantes)}h)`,
          400
        );
      }
    }

    await this.reservaRepository.deleteById(reservaId);
    return { id: reservaId, eliminada: true };
  }
}

module.exports = EliminarReserva;