const EspacioRepository = require("../../domain/repositories/EspacioRepository");
const Espacio = require("../../domain/entities/Espacio");

class SequelizeEspacioRepository extends EspacioRepository {
  constructor({ EspacioModel, UsuarioEspacioModel }) {
    super();
    this.EspacioModel        = EspacioModel;
    this.UsuarioEspacioModel = UsuarioEspacioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;

    const usuariosAsignados = (modelo.UsuarioEspacios ?? [])
      .map((ue) => ue.usuarioId ?? ue.usuario_id);

    return new Espacio({
      gid:               modelo.gid,
      idEspacio:         modelo.id_espacio,
      nombre:            modelo.nombre,
      uso:               modelo.uso,
      categoria:         modelo.categoria,
      edificio:          modelo.edificio,
      planta:            modelo.planta,
      superficie:        modelo.superficie,
      reservable:        modelo.reservable,
      aforo:             modelo.aforo,
      geom:              modelo.geom,
      asignadoAEina:     modelo.asignadoAEina ?? false,
      departamentoId:    modelo.departamento_id ?? modelo.departamentoId ?? null,
      edificioId:        modelo.edificio_id    ?? modelo.edificioId     ?? null,
      usuariosAsignados,
    });
  }

  async findById(id) {
    const modelo = await this.EspacioModel.findByPk(id, {
      include: [{ model: this.UsuarioEspacioModel }],
    });
    return this._toEntity(modelo);
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.planta)    where.planta    = filters.planta;
    if (filters.categoria) where.categoria = filters.categoria;
    if (typeof filters.reservable === "boolean") where.reservable = filters.reservable;

    const modelos = await this.EspacioModel.findAll({
      where,
      include: [{ model: this.UsuarioEspacioModel }],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async findAllMetadatos() {
    const modelos = await this.EspacioModel.findAll({
      attributes: ["gid", "id_espacio", "nombre", "categoria", "reservable", "aforo", "planta"],
      order: [["id_espacio", "ASC"]],
    });
    return modelos.map((m) => ({
      gid:        m.gid,
      id_espacio: m.id_espacio,
      nombre:     m.nombre,
      categoria:  m.categoria,
      reservable: m.reservable,
      aforo:      m.aforo,
      planta:     m.planta,
    }));
  }

  async updateCategoria(id, categoria) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.categoria = categoria;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateReservable(id, reservable) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.reservable = reservable;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateAforo(id, aforo) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.aforo = aforo;
    await modelo.save();
    return this._toEntity(modelo);
  }
}

module.exports = SequelizeEspacioRepository;