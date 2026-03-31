class ReservarEspacioUseCase {
  constructor({
    espacioRepository,
    reservaRepository,
    ReservaEntity,
    usuarioRepository,
    ReservaPolicy,
  }) {
    this.espacioRepository = espacioRepository;
    this.reservaRepository = reservaRepository;
    this.ReservaEntity = ReservaEntity;
    this.usuarioRepository = usuarioRepository;
    this.ReservaPolicy = ReservaPolicy;
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
    // 1. Validación básica de entrada
    if (!espacioId) {
      throw new Error("El id del espacio es obligatorio");
    }

    if (!usuarioId) {
      throw new Error("El id del usuario es obligatorio");
    }

    if (!fecha || !horaInicio || !duracion) {
      throw new Error("Fecha, hora de inicio y duración son obligatorias");
    }

    const duracionNum = Number(duracion);
    if (Number.isNaN(duracionNum) || duracionNum <= 0) {
      throw new Error("La duración debe ser un número mayor que 0");
    }

    const numPersonasNum =
      numPersonas === null || numPersonas === undefined || numPersonas === ""
        ? null
        : Number(numPersonas);

    if (
      numPersonasNum !== null &&
      (Number.isNaN(numPersonasNum) || numPersonasNum <= 0)
    ) {
      throw new Error("El número de personas debe ser mayor que 0");
    }

    const tiposUsoValidos = ["docencia", "reunion", "examen", "otros"];
    if (tipoUso && !tiposUsoValidos.includes(tipoUso)) {
      throw new Error("El tipo de uso no es válido");
    }

    if (descripcion && descripcion.length > 500) {
      throw new Error("La descripción no puede superar los 500 caracteres");
    }

    // 2. Verificar usuario
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new Error("El usuario no existe");
    }

    if (!usuario.rol) {
      throw new Error("El usuario no tiene rol asignado");
    }

    // 3. Verificar espacio
    const espacio = await this.espacioRepository.findById(espacioId);

    if (!espacio) {
      throw new Error("El espacio no existe");
    }

    if (!espacio.reservable) {
      throw new Error("El espacio no es reservable");
    }

    // 4. Validar permisos según rol/categoría/departamento
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

    // 5. Validar aforo
    if (
      numPersonasNum !== null &&
      espacio.aforo !== null &&
      espacio.aforo !== undefined &&
      numPersonasNum > espacio.aforo
    ) {
      throw new Error(
        `El número de personas (${numPersonasNum}) supera el aforo del espacio (${espacio.aforo})`
      );
    }

    // 6. Validar solapes
    // Se asume que el repositorio tiene un método como:
    // findSolapadas(espacioId, fecha, horaInicio, duracion)
    const reservasSolapadas = await this.reservaRepository.findSolapadas(
      espacioId,
      fecha,
      horaInicio,
      duracionNum
    );

    if (reservasSolapadas && reservasSolapadas.length > 0) {
      throw new Error("Ya existe una reserva para ese espacio en esa franja horaria");
    }

    // 7. Crear entidad de dominio
    const reserva = new this.ReservaEntity({
      espacioId,
      usuarioId,
      fecha,
      horaInicio,
      duracion: duracionNum,
      numPersonas: numPersonasNum,
      tipoUso,
      descripcion,
      estado: "aceptada",
    });

    // 8. Guardar
    return await this.reservaRepository.save(reserva);
  }
}

module.exports = ReservarEspacioUseCase;