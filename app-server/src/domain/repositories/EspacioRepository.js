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
}

module.exports = EspacioRepository;