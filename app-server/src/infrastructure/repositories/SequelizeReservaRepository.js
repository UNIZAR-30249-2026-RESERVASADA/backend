const { Op } = require("sequelize");
const ReservaRepository = require("../../domain/repositories/ReservaRepository");
const Reserva = require("../../domain/entities/Reserva");

class SequelizeReservaRepository extends ReservaRepository {
  constructor({ ReservaModel }) {
    super();
    this.ReservaModel = ReservaModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Reserva({
      id:          modelo.id,
      espacioId:   modelo.espacioId   ?? modelo.espacio_id,
      usuarioId:   modelo.usuarioId   ?? modelo.usuario_id,
      fecha:       modelo.fecha,
      horaInicio:  modelo.horaInicio  ?? modelo.hora_inicio,
      duracion:    modelo.duracion,
      numPersonas: modelo.numPersonas ?? modelo.num_personas ?? null,
      tipoUso:     modelo.tipoUso     ?? modelo.tipo_uso     ?? null,
      descripcion: modelo.descripcion ?? null,
      estado:      modelo.estado,
    });
  }

  async save(reserva) {
    const modelo = await this.ReservaModel.create({
      espacioId:   reserva.espacioId,
      usuarioId:   reserva.usuarioId,
      fecha:       reserva.fecha,
      horaInicio:  reserva.horaInicio,
      duracion:    reserva.duracion,
      numPersonas: reserva.numPersonas,
      tipoUso:     reserva.tipoUso,
      descripcion: reserva.descripcion,
      estado:      reserva.estado,
    });
    return this._toEntity(modelo);
  }

  async findById(id) {
    const modelo = await this.ReservaModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async findByUsuario(usuarioId) {
    const modelos = await this.ReservaModel.findAll({
      where: { usuarioId },
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  // Solo trae reservas activas del espacio en esa fecha.
  // El filtro de solapamiento lo hace SolapamientoService en el caso de uso.
  async findByEspacioYFecha(espacioId, fecha) {
    const modelos = await this.ReservaModel.findAll({
      where: {
        espacioId,
        fecha,
        estado: { [Op.ne]: "cancelada" },
      },
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async findVivas() {
    const ahora = new Date();
    const fechaHoy  = ahora.toISOString().split("T")[0];
    const horaAhora = ahora.toTimeString().slice(0, 5);

    const modelos = await this.ReservaModel.findAll({
      where: {
        estado: "aceptada",
        [Op.or]: [
          { fecha: { [Op.gt]: fechaHoy } },
          { fecha: fechaHoy, horaInicio: { [Op.gte]: horaAhora } },
        ],
      },
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async deleteById(id) {
    const modelo = await this.ReservaModel.findByPk(id);
    if (!modelo) return null;
    const entidad = this._toEntity(modelo);
    await modelo.destroy();
    return entidad;
  }
}

module.exports = SequelizeReservaRepository;