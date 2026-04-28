const Notificacion = require("../entities/Notificacion");

/**
 * @service InvalidacionReservasService
 */
class InvalidacionReservasService {
  async invalidarSiProcede({
    espacioId,
    nuevaReservable,
    nuevaCategoria,
    deptEspacioId,
    asignadoAInvVisitante,
    nuevoHorarioApertura,
    nuevoHorarioCierre,
    nuevoPorcentaje,
    aforo,
    reservaRepository,
    usuarioRepository,
    notificacionRepository,
    ReservaPolicy,
  }) {
    console.log("notificacionRepository recibido:", !!notificacionRepository);
    const reservasVivas = await reservaRepository.findVivasPorEspacio(espacioId);
    if (reservasVivas.length === 0) return [];

    const { fechaHoy, horaAhora } = this._obtenerHoraLocalMadrid();
    const [hH, hM] = horaAhora.split(":").map(Number);
    const canceladas = [];

    for (const reserva of reservasVivas) {
      const horasRestantes = this._calcularHorasRestantes(
        reserva.fecha, reserva.horaInicio, fechaHoy, hH, hM
      );
      if (horasRestantes < 24) continue;

      let motivo = null;

      // Caso 1 — espacio ya no es reservable
      if (!nuevaReservable) {
        motivo = Notificacion.MOTIVOS.ESPACIO_NO_RESERVABLE;
      }

      // Caso 2 — porcentaje de ocupación
      if (!motivo && nuevoPorcentaje !== null && nuevoPorcentaje !== undefined && aforo) {
        const aforoPermitido = Math.floor(aforo * (nuevoPorcentaje / 100));
        const espacioReserva = reserva.espacios.find(e => Number(e.espacioId) === Number(espacioId));
        const numPersonas    = espacioReserva?.numPersonas ?? null;
        console.log(`[Invalidacion] Reserva ${reserva.id} — porcentaje: aforo=${aforo}, pct=${nuevoPorcentaje}, permitido=${aforoPermitido}, personas=${numPersonas}, cancela=${numPersonas > aforoPermitido}`);
        if (numPersonas !== null && numPersonas > aforoPermitido) {
          motivo = Notificacion.MOTIVOS.PORCENTAJE_OCUPACION;
        }
      }

      // Caso 3 — horario
      if (!motivo && (nuevoHorarioApertura || nuevoHorarioCierre)) {
        const fueraDeHorario =
          (nuevoHorarioApertura && reserva.horaInicio < nuevoHorarioApertura) ||
          (nuevoHorarioCierre   && reserva.horaFin    > nuevoHorarioCierre);
        console.log(`[Invalidacion] Reserva ${reserva.id} — horario: inicio=${reserva.horaInicio}, fin=${reserva.horaFin}, apertura=${nuevoHorarioApertura}, cierre=${nuevoHorarioCierre}, fueraDeHorario=${fueraDeHorario}`);
        if (fueraDeHorario) {
          motivo = Notificacion.MOTIVOS.HORARIO;
        }
      }

      // Caso 4 — política de reserva
      if (!motivo) {
        const usuario = await usuarioRepository.findById(reserva.usuarioId);
        if (!usuario) continue;

        const deptEspacio = deptEspacioId
          ? { id: deptEspacioId, esMismoDepartamento: (d) => d && String(d.id ?? d) === String(deptEspacioId) }
          : null;
        const deptUsuario = usuario.departamentoId
          ? { id: usuario.departamentoId, esMismoDepartamento: (d) => d && String(d.id ?? d) === String(usuario.departamentoId) }
          : null;

        const puedeReservar = ReservaPolicy.puedeReservar(
          usuario.rol,
          nuevaCategoria,
          deptUsuario,
          deptEspacio,
          false,
          asignadoAInvVisitante
        );

        console.log(`[Invalidacion] Reserva ${reserva.id} — política: rol=${usuario.rol}, categoria=${nuevaCategoria}, deptUsuario=${usuario.departamentoId}, deptEspacio=${deptEspacioId}, puedeReservar=${puedeReservar}`);
        if (!puedeReservar) {
          motivo = Notificacion.MOTIVOS.POLITICA;
        }
      }

      if (motivo) {
        console.log(`[Invalidacion] Reserva ${reserva.id} CANCELADA por: ${motivo}`);
        reserva.cancelar();
        await reservaRepository.save(reserva);
        canceladas.push(reserva.id);

        console.log("motivo final:", motivo);
        console.log("va a crear notificacion:", !!notificacionRepository);

        // Crear notificación para el usuario
        if (notificacionRepository) {
          const notificacion = new Notificacion({
            usuarioId:   reserva.usuarioId,
            reservaId:   reserva.id,
            motivo,
            descripcion: `Reserva del ${reserva.fecha} a las ${reserva.horaInicio} cancelada automáticamente.`,
          });
          await notificacionRepository.save(notificacion);
        }
      }
    }

    return canceladas;
  }

  _obtenerHoraLocalMadrid() {
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const partes = formatter.formatToParts(ahora);
    const get    = (type) => partes.find(p => p.type === type)?.value ?? "00";
    return {
      fechaHoy:  `${get("year")}-${get("month")}-${get("day")}`,
      horaAhora: `${get("hour")}:${get("minute")}`,
    };
  }

  _calcularHorasRestantes(fechaReserva, horaInicio, fechaHoy, hH, hM) {
    const [rH, rM]      = horaInicio.split(":").map(Number);
    const [fY, fMo, fD] = fechaReserva.split("-").map(Number);
    const [hY, hMo, hD] = fechaHoy.split("-").map(Number);
    const inicioMs = new Date(fY, fMo - 1, fD, rH, rM).getTime();
    const ahoraMs  = new Date(hY, hMo - 1, hD, hH, hM).getTime();
    return (inicioMs - ahoraMs) / (1000 * 60 * 60);
  }
}

module.exports = InvalidacionReservasService;