const NotificacionRepository = require("../../domain/repositories/NotificacionRepository");
const Notificacion           = require("../../domain/entities/Notificacion");

class SequelizeNotificacionRepository extends NotificacionRepository {
  constructor({ NotificacionModel }) {
    super();
    this.NotificacionModel = NotificacionModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Notificacion({
      id:            Number(modelo.id),
      usuarioId:     Number(modelo.usuarioId),
      reservaId:     Number(modelo.reservaId),
      motivo:        modelo.motivo,
      descripcion:   modelo.descripcion ?? null,
      leida:         modelo.leida,
      fechaCreacion: modelo.fechaCreacion,
    });
  }

  async save(notificacion) {
    if (notificacion.id) {
      const modelo = await this.NotificacionModel.findByPk(notificacion.id);
      if (!modelo) return null;
      await modelo.update({ leida: notificacion.leida });
      return this._toEntity(await this.NotificacionModel.findByPk(notificacion.id));
    }

    const modelo = await this.NotificacionModel.create({
      usuarioId:    notificacion.usuarioId,
      reservaId:    notificacion.reservaId,
      motivo:       notificacion.motivo,
      descripcion:  notificacion.descripcion,
      leida:        notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
    });
    return this._toEntity(modelo);
  }

  async findByUsuario(usuarioId) {
    const modelos = await this.NotificacionModel.findAll({
      where: { usuarioId },
      order: [["fechaCreacion", "DESC"]],
    });
    return modelos.map(m => this._toEntity(m));
  }

  async findById(id) {
    const modelo = await this.NotificacionModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async marcarLeidaPorUsuario(usuarioId) {
    await this.NotificacionModel.update(
      { leida: true },
      { where: { usuarioId, leida: false } }
    );
  }
}

module.exports = SequelizeNotificacionRepository;