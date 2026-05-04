const InvalidacionReservasService = require("../../domain/services/InvalidacionReservasService");
const ReservaPolicy               = require("../../domain/policies/ReservaPolicy");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Caso de uso: ModificarEdificio
 * Solo accesible por gerentes.
 * Permite modificar: horarioApertura, horarioCierre, porcentajeOcupacion del edificio.
 *
 * Cuando cambia el porcentaje o el horario:
 * - afectarTodos=false (por defecto): solo invalida reservas de espacios SIN valor propio
 * - afectarTodos=true: invalida reservas de TODOS los espacios del edificio,
 *   poniendo null en los que tenían valor propio para que hereden el del edificio
 */
class ModificarEdificio {
  constructor({ edificioRepository, espacioRepository, reservaRepository, usuarioRepository, notificacionRepository }) {
    this.edificioRepository     = edificioRepository;
    this.espacioRepository      = espacioRepository;
    this.reservaRepository      = reservaRepository;
    this.usuarioRepository      = usuarioRepository;
    this.notificacionRepository = notificacionRepository;
    this.invalidacionService    = new InvalidacionReservasService();
  }

  async execute({ edificioId, cambios, afectarTodos = false, esGerente }) {
    if (!esGerente)   throw domainError("Solo los gerentes pueden modificar el edificio", 403);
    if (!edificioId)  throw domainError("edificioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const edificio = await this.edificioRepository.findById(edificioId);
    if (!edificio) throw domainError(`Edificio ${edificioId} no encontrado`, 404);

    const { porcentajeOcupacion, horarioApertura, horarioCierre } = cambios;

    // Validar porcentaje
    if (porcentajeOcupacion !== undefined && porcentajeOcupacion !== null) {
      const pct = Number(porcentajeOcupacion);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw domainError("El porcentaje de ocupación debe ser un número entre 0 y 100", 400);
      }
    }

    // Validar horario
    const reHora = /^\d{2}:\d{2}$/;
    if (horarioApertura !== undefined && horarioApertura !== null && !reHora.test(horarioApertura)) {
      throw domainError("horarioApertura debe tener formato HH:MM", 400);
    }
    if (horarioCierre !== undefined && horarioCierre !== null && !reHora.test(horarioCierre)) {
      throw domainError("horarioCierre debe tener formato HH:MM", 400);
    }
    if (horarioApertura && horarioCierre && horarioApertura >= horarioCierre) {
      throw domainError("La hora de apertura debe ser anterior a la de cierre", 400);
    }

    // Aplicar cambios al edificio
    await this.edificioRepository.update(edificioId, {
      porcentajeOcupacion,
      horarioApertura,
      horarioCierre,
    });

    const edificioActualizado = await this.edificioRepository.findById(edificioId);
    const reservasCanceladas  = [];
    const todosEspacios       = await this.espacioRepository.findByEdificioId(edificioId);

    // — Invalidar por porcentaje —
    if (porcentajeOcupacion !== undefined) {
      const espaciosARevisar = afectarTodos
        ? todosEspacios
        : todosEspacios.filter(e => e.porcentajeOcupacion === null || e.porcentajeOcupacion === undefined);

      for (const espacio of espaciosARevisar) {
        if (afectarTodos && espacio.porcentajeOcupacion !== null) {
          await this.espacioRepository.updatePorcentaje(espacio.gid, null);
        }

        const pctEfectivo = afectarTodos
          ? (porcentajeOcupacion ?? edificioActualizado.porcentajeOcupacion ?? 100)
          : (espacio.porcentajeOcupacion ?? porcentajeOcupacion ?? edificioActualizado.porcentajeOcupacion ?? 100);

        const apertura = espacio.horarioApertura ?? edificioActualizado.horarioApertura ?? null;
        const cierre   = espacio.horarioCierre   ?? edificioActualizado.horarioCierre   ?? null;

        const canceladas = await this.invalidacionService.invalidarSiProcede({
          espacioId:             espacio.gid,
          nuevaReservable:       espacio.reservable,
          nuevaCategoria:        espacio.categoria,
          deptEspacioId:         espacio.departamentoId ?? null,
          asignadoAInvVisitante: (espacio.usuariosAsignados || []).some(u => u.rol === "investigador_visitante"),
          nuevoHorarioApertura:  apertura,
          nuevoHorarioCierre:    cierre,
          nuevoPorcentaje:       pctEfectivo,
          aforo:                 espacio.aforo ?? null,
          reservaRepository:      this.reservaRepository,
          usuarioRepository:      this.usuarioRepository,
          notificacionRepository: this.notificacionRepository,
          ReservaPolicy,
        });
        reservasCanceladas.push(...canceladas);
      }
    }

    // — Invalidar por horario —
    if (horarioApertura !== undefined || horarioCierre !== undefined) {
      const espaciosARevisar = afectarTodos
        ? todosEspacios
        : todosEspacios.filter(e =>
            (e.horarioApertura === null || e.horarioApertura === undefined) &&
            (e.horarioCierre   === null || e.horarioCierre   === undefined)
          );

      for (const espacio of espaciosARevisar) {
        // Si afectarTodos, quitar horario propio para que herede el del edificio
        if (afectarTodos && (espacio.horarioApertura !== null || espacio.horarioCierre !== null)) {
          await this.espacioRepository.updateHorario(espacio.gid, null, null);
        }

        const apertura = afectarTodos
          ? (horarioApertura ?? edificioActualizado.horarioApertura ?? null)
          : (espacio.horarioApertura ?? horarioApertura ?? edificioActualizado.horarioApertura ?? null);
        const cierre = afectarTodos
          ? (horarioCierre ?? edificioActualizado.horarioCierre ?? null)
          : (espacio.horarioCierre ?? horarioCierre ?? edificioActualizado.horarioCierre ?? null);

        const pctEfectivo = espacio.porcentajeOcupacion ?? edificioActualizado.porcentajeOcupacion ?? 100;

        const canceladas = await this.invalidacionService.invalidarSiProcede({
          espacioId:             espacio.gid,
          nuevaReservable:       espacio.reservable,
          nuevaCategoria:        espacio.categoria,
          deptEspacioId:         espacio.departamentoId ?? null,
          asignadoAInvVisitante: (espacio.usuariosAsignados || []).some(u => u.rol === "investigador_visitante"),
          nuevoHorarioApertura:  apertura,
          nuevoHorarioCierre:    cierre,
          nuevoPorcentaje:       pctEfectivo,
          aforo:                 espacio.aforo ?? null,
          reservaRepository:      this.reservaRepository,
          usuarioRepository:      this.usuarioRepository,
          notificacionRepository: this.notificacionRepository,
          ReservaPolicy,
        });
        reservasCanceladas.push(...canceladas);
      }
    }

    return {
      id:                  edificioActualizado.id,
      nombre:              edificioActualizado.nombre,
      horarioApertura:     edificioActualizado.horarioApertura,
      horarioCierre:       edificioActualizado.horarioCierre,
      porcentajeOcupacion: edificioActualizado.porcentajeOcupacion,
      reservasCanceladas,
    };
  }
}

module.exports = ModificarEdificio;