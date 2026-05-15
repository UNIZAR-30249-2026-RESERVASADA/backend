const CategoriaReserva           = require("../../domain/value-objects/CategoriaReserva");
const InvalidacionReservasService = require("../../domain/services/InvalidacionReservasService");
const ReservaPolicy               = require("../../domain/policies/ReservaPolicy");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizarUsoFisico(uso) {
  const u = (uso || "").toLowerCase().trim();
  if (u.includes("laboratorio") || u.includes("lab") || u.includes("sala inform") || u.includes("informatica") || u.includes("informática")) return "laboratorio";
  if (u.includes("aula"))      return "aula";
  if (u.includes("seminario")) return "seminario";
  if (u.includes("despacho"))  return "despacho";
  if (u.includes("comun") || u.includes("común")) return "sala comun";
  return null;
}

class ModificarEspacio {
  constructor({ espacioRepository, usuarioRepository, reservaRepository, notificacionRepository }) {
    this.espacioRepository      = espacioRepository;
    this.usuarioRepository      = usuarioRepository;
    this.reservaRepository      = reservaRepository;
    this.notificacionRepository = notificacionRepository;
    this.invalidacionService    = new InvalidacionReservasService();
  }

  async execute({ espacioId, cambios, esGerente }) {
    // Solo los gerentes pueden modificar espacios
    if (!esGerente) throw domainError("Solo los gerentes pueden modificar espacios", 403);
    if (!espacioId) throw domainError("espacioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const espacio = await this.espacioRepository.findById(espacioId);
    if (!espacio) throw domainError(`Espacio ${espacioId} no encontrado`, 404);

    const {
      reservable,
      categoria,
      departamentoId,
      asignadoAEina,
      usuariosAsignados,
      horarioApertura,
      horarioCierre,
      porcentajeOcupacion,
    } = cambios;

    // ─────────────────────────────────────────────
    // VALIDACIONES DE DOMINIO
    // ─────────────────────────────────────────────

    // Calcular la categoría efectiva tras el cambio para validar asignaciones
    const categoriaEfectiva = categoria !== undefined ? categoria : espacio.categoria;
    let catVO;
    try {
      catVO = new CategoriaReserva(categoriaEfectiva);
    } catch {
      throw domainError(`Categoría no válida: ${categoriaEfectiva}`, 400);
    }

    // Validar que la transición de categoría es válida según la tabla de requisitos.
    // Se usa el tipo físico del espacio (uso) como base para calcular las transiciones permitidas.
    // Un espacio siempre puede volver a su categoría original (tipo físico).
    // La única categoría que no puede cambiar nunca es despacho.
    if (categoria !== undefined && categoria !== espacio.categoria) {
      const usoNorm = normalizarUsoFisico(espacio.uso);
      if (!CategoriaReserva.esTransicionValida(espacio.categoria, categoria, usoNorm)) {
        throw domainError(
          `No se puede cambiar la categoría de "${espacio.categoria}" a "${categoria}" ` +
          `para un espacio de tipo físico "${espacio.uso}".`,
          400
        );
      }
    }

    // Validar porcentaje de ocupación — debe ser un número entre 0 y 100
    if (porcentajeOcupacion !== undefined && porcentajeOcupacion !== null) {
      const pct = Number(porcentajeOcupacion);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw domainError("El porcentaje de ocupación debe ser un número entre 0 y 100", 400);
      }
    }

    // Validar formato de horario — debe ser HH:MM y apertura anterior al cierre.
    // Si se manda uno de los dos hay que mandar también el otro.
    const HORA_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (horarioApertura !== undefined && horarioApertura !== null && !HORA_REGEX.test(horarioApertura)) {
      throw domainError("Formato de hora de apertura inválido. Usa HH:MM", 400);
    }
    if (horarioCierre !== undefined && horarioCierre !== null && !HORA_REGEX.test(horarioCierre)) {
      throw domainError("Formato de hora de cierre inválido. Usa HH:MM", 400);
    }
    if (horarioApertura !== undefined && horarioCierre === undefined) {
      throw domainError("Si cambias la hora de apertura debes indicar también la hora de cierre", 400);
    }
    if (horarioCierre !== undefined && horarioApertura === undefined) {
      throw domainError("Si cambias la hora de cierre debes indicar también la hora de apertura", 400);
    }
    if (horarioApertura && horarioCierre && horarioApertura >= horarioCierre) {
      throw domainError("La hora de apertura debe ser anterior a la de cierre", 400);
    }

    // Validar que no se puede poner reservable:true si el despacho está asignado
    // a un docente investigador o investigador contratado, independientemente de
    // si se manda la asignación en este PATCH o ya la tenía antes
    if (reservable === true && catVO.esDespacho()) {
      const usuariosActuales = (usuariosAsignados !== undefined ? [] : espacio.usuariosAsignados) ?? [];
      const hayNoVisitante   = usuariosActuales.some(u =>
        u.rol === "investigador_contratado" || u.rol === "docente_investigador"
      );
      if (hayNoVisitante) {
        throw domainError(
          "Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable.",
          400
        );
      }
    }

    // Validar asignación si se manda algún campo relacionado
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      // Calcular valores efectivos combinando lo que viene en el PATCH con lo que ya tiene el espacio.
      // Si viene departamentoId o usuariosAsignados, se entiende implícitamente que asignadoAEina pasa a false.
      // Si viene asignadoAEina:true o usuariosAsignados, se entiende implícitamente que departamentoId pasa a null.
      // Si viene departamentoId o asignadoAEina sin usuariosAsignados, se entiende que los usuarios quedan vacíos.
      const einaEfectiva =
        asignadoAEina !== undefined ? asignadoAEina
        : (departamentoId || (usuariosAsignados && usuariosAsignados.length > 0)) ? false
        : espacio.asignadoAEina;

      const deptEfectivo =
        departamentoId !== undefined ? departamentoId
        : (asignadoAEina || (usuariosAsignados && usuariosAsignados.length > 0)) ? null
        : espacio.departamentoId;

      const usuariosEfectivos =
        usuariosAsignados !== undefined ? usuariosAsignados
        : (departamentoId !== undefined || asignadoAEina !== undefined) ? []
        : espacio.usuariosAsignados;

      // Un espacio solo puede estar asignado a una cosa a la vez:
      // EINA, un departamento, o una o más personas (nunca combinaciones)
      const tieneEina     = !!einaEfectiva;
      const tieneDpto     = !!deptEfectivo;
      const tienePersonas = usuariosEfectivos && usuariosEfectivos.length > 0;
      const tiposActivos  = [tieneEina, tieneDpto, tienePersonas].filter(Boolean).length;
      if (tiposActivos > 1) {
        throw domainError(
          "Un espacio solo puede estar asignado a una cosa a la vez: EINA, un departamento, o una o más personas",
          400
        );
      }

      // Determinar el tipo de asignación efectivo para validar contra la categoría
      let tipoAsignacion;
      if (einaEfectiva)                                             tipoAsignacion = "eina";
      else if (deptEfectivo)                                        tipoAsignacion = "departamento";
      else if (usuariosEfectivos && usuariosEfectivos.length > 0)   tipoAsignacion = "persona";
      else                                                          tipoAsignacion = "eina";

      // Validar que el tipo de asignación es compatible con la categoría del espacio.
      // Aulas y salas comunes → solo EINA
      // Seminarios y laboratorios → EINA o departamento
      // Despachos → departamento o persona
      if (!catVO.admiteAsignacion(tipoAsignacion)) {
        throw domainError(
          `La categoría "${catVO.valor}" no admite asignación de tipo "${tipoAsignacion}". ` +
          `Asignaciones permitidas: ${catVO.asignacionesPermitidas().join(", ")}`,
          400
        );
      }

      if (usuariosAsignados && usuariosAsignados.length > 0) {
        // Un despacho solo puede estar asignado a una persona concreta
        if (catVO.esDespacho() && usuariosAsignados.length > 1) {
          throw domainError("Un despacho solo puede estar asignado a una persona concreta", 400);
        }

        // Solo pueden asignarse personas con roles: investigador_contratado, docente_investigador o investigador_visitante
        const ROLES_VALIDOS = ["investigador_contratado", "docente_investigador", "investigador_visitante"];
        let hayNoVisitante = false;

        for (const uid of usuariosAsignados) {
          const usuario = await this.usuarioRepository.findById(uid);
          if (!usuario) throw domainError(`Usuario ${uid} no encontrado`, 404);
          if (!ROLES_VALIDOS.includes(usuario.rol)) {
            throw domainError(
              `El usuario ${usuario.nombre} no puede asignarse (rol: ${usuario.rol}). ` +
              `Roles permitidos: ${ROLES_VALIDOS.join(", ")}`,
              400
            );
          }
          if (usuario.rol !== "investigador_visitante") hayNoVisitante = true;
        }

        // Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable,
        // ya que está ocupado por esa persona y no debe estar disponible para reservas
        const reservableEfectivo = reservable !== undefined ? reservable : espacio.reservable;
        if (catVO.esDespacho() && hayNoVisitante && reservableEfectivo) {
          throw domainError(
            "Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable.",
            400
          );
        }
      }
    }

    // ─────────────────────────────────────────────
    // AJUSTE AUTOMÁTICO DE ASIGNACIÓN AL CAMBIAR CATEGORÍA
    // ─────────────────────────────────────────────
    // Reglas de asignación según categoría:
    // - Aulas y salas comunes: SIEMPRE asignadas a la EINA (se fuerza automáticamente)
    // - Seminarios y laboratorios: EINA o departamento (nunca personas)
    //   · Si tenía personas → se limpian y se asigna al departamento indicado o a la EINA por defecto
    //   · Si no se indica asignación en el PATCH → se asigna a la EINA por defecto
    // - Despachos: SIEMPRE a una persona (docente_investigador, investigador_contratado o investigador_visitante)
    //   o departamento (nunca EINA); es obligatorio indicar la asignación al cambiar a despacho
    let infoAsignacion = null;
    if (categoria !== undefined && categoria !== espacio.categoria) {
      const nuevaCat = new CategoriaReserva(categoria);

      if (nuevaCat.esAula() || nuevaCat.esSalaComun()) {
        // Forzar asignación a EINA automáticamente
        await this.espacioRepository.updateAsignacion(espacioId, {
          asignadoAEina:     true,
          departamentoId:    null,
          usuariosAsignados: [],
        });
        const msg = `El espacio ha sido asignado automáticamente a la EINA al cambiar la categoría a "${categoria}"`;
        console.log(`[ModificarEspacio] ${msg}`);
        infoAsignacion = msg;

      } else if (nuevaCat.esLaboratorio() || nuevaCat.esSeminario()) {
        if (espacio.usuariosAsignados.length > 0) {
          // Tenía personas asignadas — los seminarios y laboratorios no admiten personas
          if (departamentoId) {
            // Si viene departamentoId en el PATCH → asignar al departamento indicado
            await this.espacioRepository.updateAsignacion(espacioId, {
              asignadoAEina:     false,
              departamentoId:    departamentoId,
              usuariosAsignados: [],
            });
            const msg = `Los seminarios y laboratorios no pueden estar asignados a personas. El espacio ha sido asignado al departamento indicado`;
            console.log(`[ModificarEspacio] ${msg}`);
            infoAsignacion = msg;
          } else {
            // No viene departamentoId → asignar a EINA por defecto
            await this.espacioRepository.updateAsignacion(espacioId, {
              asignadoAEina:     true,
              departamentoId:    null,
              usuariosAsignados: [],
            });
            const msg = `Los seminarios y laboratorios no pueden estar asignados a personas. El espacio ha sido asignado a la EINA por defecto`;
            console.log(`[ModificarEspacio] ${msg}`);
            infoAsignacion = msg;
          }
        } else if (!departamentoId && !asignadoAEina) {
          // Sin personas previas y sin asignación indicada en el PATCH → asignar a EINA por defecto
          await this.espacioRepository.updateAsignacion(espacioId, {
            asignadoAEina:     true,
            departamentoId:    null,
            usuariosAsignados: [],
          });
          const msg = `No se indicó asignación al cambiar la categoría a "${categoria}", el espacio ha sido asignado a la EINA por defecto`;
          console.log(`[ModificarEspacio] ${msg}`);
          infoAsignacion = msg;
        }

      } else if (nuevaCat.esDespacho()) {
        // Un despacho nunca puede estar asignado a la EINA
        const nuevaAsignadoAEina      = asignadoAEina     !== undefined ? asignadoAEina     : espacio.asignadoAEina;
        const nuevoDepartamentoId     = departamentoId    !== undefined ? departamentoId    : espacio.departamentoId;
        const nuevosUsuariosAsignados = usuariosAsignados !== undefined ? usuariosAsignados : espacio.usuariosAsignados.map(u => u.id ?? u);

        if (nuevaAsignadoAEina) {
          throw domainError(
            "Un despacho no puede estar asignado a la EINA. Debe asignarse a un departamento o a una persona (docente_investigador, investigador_contratado o investigador_visitante)",
            400
          );
        }
        // Es obligatorio indicar la asignación al cambiar a despacho
        if (!nuevoDepartamentoId && (!nuevosUsuariosAsignados || nuevosUsuariosAsignados.length === 0)) {
          throw domainError(
            "Al cambiar la categoría a despacho debes indicar también la asignación: un departamento o una persona (docente_investigador, investigador_contratado o investigador_visitante)",
            400
          );
        }
      }
    }

