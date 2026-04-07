class DepartamentoRepository {
  async findById(_id) {
    throw new Error("Método findById() no implementado");
  }

  async findAll() {
    throw new Error("Método findAll() no implementado");
  }

  async findByNombre(_nombre) {
    throw new Error("Método findByNombre() no implementado");
  }
}

module.exports = DepartamentoRepository;