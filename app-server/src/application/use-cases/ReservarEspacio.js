const SolapamientoService = require("../../domain/services/SolapamientoService");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class ReservarEspacio {
  constructor({
    espacioRepository,
    reservaRepository,
    edificioRepository,
    usuarioRepository,
    departamentoRepository,
    reservaFactory,
    ReservaPolicy,
  }) {
    this.espacioRepository      = espacioRepository;
    this.reservaRepository      = reservaRepository;
    this.edificioRepository     = edificioRepository;
    this.usuarioRepository      = usuarioRepository;
    this.departamentoRepository = departamentoRepository;
    this.reservaFactory         = reservaFactory;
    this.ReservaPolicy          = ReservaPolicy;
  }

  async execute({
    espacios,
    usuarioId,
    fecha,
    horaInicio,
    duracion,
    tipoUso,
    descripcion,
  }) {
    // 1. Verificar usuario
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw domainError("El usuario no existe", 404);
    if (!usuario.esGerente && !usuario.rol) throw domainError("El usuario no tiene rol asignado", 400);

    // 2. Verificar que espacios es un array con al menos un elemento
    if (!espacios || !Array.isArray(espacios) || espacios.length === 0) {
      throw domainError("Debes seleccionar al menos un espacio", 400);
    }

    // 2b. Validar antelación mínima de 24 horas
    const ahoraFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const partesFecha = ahoraFormatter.formatToParts(new Date());
    const get         = (type) => partesFecha.find(p => p.type === type)?.value ?? "00";
    const fechaHoy    = `${get("year")}-${get("month")}-${get("day")}`;
    const horaAhora   = `${get("hour")}:${get("minute")}`;

    const [rH, rM]      = horaInicio.split(":").map(Number);
    const [fY, fMo, fD] = fecha.split("-").map(Number);
    const [hY, hMo, hD] = fechaHoy.split("-").map(Number);
    const [haH, haMin]  = horaAhora.split(":").map(Number);
    const inicioMs      = new Date(fY, fMo - 1, fD, rH, rM).getTime();
    const ahoraMs       = new Date(hY, hMo - 1, hD, haH, haMin).getTime();
    const horasRestantes = (inicioMs - ahoraMs) / (1000 * 60 * 60);

    if (horasRestantes < 24) {
      throw domainError("Las reservas deben hacerse con al menos 24 horas de antelación", 400);
    }

    // 2c. Validar que la fecha no es fin de semana
    const diaSemana = new Date(fecha + "T12:00:00").getDay(); // 0=domingo, 6=sábado
    if (diaSemana === 0 || diaSemana === 6) {
      throw domainError("No se pueden hacer reservas en fin de semana", 400);
    }

    // 3. Cargar departamento del usuario (una sola vez)
    const deptUsuario = usuario.departamentoId
      ? await this.departamentoRepository.findById(usuario.departamentoId)
      : null;

    // 4. Verificar cada espacio — permisos, aforo y edificio
    for (const { espacioId, numPersonas } of espacios) {
      const espacio = await this.espacioRepository.findById(espacioId);
      if (!espacio) throw domainError(`El espacio ${espacioId} no existe`, 404);
      if (!espacio.puedeReservarse()) {
        throw domainError(`El espacio ${espacio.nombre || espacioId} no es reservable`, 400);
      }

      // Validar horario efectivo del espacio (propio o heredado del edificio)
      let horarioApertura = espacio.horarioApertura ?? null;
      let horarioCierre   = espacio.horarioCierre   ?? null;

      if (espacio.edificioId && (!horarioApertura || !horarioCierre)) {
        const edificio = await this.edificioRepository.findById(espacio.edificioId);
        if (edificio) {
          horarioApertura = horarioApertura ?? edificio.horarioApertura;
          horarioCierre   = horarioCierre   ?? edificio.horarioCierre;
        }
      }

      if (horarioApertura && horaInicio < horarioApertura) {
        throw domainError(
          `El espacio ${espacio.nombre || espacioId} no está disponible a las ${horaInicio}. ` +
          `Horario de apertura: ${horarioApertura}`,
          400
        );
      }

      // Calcular horaFin para validar cierre
      const [hI, mI]    = horaInicio.split(":").map(Number);
      const totalMin     = hI * 60 + mI + duracion;
      const horaFinStr   = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

      if (horarioCierre && horaFinStr > horarioCierre) {
        throw domainError(
          `La reserva del espacio ${espacio.nombre || espacioId} termina a las ${horaFinStr}, ` +
          `fuera de su horario de cierre (${horarioCierre})`,
          400
        );
      }

      // Cargar departamento del espacio
      const deptEspacio = espacio.departamentoId
        ? await this.departamentoRepository.findById(espacio.departamentoId)
        : null;

      // O7: el usuario actual está en la lista de asignados del espacio
      const usuarioEstaAsignado = espacio.estaAsignadoA(usuario.id);

      // O7: alguno de los usuarios asignados al espacio es investigador visitante
      let espacioAsignadoAInvestigadorVisitante = false;
      if (espacio.usuariosAsignados.length > 0) {
        for (const uid of espacio.usuariosAsignados) {
          const usuarioAsignado = await this.usuarioRepository.findById(uid);
          if (usuarioAsignado?.rol === "investigador_visitante") {
            espacioAsignadoAInvestigadorVisitante = true;
            break;
          }
        }
      }

      // Gerente puede reservar cualquier espacio reservable
      const esGerente = usuario.esGerente === true;

      if (!esGerente) {
        const puedeReservar = this.ReservaPolicy.puedeReservar(
          usuario.rol,
          espacio.categoria,
          deptUsuario,
          deptEspacio,
          usuarioEstaAsignado,
          espacioAsignadoAInvestigadorVisitante
        );
        if (!puedeReservar) {
          const nombreDeptUsuario = deptUsuario?.nombre ?? "sin departamento";
          const nombreDeptEspacio = deptEspacio?.nombre ?? "sin departamento";
          const cat = espacio.categoria;

          // Roles que pueden reservar laboratorio con restricción de dpto
          const rolesConAccesoLab = ["investigador_contratado", "docente_investigador", "tecnico_laboratorio", "investigador_visitante"];
          // Roles que pueden reservar despacho con restricción de dpto
          const rolesConAccesoDespacho = ["investigador_contratado", "docente_investigador", "investigador_visitante"];

          let motivo;

          if (cat === "laboratorio") {
            if (!rolesConAccesoLab.includes(usuario.rol)) {
              // El rol directamente no puede reservar laboratorios
              motivo = `Tu rol (${usuario.rol}) no tiene permiso para reservar laboratorios`;
            } else if (!deptEspacio) {
              motivo = `Este laboratorio está asignado a la EINA y tu rol (${usuario.rol}) no puede reservarlo`;
            } else if (!deptUsuario) {
              motivo = `Este laboratorio pertenece al departamento "${nombreDeptEspacio}" y no tienes departamento asignado`;
            } else {
              motivo = `Este laboratorio pertenece al departamento "${nombreDeptEspacio}" y tú eres del departamento "${nombreDeptUsuario}"`;
            }

          } else if (cat === "despacho") {
            if (!rolesConAccesoDespacho.includes(usuario.rol)) {
              motivo = `Tu rol (${usuario.rol}) no tiene permiso para reservar despachos`;
            } else {
              const tieneUsuariosAsignados = espacio.usuariosAsignados.length > 0;

              if (tieneUsuariosAsignados && !espacioAsignadoAInvestigadorVisitante) {
                motivo = `Este despacho está asignado a una persona concreta y no es reservable`;
              } else if (tieneUsuariosAsignados && espacioAsignadoAInvestigadorVisitante) {
                if (!deptUsuario) {
                  motivo = `Este despacho está asignado a un investigador visitante del departamento "${nombreDeptEspacio}" y no tienes departamento asignado`;
                } else {
                  motivo = `Este despacho está asignado a un investigador visitante del departamento "${nombreDeptEspacio}" y tú eres del departamento "${nombreDeptUsuario}"`;
                }
              } else if (!deptEspacio) {
                motivo = `Este despacho está asignado a la EINA y tu rol (${usuario.rol}) no puede reservarlo`;
              } else if (!deptUsuario) {
                motivo = `Este despacho pertenece al departamento "${nombreDeptEspacio}" y no tienes departamento asignado`;
              } else {
                motivo = `Este despacho pertenece al departamento "${nombreDeptEspacio}" y tú eres del departamento "${nombreDeptUsuario}"`;
              }
            }

          } else {
            // aula, seminario, sala comun — problema puramente de rol
            motivo = `Tu rol (${usuario.rol}) no tiene permiso para reservar espacios de tipo ${cat}`;
          }

          throw domainError(motivo, 403);
        }
      }

      // Validar aforo individual del espacio (F5) aplicando porcentaje de ocupación del edificio
      if (numPersonas != null) {
        let porcentaje = 100;
        if (espacio.edificioId) {
          const edificioAforo = await this.edificioRepository.findById(espacio.edificioId);
          if (edificioAforo) {
            porcentaje = edificioAforo.getPorcentajeOcupacionMaximo();
          }
        }
        if (!espacio.admiteOcupacion(numPersonas, porcentaje)) {
          const aforoPermitido = Math.ceil((espacio.aforo ?? 0) * porcentaje / 100);
          throw domainError(
            `El número de personas (${numPersonas}) supera el aforo permitido del espacio ${espacio.nombre || espacioId} (${aforoPermitido} plazas con el ${porcentaje}% de ocupación actual)`,
            400
          );
        }
      }
    }

    // 5. Crear la reserva mediante la factoría
    const reserva = this.reservaFactory.crear({
      espacios,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      tipoUso,
      descripcion,
    });

    // 6. Validar solapamientos para cada espacio usando SolapamientoService
    for (const { espacioId } of espacios) {
      const espacio = await this.espacioRepository.findById(espacioId);
      const reservasExistentes = await this.reservaRepository.findByEspacioYFecha(espacioId, fecha);
      const solapadas = SolapamientoService.filtrarSolapadas(reserva, reservasExistentes);
      if (solapadas.length > 0) {
        const horaFinMasTarde = solapadas.reduce((max, r) => r.horaFin > max ? r.horaFin : max, "00:00");
        throw domainError(
          `El espacio ${espacio.nombre || espacioId} ya está reservado en esa franja horaria. ` +
          `Disponible a partir de las ${horaFinMasTarde}.`,
          400
        );
      }
    }

    // 7. Guardar
    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacio;