class ReservarEspacioUseCase {
  constructor({ espacioRepository, reservaRepository, ReservaEntity }) {
    this.espacioRepository = espacioRepository;
    this.reservaRepository = reservaRepository;
    this.ReservaEntity = ReservaEntity;
  }  async execute({ espacioId, usuarioId, fecha, horaInicio, duracion, numPersonas, tipoUso, descripcion }) {
    if (!espacioId) {
      throw new Error("El id del espacio es obligatorio");
    }

    if (!usuarioId) {
      throw new Error("El id del usuario es obligatorio");
    }

    if (!fecha || !horaInicio || !duracion) {
      throw new Error("Fecha, hora de inicio y duración son obligatorias");
    }

    // 1. Verificar que el usuario existe y obtener su rol
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new Error("El usuario no existe");
    }

    const espacio = await this.espacioRepository.findById(espacioId);

    if (!espacio) {
      throw new Error("El espacio no existe");
    }

    if (!espacio.reservable) {
      throw new Error("El espacio no es reservable");
    } 
    
    // 4. ⭐ VALIDAR RESTRICCIÓN DE ROL (REGLA DE NEGOCIO)
    if (!this.ReservaPolicy.puedeReservar(usuario.rol, espacio.categoria, usuario.departamentoId, espacio.departamentoId)) {
      throw new Error(`Tu rol (${usuario.rol}) no permite reservar espacios de tipo ${espacio.categoria}`);
    }

    const reserva = new this.ReservaEntity({
      espacioId,
      usuarioId,
      fecha,
      horaInicio,
      duracion,
      numPersonas,
      tipoUso,
      descripcion,
      estado: "aceptada",
    });

    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacioUseCase;