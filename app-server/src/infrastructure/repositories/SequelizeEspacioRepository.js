class SequelizeEspacioRepository {
  constructor({ EspacioModel }) {
    this.EspacioModel = EspacioModel;
  }
  async findById(id) {
    return await this.EspacioModel.findByPk(id);
  }

  async findAll(filters = {}) {
    const where = {};

    if (filters.planta) where.planta = filters.planta;
    if (filters.categoria) where.categoria = filters.categoria;
    if (typeof filters.reservable === "boolean") where.reservable = filters.reservable;

    return await this.EspacioModel.findAll({ where });
  }

  async updateCategoria(id, categoria) {
    const espacio = await this.findById(id);

    if (!espacio) return null;

    espacio.categoria = categoria;
    await espacio.save();

    return espacio;
  }

  async findAllMetadatos() {
    return await this.EspacioModel.findAll({
      attributes: ["id_espacio", "categoria", "reservable", "aforo"],
      order: [["id_espacio", "ASC"]],
    });
  }
}

module.exports = SequelizeEspacioRepository;