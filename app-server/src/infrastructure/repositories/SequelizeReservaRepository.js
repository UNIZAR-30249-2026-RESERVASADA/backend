const { Op } = require("sequelize");
const ReservaRepository = require("../../domain/repositories/ReservaRepository");

class SequelizeReservaRepository extends ReservaRepository {
  constructor({ ReservaModel }) {
    super();
    this.ReservaModel = ReservaModel;
  }
  async save(reserva) {
    console.log("SequelizeReservaRepository.save() recibió:", reserva);
    const creada = await this.ReservaModel.create({
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
    console.log("Reserva guardada en BD:", creada.toJSON());
    return creada;
  }

  async findSolapadas(espacioId, fecha, horaInicio, horaFin) {
    return await this.ReservaModel.findAll({
      where: {
        espacioId,
        fecha,
        estado: {
          [Op.ne]: "cancelada",
        },
        [Op.and]: [
          {
            horaInicio: {
              [Op.lt]: horaFin,
            },
          },
          {
            horaFin: {
              [Op.gt]: horaInicio,
            },
          },
        ],
      },
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