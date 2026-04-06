const EspacioRepository = require("../../domain/repositories/EspacioRepository");
const Espacio = require("../../domain/entities/Espacio");

class SequelizeEspacioRepository extends EspacioRepository {
  constructor({ EspacioModel }) {
    super();
    this.EspacioModel = EspacioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Espacio({
      gid:           modelo.gid,
      idEspacio:     modelo.id_espacio,
      nombre:        modelo.nombre,
      uso:           modelo.uso,
      categoria:     modelo.categoria,
      edificio:      modelo.edificio,
      planta:        modelo.planta,
      superficie:    modelo.superficie,
      reservable:    modelo.reservable,
      aforo:         modelo.aforo,
      geom:          modelo.geom,
      departamentoId: modelo.departamento_id ?? modelo.departamentoId ?? null,
      edificioId:    modelo.edificio_id      ?? modelo.edificioId     ?? null,
    });
  }

  async findById(id) {
    const modelo = await this.EspacioModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.planta)    where.planta    = filters.planta;
    if (filters.categoria) where.categoria = filters.categoria;
    if (typeof filters.reservable === "boolean") where.reservable = filters.reservable;

    const modelos = await this.EspacioModel.findAll({ where });
    return modelos.map((m) => this._toEntity(m));
  }

  async findAllMetadatos() {
    const modelos = await this.EspacioModel.findAll({
      attributes: ["id_espacio", "categoria", "reservable", "aforo"],
      order: [["id_espacio", "ASC"]],
    });
    return modelos.map((m) => ({
      id_espacio: m.id_espacio,
      categoria:  m.categoria,
      reservable: m.reservable,
      aforo:      m.aforo,
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