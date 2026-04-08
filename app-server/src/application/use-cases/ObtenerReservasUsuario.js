class ObtenerReservasUsuario {
  constructor({ reservaRepository }) {
    this.reservaRepository = reservaRepository;
  }

  async execute({ usuarioId }) {
    if (!usuarioId) throw new Error("usuarioId es obligatorio");

    const reservas = await this.reservaRepository.findByUsuario(usuarioId);

    return reservas.map((r) => ({
      id:          r.id,
      espacios:    r.espacios,   // [{ espacioId, numPersonas }]
      fecha:       r.fecha,
      horaInicio:  r.horaInicio,
      horaFin:     r.horaFin,
      duracion:    r.duracion,
      tipoUso:     r.tipoUso,
      descripcion: r.descripcion,
      estado:      r.estado,
    }));
  }
}

module.exports = ObtenerReservasUsuario;