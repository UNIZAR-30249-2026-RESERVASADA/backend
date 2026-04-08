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
    if (!usuario.rol) throw domainError("El usuario no tiene rol asignado", 400);

    // 2. Verificar que espacios es un array con al menos un elemento
    if (!espacios || !Array.isArray(espacios) || espacios.length === 0) {
      throw domainError("Debes seleccionar al menos un espacio", 400);
    }

    // 3. Cargar departamento del usuario (una sola vez)
    const deptUsuario = usuario.departamentoId
      ? await this.departamentoRepository.findById(usuario.departamentoId)
      : null;

    // 4. Verificar cada espacio — permisos, aforo, edificio y solapamientos
    for (const { espacioId, numPersonas } of espacios) {
      const espacio = await this.espacioRepository.findById(espacioId);
      if (!espacio) throw domainError(`El espacio ${espacioId} no existe`, 404);
      if (!espacio.puedeReservarse()) {
        throw domainError(`El espacio ${espacio.nombre || espacioId} no es reservable`, 400);
      }

      // Validar edificio abierto
      if (espacio.edificioId) {
        const edificio = await this.edificioRepository.findById(espacio.edificioId);
        if (edificio && !edificio.estaAbierto(horaInicio)) {
          throw domainError(
            `El edificio no está abierto a las ${horaInicio}. Horario: ${edificio.horarioApertura} - ${edificio.horarioCierre}`,
            400
          );
        }
      }

      // Cargar departamento del espacio
      const deptEspacio = espacio.departamentoId
        ? await this.departamentoRepository.findById(espacio.departamentoId)
        : null;

      // Validar permisos — pasamos objetos Departamento a la policy
      const puedeReservar = this.ReservaPolicy.puedeReservar(
        usuario.rol,
        espacio.categoria,
        deptUsuario,
        deptEspacio
      );
      if (!puedeReservar) {
        throw domainError(
          `Tu rol (${usuario.rol}) no permite reservar espacios de tipo ${espacio.categoria}`,
          403
        );
      }

      // Validar aforo individual del espacio (F5)
      if (numPersonas != null && !espacio.admiteOcupacion(numPersonas)) {
        throw domainError(
          `El número de personas (${numPersonas}) supera el aforo del espacio ${espacio.nombre || espacioId} (${espacio.aforo})`,
          400
        );
      }

      // Validar solapamientos para este espacio
      const reservasExistentes = await this.reservaRepository.findByEspacioYFecha(espacioId, fecha);
      const solapadas = SolapamientoService.filtrarSolapadas(
        { fecha, horaInicio, duracion: Number(duracion) },
        reservasExistentes
      );
      if (solapadas.length > 0) {
        throw domainError(
          `El espacio ${espacio.nombre || espacioId} ya está reservado en esa franja horaria`,
          400
        );
      }
    }

    // 5. Crear reserva mediante la factoría
    const reserva = this.reservaFactory.crear({
      espacios,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      tipoUso,
      descripcion,
    });

    // 6. Guardar
    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacio;