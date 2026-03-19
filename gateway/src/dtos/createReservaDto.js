function validateCreateReservaDto(body) {
  const { espacioId, usuarioId, fecha, horaInicio, duracion, numPersonas, tipoUso, descripcion } = body;

  if (!espacioId) {
    throw new Error("El campo espacioId es obligatorio");
  }

  if (!usuarioId) {
    throw new Error("El campo usuarioId es obligatorio");
  }

  if (!fecha) {
    throw new Error("El campo fecha es obligatorio");
  }

  if (!horaInicio) {
    throw new Error("El campo horaInicio es obligatorio");
  }

  if (!duracion) {
    throw new Error("El campo duracion es obligatorio");
  }

  return {
    espacioId: Number(espacioId),
    usuarioId: Number(usuarioId),
    fecha: String(fecha).trim(),
    horaInicio: String(horaInicio).trim(),
    duracion: Number(duracion),
    numPersonas: numPersonas ? Number(numPersonas) : null,
    tipoUso: tipoUso ? String(tipoUso).trim() : null,
    descripcion: descripcion ? String(descripcion).trim() : null,
  };
}

module.exports = {
  validateCreateReservaDto,
};