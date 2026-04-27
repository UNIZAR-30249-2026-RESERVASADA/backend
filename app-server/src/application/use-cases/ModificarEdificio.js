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
 * Cuando cambia el porcentaje de ocupación:
 * - afectarTodos=false (por defecto): solo invalida reservas de espacios SIN porcentaje propio
 * - afectarTodos=true: invalida reservas de TODOS los espacios del edificio
 */
class ModificarEdificio {
  constructor({ edificioRepository, espacioRepository, reservaRepository, usuarioRepository }) {
    this.edificioRepository   = edificioRepository;
    this.espacioRepository    = espacioRepository;
    this.reservaRepository    = reservaRepository;
    this.usuarioRepository    = usuarioRepository;
    this.invalidacionService  = new InvalidacionReservasService();
  }

  async execute({ edificioId, cambios, afectarTodos = false, esGerente }) {
    if (!esGerente) throw domainError("Solo los gerentes pueden modificar el edificio", 403);
    if (!edificioId) throw domainError("edificioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const edificio = await this.edificioRepository.findById(edificioId);
    if (!edificio) throw domainError(`Edificio ${edificioId} no encontrado`, 404);

    const { porcentajeOcupacion } = cambios;

    // Validar porcentaje
    if (porcentajeOcupacion !== undefined && porcentajeOcupacion !== null) {
      const pct = Number(porcentajeOcupacion);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw domainError("El porcentaje de ocupación debe ser un número entre 0 y 100", 400);
      }
    }

    // Aplicar cambios al edificio
    await this.edificioRepository.update(edificioId, { porcentajeOcupacion });

    // Invalidar reservas afectadas
    const reservasCanceladas = [];

    if (porcentajeOcupacion !== undefined) {
      const todosEspacios = await this.espacioRepository.findByEdificioId(edificioId);

      // Filtrar espacios según afectarTodos
      const espaciosARevisar = afectarTodos
        ? todosEspacios
        : todosEspacios.filter(e => e.porcentajeOcupacion === null || e.porcentajeOcupacion === undefined);

      const edificioActualizado = await this.edificioRepository.findById(edificioId);

      for (const espacio of espaciosARevisar) {
        // Porcentaje efectivo del espacio tras el cambio
        const pctEfectivo = afectarTodos
          ? (porcentajeOcupacion ?? edificioActualizado.porcentajeOcupacion ?? 100)
          : (espacio.porcentajeOcupacion ?? porcentajeOcupacion ?? edificioActualizado.porcentajeOcupacion ?? 100);

        // Horario efectivo del espacio (no cambia al modificar el edificio)
        const apertura = espacio.horarioApertura ?? edificioActualizado.horarioApertura ?? null;
        const cierre   = espacio.horarioCierre   ?? edificioActualizado.horarioCierre   ?? null;

        const canceladas = await this.invalidacionService.invalidarSiProcede({
          espacioId:            espacio.gid,
          nuevaReservable:      espacio.reservable,
          nuevaCategoria:       espacio.categoria,
          deptEspacioId:        espacio.departamentoId ?? null,
          asignadoAInvVisitante: (espacio.usuariosAsignados || []).some(u => u.rol === "investigador_visitante"),
          nuevoHorarioApertura: apertura,
          nuevoHorarioCierre:   cierre,
          nuevoPorcentaje:      pctEfectivo,
          aforo:                espacio.aforo ?? null,
          reservaRepository:    this.reservaRepository,
          usuarioRepository:    this.usuarioRepository,
          ReservaPolicy,
        });

        reservasCanceladas.push(...canceladas);
      }
    }

    const edificioActualizado = await this.edificioRepository.findById(edificioId);
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