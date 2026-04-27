/**
 * @service InvalidacionReservasService
 *
 * Servicio de dominio que coordina la invalidación automática de reservas
 * cuando un espacio cambia sus condiciones (reservabilidad o categoría).
 *
 * Coordina dos agregados: Espacio y Reserva, y consulta Usuario.
 * Encapsula la regla de negocio de las 24 horas de antelación mínima.
 */
class InvalidacionReservasService {
  /**
   * Dado un espacio que acaba de modificarse, cancela todas las reservas vivas
   * que ya no cumplen las condiciones, siempre que queden más de 24 horas
   * para su inicio.
   *
   * Casos que invalidan una reserva:
   * 1. El espacio pasa a no ser reservable.
   * 2. La nueva categoría ya no permite reservar al usuario según ReservaPolicy.
   *
   * @param {Object}             params
   * @param {number}             params.espacioId
   * @param {boolean}            params.nuevaReservable
   * @param {string}             params.nuevaCategoria
   * @param {number|null}        params.deptEspacioId
   * @param {boolean}            params.asignadoAInvVisitante
   * @param {ReservaRepository}  params.reservaRepository
   * @param {IUsuarioRepository} params.usuarioRepository
   * @returns {Promise<number[]>} ids de reservas canceladas
   */
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
    ReservaPolicy,
  }) {
    const reservasVivas = await reservaRepository.findVivasPorEspacio(espacioId);
    if (reservasVivas.length === 0) return [];

    const { fechaHoy, horaAhora } = this._obtenerHoraLocalMadrid();
    const [hH, hM] = horaAhora.split(":").map(Number);
    const canceladas = [];

    for (const reserva of reservasVivas) {
      // Respetar reservas con menos de 24h de antelación
      const horasRestantes = this._calcularHorasRestantes(
        reserva.fecha, reserva.horaInicio, fechaHoy, hH, hM
      );
      if (horasRestantes < 24) continue;

      // Caso 1 — espacio ya no es reservable: cancelar directamente
      if (!nuevaReservable) {
        reserva.cancelar();
        await reservaRepository.save(reserva);
        canceladas.push(reserva.id);
        continue;
      }

      // Caso 2 — comprobar si la reserva ya no cumple el nuevo porcentaje de ocupación
      if (nuevoPorcentaje !== null && nuevoPorcentaje !== undefined && aforo) {
        const aforoPermitido = Math.floor(aforo * (nuevoPorcentaje / 100));
        // Sumar numPersonas de todos los espacios de la reserva para este espacioId
        const espacioReserva = reserva.espacios.find(e => Number(e.espacioId) === Number(espacioId));
        const numPersonas    = espacioReserva?.numPersonas ?? null;
        if (numPersonas !== null && numPersonas > aforoPermitido) {
          reserva.cancelar();
          await reservaRepository.save(reserva);
          canceladas.push(reserva.id);
          continue;
        }
      }

      // Caso 3 — comprobar si la reserva queda fuera del nuevo horario del espacio
      if (nuevoHorarioApertura || nuevoHorarioCierre) {
        const apertura = nuevoHorarioApertura;
        const cierre   = nuevoHorarioCierre;
        const fueraDeHorario =
          (apertura && reserva.horaInicio < apertura) ||
          (cierre   && reserva.horaFin    > cierre);

        if (fueraDeHorario) {
          reserva.cancelar();
          await reservaRepository.save(reserva);
          canceladas.push(reserva.id);
          continue;
        }
      }

      // Caso 4 — comprobar si el usuario sigue pudiendo reservar con la nueva categoría
      const usuario = await usuarioRepository.findById(reserva.usuarioId);
      if (!usuario) continue;

      // Objetos con esMismoDepartamento para ReservaPolicy
      const deptEspacio = deptEspacioId
        ? { esMismoDepartamento: (d) => d && String(d.id ?? d) === String(deptEspacioId) }
        : null;
      const deptUsuario = usuario.departamentoId
        ? { id: usuario.departamentoId, esMismoDepartamento: (d) => d && String(d.id ?? d) === String(usuario.departamentoId) }
        : null;

      const puedeReservar = ReservaPolicy.puedeReservar(
        usuario.rol,
        nuevaCategoria,
        deptUsuario,
        deptEspacio,
        false,               // tras el cambio, asignación ya actualizada
        asignadoAInvVisitante
      );

      if (!puedeReservar) {
        reserva.cancelar();
        await reservaRepository.save(reserva);
        canceladas.push(reserva.id);
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