const EdificioRepository = require("../../domain/repositories/EdificioRepository");
const Edificio = require("../../domain/entities/Edificio");

class SequelizeEdificioRepository extends EdificioRepository {
  constructor({ EdificioModel }) {
    super();
    this.EdificioModel = EdificioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Edificio({
      id:                  modelo.id,
      idEdificio:          modelo.id_edificio,
      nombre:              modelo.nombre,
      direccion:           modelo.direccion     ?? null,
      campus:              modelo.campus,
      horarioApertura:     modelo.horarioApertura ?? null,
      horarioCierre:       modelo.horarioCierre,
      porcentajeOcupacion: modelo.porcentajeOcupacion ?? null,
    });
  }

  async findById(id) {
    const modelo = await this.EdificioModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async findAll() {
    const modelos = await this.EdificioModel.findAll();
    return modelos.map((m) => this._toEntity(m));
  }

  async findByIdEdificio(idEdificio) {
    const modelo = await this.EdificioModel.findOne({
      where: { id_edificio: idEdificio },
    });
    return this._toEntity(modelo);
  }
}

module.exports = SequelizeEdificioRepository;