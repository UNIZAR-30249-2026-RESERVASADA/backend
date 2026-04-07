const DepartamentoRepository = require("../../domain/repositories/DepartamentoRepository");
const Departamento = require("../../domain/entities/Departamento");

class SequelizeDepartamentoRepository extends DepartamentoRepository {
  constructor({ DepartamentoModel }) {
    super();
    this.DepartamentoModel = DepartamentoModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Departamento({
      id:     modelo.id,
      nombre: modelo.nombre,
    });
  }

  async findById(id) {
    const modelo = await this.DepartamentoModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async findAll() {
    const modelos = await this.DepartamentoModel.findAll();
    return modelos.map((m) => this._toEntity(m));
  }

  async findByNombre(nombre) {
    const modelo = await this.DepartamentoModel.findOne({
      where: { nombre },
    });
    return this._toEntity(modelo);
  }
}

module.exports = SequelizeDepartamentoRepository;