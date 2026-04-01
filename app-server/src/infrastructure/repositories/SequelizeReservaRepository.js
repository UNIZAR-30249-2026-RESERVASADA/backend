const { Op } = require("sequelize");
const ReservaRepository = require("../../domain/repositories/ReservaRepository");

function sumarHoras(horaInicio, duracion) {
  const [h, m] = horaInicio.split(":").map(Number);
  const inicioMin = h * 60 + m;
  const finMin = inicioMin + duracion * 60;
  return finMin;
}

class SequelizeReservaRepository extends ReservaRepository {
  constructor({ ReservaModel }) {
    super();
    this.ReservaModel = ReservaModel;
  }

  async save(reserva) {
    return await this.ReservaModel.create({
      espacioId: reserva.espacioId,
      usuarioId: reserva.usuarioId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      duracion: reserva.duracion,
      numPersonas: reserva.numPersonas,
      tipoUso: reserva.tipoUso,
      descripcion: reserva.descripcion,
      estado: reserva.estado,
    });
  }

  async findSolapadas(espacioId, fecha, horaInicio, duracion) {
    const reservas = await this.ReservaModel.findAll({
      where: {
        espacioId,
        fecha,
        estado: {
          [Op.ne]: "cancelada",
        },
      },
    });

    const nuevaInicio = sumarHoras(horaInicio, 0);
    const nuevaFin = sumarHoras(horaInicio, duracion);

    return reservas.filter((r) => {
      const existenteInicio = sumarHoras(r.horaInicio, 0);
      const existenteFin = sumarHoras(r.horaInicio, Number(r.duracion));

      return nuevaInicio < existenteFin && nuevaFin > existenteInicio;
    });
  }

  async findById(id) {
    return await this.ReservaModel.findByPk(id);
  }

  async findByUsuario(usuarioId) {
    return await this.ReservaModel.findAll({
      where: { usuarioId },
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });
  }
}

module.exports = SequelizeReservaRepository;