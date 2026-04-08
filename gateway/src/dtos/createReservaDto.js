function validateCreateReservaDto(body) {
  const { espacios, fecha, horaInicio, duracion, tipoUso, descripcion } = body;

  if (!espacios) throw new Error("El campo espacios es obligatorio");
  if (!Array.isArray(espacios) || espacios.length === 0) {
    throw new Error("espacios debe ser un array con al menos un espacio");
  }

  for (const e of espacios) {
    if (!e.espacioId) throw new Error("Cada espacio debe tener espacioId");
    if (e.numPersonas !== undefined && e.numPersonas !== null) {
      const n = Number(e.numPersonas);
      if (Number.isNaN(n) || n <= 0) throw new Error("numPersonas debe ser mayor que 0");
    }
  }

  if (!fecha)      throw new Error("El campo fecha es obligatorio");
  if (!horaInicio) throw new Error("El campo horaInicio es obligatorio");
  if (!duracion)   throw new Error("El campo duracion es obligatorio");

  return {
    espacios: espacios.map((e) => ({
      espacioId:   Number(e.espacioId),
      numPersonas: e.numPersonas != null ? Number(e.numPersonas) : null,
    })),
    fecha:       String(fecha).trim(),
    horaInicio:  String(horaInicio).trim(),
    duracion:    Number(duracion),
    tipoUso:     tipoUso     ? String(tipoUso).trim()     : null,
    descripcion: descripcion ? String(descripcion).trim() : null,
  };
}

module.exports = { validateCreateReservaDto };