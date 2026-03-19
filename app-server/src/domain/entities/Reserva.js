class Reserva {  
  constructor({
    id = null,
    espacioId,
    usuarioId,
    fecha,
    horaInicio,
    duracion = null,
    numPersonas = null,
    tipoUso = null,
    descripcion = null,
    estado = "aceptada",
  }) {
    if (!espacioId) throw new Error("espacioId obligatorio");
    if (!usuarioId) throw new Error("usuarioId obligatorio");
    if (!fecha) throw new Error("fecha obligatoria");
    if (!horaInicio) throw new Error("horaInicio obligatoria");

    this.id = id;
    this.espacioId = espacioId;
    this.usuarioId = usuarioId;
    this.fecha = fecha;
    this.horaInicio = horaInicio;
    this.duracion = duracion;
    this.numPersonas = numPersonas;
    this.tipoUso = tipoUso;
    this.descripcion = descripcion;
    this.estado = estado;
  }
}

module.exports = Reserva;