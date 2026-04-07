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
    reservaFactory,
    ReservaPolicy,
  }) {
    this.espacioRepository  = espacioRepository;
    this.reservaRepository  = reservaRepository;
    this.edificioRepository = edificioRepository;
    this.usuarioRepository  = usuarioRepository;
    this.reservaFactory     = reservaFactory;
    this.ReservaPolicy      = ReservaPolicy;
  }

  async execute({
    espacioId,
    usuarioId,
    fecha,
    horaInicio,
    duracion,
    numPersonas,
    tipoUso,
    descripcion,
  }) {
    // 1. Verificar usuario y espacio existen
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw domainError("El usuario no existe", 404);
    if (!usuario.rol) throw domainError("El usuario no tiene rol asignado", 400);

    const espacio = await this.espacioRepository.findById(espacioId);
    if (!espacio) throw domainError("El espacio no existe", 404);
    if (!espacio.puedeReservarse()) throw domainError("El espacio no es reservable", 400);

    // 2. Validar que el edificio está abierto a la hora de la reserva
    if (espacio.edificioId) {
      const edificio = await this.edificioRepository.findById(espacio.edificioId);
      if (edificio && !edificio.estaAbierto(horaInicio)) {
        throw domainError(
          `El edificio no está abierto a las ${horaInicio}. Horario: ${edificio.horarioApertura} - ${edificio.horarioCierre}`,
          400
        );
      }
    }

    // 3. Validar permisos
    const puedeReservar = this.ReservaPolicy.puedeReservar(
      usuario.rol,
      espacio.categoria,
      usuario.departamentoId,
      espacio.departamentoId
    );
    if (!puedeReservar) {
      throw domainError(
        `Tu rol (${usuario.rol}) no permite reservar espacios de tipo ${espacio.categoria}`,
        403
      );
    }

    // 4. Construir la entidad mediante la factoría
    // PeriodoTiempo valida fecha/horaInicio/duracion internamente
    const reserva = this.reservaFactory.crear({
      espacioId,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      numPersonas: numPersonas || null,
      tipoUso,
      descripcion,
    });

    // 5. Validar aforo
    if (reserva.numPersonas !== null && !espacio.admiteOcupacion(reserva.numPersonas)) {
      throw domainError(
        `El número de personas (${reserva.numPersonas}) supera el aforo del espacio (${espacio.aforo})`,
        400
      );
    }

    // 6. Validar solapamientos
    const reservasExistentes = await this.reservaRepository.findByEspacioYFecha(espacioId, fecha);
    const solapadas = SolapamientoService.filtrarSolapadas(
      { fecha, horaInicio, duracion: Number(duracion) },
      reservasExistentes
    );
    if (solapadas.length > 0) {
      throw domainError("Ya existe una reserva para ese espacio en esa franja horaria", 400);
    }

    // 7. Guardar
    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacio;