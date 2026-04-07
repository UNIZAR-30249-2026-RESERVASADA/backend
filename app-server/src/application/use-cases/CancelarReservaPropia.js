function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class CancelarReservaPropia {
  constructor({ reservaRepository }) {
    this.reservaRepository = reservaRepository;
  }

  async execute({ reservaId, usuarioId }) {
    if (!reservaId) throw domainError("reservaId es obligatorio", 400);
    if (!usuarioId) throw domainError("usuarioId es obligatorio", 400);

    const reserva = await this.reservaRepository.findById(reservaId);
    if (!reserva) throw domainError("Reserva no encontrada", 404);

    // Verificar que la reserva pertenece al usuario
    if (String(reserva.usuarioId) !== String(usuarioId)) {
      throw domainError("No tienes permiso para cancelar esta reserva", 403);
    }

    // Solo se pueden cancelar reservas aceptadas
    if (!reserva.estaActiva()) {
      throw domainError("Solo se pueden cancelar reservas activas", 400);
    }

    reserva.cancelar();
    await this.reservaRepository.save(reserva);

    return { id: reserva.id, estado: reserva.estado };
  }
}

module.exports = CancelarReservaPropia;