const SolapamientoService = require("../../domain/services/SolapamientoService");

class ReservarEspacio {
  constructor({
    espacioRepository,
    reservaRepository,
    ReservaEntity,
    usuarioRepository,
    ReservaPolicy,
  }) {
    this.espacioRepository  = espacioRepository;
    this.reservaRepository  = reservaRepository;
    this.ReservaEntity      = ReservaEntity;
    this.usuarioRepository  = usuarioRepository;
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
    if (!usuario) throw new Error("El usuario no existe");
    if (!usuario.rol) throw new Error("El usuario no tiene rol asignado");

    const espacio = await this.espacioRepository.findById(espacioId);
    if (!espacio) throw new Error("El espacio no existe");
    if (!espacio.puedeReservarse()) throw new Error("El espacio no es reservable");

    // 2. Validar permisos (ReservaPolicy usa value objects internamente)
    const puedeReservar = this.ReservaPolicy.puedeReservar(
      usuario.rol,
      espacio.categoria,
      usuario.departamentoId,
      espacio.departamentoId
    );
    if (!puedeReservar) {
      throw new Error(
        `Tu rol (${usuario.rol}) no permite reservar espacios de tipo ${espacio.categoria}`
      );
    }

    // 3. Construir la entidad — PeriodoTiempo valida fecha/horaInicio/duracion
    //    y Reserva valida numPersonas, tipoUso y descripcion
    const reserva = new this.ReservaEntity({
      espacioId,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      numPersonas: numPersonas || null,
      tipoUso,
      descripcion,
      estado: "aceptada",
    });

    // 4. Validar aforo usando el método de la entidad Espacio
    if (reserva.numPersonas !== null && !espacio.admiteOcupacion(reserva.numPersonas)) {
      throw new Error(
        `El número de personas (${reserva.numPersonas}) supera el aforo del espacio (${espacio.aforo})`
      );
    }

    // 5. Validar solapamientos — el servicio de dominio hace la lógica,
    //    el repositorio solo trae las reservas candidatas del mismo espacio/fecha
    const reservasExistentes = await this.reservaRepository.findByEspacioYFecha(
      espacioId,
      fecha
    );
    const solapadas = SolapamientoService.filtrarSolapadas(
      { fecha, horaInicio, duracion: Number(duracion) },
      reservasExistentes
    );
    if (solapadas.length > 0) {
      throw new Error("Ya existe una reserva para ese espacio en esa franja horaria");
    }

    // 6. Guardar
    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacio;