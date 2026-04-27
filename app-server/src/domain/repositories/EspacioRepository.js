class EspacioRepository {
  async findById(_id) {
    throw new Error("Método findById() no implementado");
  }

  async findAll() {
    throw new Error("Método findAll() no implementado");
  }

  async findAllMetadatos() {
    throw new Error("Método findAllMetadatos() no implementado");
  }

  async updateCategoria(_id, _data) {
    throw new Error("Método updateCategoria() no implementado");
  }

  async updateReservable(_id, _reservable) {
    throw new Error("Método updateReservable() no implementado");
  }

  async updateAforo(_id, _aforo) {
    throw new Error("Método updateAforo() no implementado");
  }

  async updateAsignacion(_id, _asignacion) {
    throw new Error("Método updateAsignacion() no implementado");
  }

  async updateHorario(_id, _horarioApertura, _horarioCierre) {
    throw new Error("Método updateHorario() no implementado");
  }

  async updatePorcentaje(_id, _porcentaje) {
    throw new Error("Método updatePorcentaje() no implementado");
  }

  async findByEdificioId(_edificioId) {
    throw new Error("Método findByEdificioId() no implementado");
  }
}

module.exports = EspacioRepository;