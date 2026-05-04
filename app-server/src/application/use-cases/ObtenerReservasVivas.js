class ObtenerReservasVivas {
  constructor({ reservaRepository, usuarioRepository }) {
    this.reservaRepository = reservaRepository;
    this.usuarioRepository = usuarioRepository;
  }

  async execute() {
    const reservas = await this.reservaRepository.findVivas();

    // Las reservas se guardan en hora local española
    // El servidor Docker corre en UTC, hay que convertir a Europe/Madrid
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone:  "Europe/Madrid",
      year:      "numeric",
      month:     "2-digit",
      day:       "2-digit",
      hour:      "2-digit",
      minute:    "2-digit",
      hour12:    false,
    });

    const partes    = formatter.formatToParts(ahora);
    const get       = (type) => partes.find((p) => p.type === type)?.value ?? "00";
    const fechaHoy  = `${get("year")}-${get("month")}-${get("day")}`;
    const horaAhora = `${get("hour")}:${get("minute")}`;

    return Promise.all(reservas.map(async (r) => {
      // Determinar tipo
      let tipo;
      if (r.fecha < fechaHoy) {
        tipo = "en_curso";
      } else if (r.fecha > fechaHoy) {
        tipo = "proxima";
      } else {
        const enCurso = r.horaInicio <= horaAhora && horaAhora < r.horaFin;
        tipo = enCurso ? "en_curso" : "proxima";
      }

      // Calcular si se puede eliminar y el motivo
      let puedeEliminar = false;
      let motivoBloqueo = null;

      if (tipo === "en_curso") {
        motivoBloqueo = "La reserva ya está en curso";
      } else {
        // Calcular horas restantes usando hora de Madrid
        const [h, m]         = r.horaInicio.split(":").map(Number);
        const [fY, fM, fD]   = r.fecha.split("-").map(Number);
        const [hY, hM, hD]   = fechaHoy.split("-").map(Number);
        const [haH, haMin]   = horaAhora.split(":").map(Number);

        const inicioMs    = new Date(fY, fM - 1, fD, h, m).getTime();
        const ahoraMs     = new Date(hY, hM - 1, hD, haH, haMin).getTime();
        const horasRestantes = (inicioMs - ahoraMs) / (1000 * 60 * 60);

        if (horasRestantes >= 24) {
          puedeEliminar = true;
        } else {
          const horas = Math.floor(horasRestantes);
          const mins  = Math.floor((horasRestantes % 1) * 60);
          motivoBloqueo = `Quedan menos de 24h para el inicio (${horas}h ${mins}min)`;
        }
      }

      const usuario = await this.usuarioRepository.findById(r.usuarioId);

      return {
        id:            r.id,
        espacios:      r.espacios,
        usuarioId:     r.usuarioId,
        usuarioNombre: usuario?.nombre  || `Usuario #${r.usuarioId}`,
        usuarioEmail:  usuario?.email   || null,
        usuarioRol:    usuario?.rol     || null,
        fecha:         r.fecha,
        horaInicio:   r.horaInicio,
        horaFin:      r.horaFin,
        duracion:     r.duracion,
        tipoUso:      r.tipoUso,
        descripcion:  r.descripcion,
        estado:       r.estado,
        tipo,
        puedeEliminar,
        motivoBloqueo,
      };
    }));
  }
}

module.exports = ObtenerReservasVivas;