    // ─────────────────────────────────────────────
    // APLICAR CAMBIOS
    // ─────────────────────────────────────────────

    if (reservable !== undefined) await this.espacioRepository.updateReservable(espacioId, reservable);
    if (categoria  !== undefined) await this.espacioRepository.updateCategoria(espacioId, categoria);

    if (porcentajeOcupacion !== undefined) {
      await this.espacioRepository.updatePorcentaje(espacioId, porcentajeOcupacion);
    }

    if (horarioApertura !== undefined || horarioCierre !== undefined) {
      await this.espacioRepository.updateHorario(
        espacioId,
        horarioApertura !== undefined ? horarioApertura : espacio.horarioApertura,
        horarioCierre   !== undefined ? horarioCierre   : espacio.horarioCierre
      );
    }

    // Solo aplicar cambios de asignación si no fueron ya aplicados en el ajuste automático
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      if (!infoAsignacion) {
        // Calcular valores finales teniendo en cuenta las implicaciones:
        // si viene departamentoId → asignadoAEina pasa a false automáticamente
        // si viene asignadoAEina:true → departamentoId pasa a null automáticamente
        // si viene departamentoId o asignadoAEina sin usuariosAsignados → usuarios quedan vacíos
        const einaFinal =
          asignadoAEina !== undefined ? asignadoAEina
          : (departamentoId || (usuariosAsignados && usuariosAsignados.length > 0)) ? false
          : espacio.asignadoAEina;

        const dptoFinal =
          departamentoId !== undefined ? departamentoId
          : (asignadoAEina || (usuariosAsignados && usuariosAsignados.length > 0)) ? null
          : espacio.departamentoId;

        const usuariosFinal =
          usuariosAsignados !== undefined ? usuariosAsignados
          : (departamentoId !== undefined || asignadoAEina !== undefined) ? []
          : espacio.usuariosAsignados.map(u => u.id ?? u);

        await this.espacioRepository.updateAsignacion(espacioId, {
          asignadoAEina:     einaFinal,
          departamentoId:    dptoFinal,
          usuariosAsignados: usuariosFinal,
        });
      }
    }

    // ─────────────────────────────────────────────
    // INVALIDAR RESERVAS AFECTADAS
    // ─────────────────────────────────────────────
    // Si cambian reservable, categoría, horario, porcentaje o departamento,
    // hay que revisar las reservas existentes y cancelar las que ya no cumplan las condiciones
    const nuevaReservable      = reservable          !== undefined ? reservable          : espacio.reservable;
    const nuevaCategoria       = categoria           !== undefined ? categoria           : espacio.categoria;
    const nuevoHorarioApertura = horarioApertura     !== undefined ? horarioApertura     : espacio.horarioApertura;
    const nuevoHorarioCierre   = horarioCierre       !== undefined ? horarioCierre       : espacio.horarioCierre;
    const nuevoPorcentaje      = porcentajeOcupacion !== undefined ? porcentajeOcupacion : espacio.porcentajeOcupacion;

    const espacioActualizado    = await this.espacioRepository.findById(espacioId);
    const asignadoAInvVisitante = (espacioActualizado.usuariosAsignados || [])
      .some(u => u.rol === "investigador_visitante");

    const reservasCanceladas = await this.invalidacionService.invalidarSiProcede({
      espacioId,
      nuevaReservable,
      nuevaCategoria,
      deptEspacioId:          espacioActualizado.departamentoId ?? null,
      asignadoAInvVisitante,
      nuevoHorarioApertura,
      nuevoHorarioCierre,
      nuevoPorcentaje,
      aforo:                  espacioActualizado.aforo ?? null,
      reservaRepository:      this.reservaRepository,
      usuarioRepository:      this.usuarioRepository,
      notificacionRepository: this.notificacionRepository,
      ReservaPolicy,
    });

    // ─────────────────────────────────────────────
    // DEVOLVER ESPACIO ACTUALIZADO
    // ─────────────────────────────────────────────
    return {
      gid:               espacioActualizado.gid,
      nombre:            espacioActualizado.nombre,
      categoria:         espacioActualizado.categoria,
      reservable:        espacioActualizado.reservable,
      aforo:             espacioActualizado.aforo,
      departamentoId:    espacioActualizado.departamentoId,
      asignadoAEina:     espacioActualizado.asignadoAEina,
      usuariosAsignados: espacioActualizado.usuariosAsignados,
      reservasCanceladas,
      info:              infoAsignacion ?? null,
    };
  }
}

module.exports = ModificarEspacio;