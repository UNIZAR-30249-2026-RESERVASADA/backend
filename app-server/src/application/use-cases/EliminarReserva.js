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
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
      const partes    = formatter.formatToParts(new Date());
      const get       = (type) => partes.find(p => p.type === type)?.value ?? "00";
      const fechaHoy  = `${get("year")}-${get("month")}-${get("day")}`;
      const horaAhora = `${get("hour")}:${get("minute")}`;

      const enCurso = reserva.fecha === fechaHoy
        && reserva.horaInicio <= horaAhora
        && horaAhora < reserva.horaFin;

      if (enCurso) {
        throw domainError("No se puede eliminar una reserva que ya está en curso", 400);
      }

      const [rH, rM]      = reserva.horaInicio.split(":").map(Number);
      const [fY, fMo, fD] = reserva.fecha.split("-").map(Number);
      const [hY, hMo, hD] = fechaHoy.split("-").map(Number);
      const [haH, haMin]  = horaAhora.split(":").map(Number);
      const inicioMs      = new Date(fY, fMo - 1, fD, rH, rM).getTime();
      const ahoraMs       = new Date(hY, hMo - 1, hD, haH, haMin).getTime();
      const horasRestantes = (inicioMs - ahoraMs) / (1000 * 60 * 60);

      if (horasRestantes < 24) {
        throw domainError(
          `No se puede eliminar una reserva con menos de 24 horas de antelación (faltan ${Math.floor(horasRestantes)}h ${Math.floor((horasRestantes % 1) * 60)}min)`,
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