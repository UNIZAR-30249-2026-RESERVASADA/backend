const { Op } = require("sequelize");
const ReservaRepository = require("../../domain/repositories/ReservaRepository");
const Reserva = require("../../domain/entities/Reserva");

class SequelizeReservaRepository extends ReservaRepository {
  constructor({ ReservaModel, ReservaEspacioModel }) {
    super();
    this.ReservaModel        = ReservaModel;
    this.ReservaEspacioModel = ReservaEspacioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;

    const espacios = (modelo.ReservaEspacios ?? []).map((re) => ({
      espacioId:   Number(re.espacioId ?? re.espacio_id),
      numPersonas: re.numPersonas ?? re.num_personas ?? null,
    }));

    // Reservas antiguas sin filas en reservas_espacios — usar espacioId directo si existe
    const espaciosFinal = espacios.length > 0
      ? espacios
      : modelo.espacioId || modelo.espacio_id
        ? [{ espacioId: Number(modelo.espacioId ?? modelo.espacio_id), numPersonas: null }]
        : [{ espacioId: 0, numPersonas: null }];

    return new Reserva({
      id:          modelo.id,
      espacios:    espaciosFinal,
      usuarioId:   modelo.usuarioId   ?? modelo.usuario_id,
      fecha:       modelo.fecha,
      horaInicio:  (modelo.horaInicio ?? modelo.hora_inicio ?? "").toString().slice(0, 5),
      duracion:    modelo.duracion,
      tipoUso:     modelo.tipoUso     ?? modelo.tipo_uso  ?? null,
      descripcion: modelo.descripcion ?? null,
      estado:      modelo.estado,
    });
  }

  async save(reserva) {
    if (reserva.id) {
      const modelo = await this.ReservaModel.findByPk(reserva.id);
      if (!modelo) return null;
      await modelo.update({ estado: reserva.estado });
      const modeloCompleto = await this.ReservaModel.findByPk(reserva.id, {
        include: [{ model: this.ReservaEspacioModel }],
      });
      return this._toEntity(modeloCompleto);
    }

    const modelo = await this.ReservaModel.create({
      usuarioId:   reserva.usuarioId,
      fecha:       reserva.fecha,
      horaInicio:  reserva.horaInicio,
      duracion:    reserva.duracion,
      tipoUso:     reserva.tipoUso,
      descripcion: reserva.descripcion,
      estado:      reserva.estado,
    });

    await Promise.all(
      reserva.espacios.map(({ espacioId, numPersonas }) =>
        this.ReservaEspacioModel.create({
          reservaId:   modelo.id,
          espacioId,
          numPersonas: numPersonas ?? null,
        })
      )
    );

    const modeloCompleto = await this.ReservaModel.findByPk(modelo.id, {
      include: [{ model: this.ReservaEspacioModel }],
    });
    return this._toEntity(modeloCompleto);
  }

  async findById(id) {
    const modelo = await this.ReservaModel.findByPk(id, {
      include: [{ model: this.ReservaEspacioModel }],
    });
    return this._toEntity(modelo);
  }

  async findByUsuario(usuarioId) {
    const modelos = await this.ReservaModel.findAll({
      where: { usuarioId },
      include: [{ model: this.ReservaEspacioModel }],
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async findByEspacioYFecha(espacioId, fecha) {
    const reservaEspacios = await this.ReservaEspacioModel.findAll({
      where: { espacioId },
    });
    const reservaIds = reservaEspacios.map((re) => re.reservaId);
    if (reservaIds.length === 0) return [];

    const modelos = await this.ReservaModel.findAll({
      where: {
        id:     { [Op.in]: reservaIds },
        fecha,
        estado: { [Op.ne]: "cancelada" },
      },
      include: [{ model: this.ReservaEspacioModel }],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async findVivas() {
    const ahora     = new Date();
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
      include: [{ model: this.ReservaEspacioModel }],
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async deleteById(id) {
    const modelo = await this.ReservaModel.findByPk(id, {
      include: [{ model: this.ReservaEspacioModel }],
    });
    if (!modelo) return null;
    const entidad = this._toEntity(modelo);
    await this.ReservaEspacioModel.destroy({ where: { reservaId: id } });
    await modelo.destroy();
    return entidad;
  }
}

module.exports = SequelizeReservaRepository;