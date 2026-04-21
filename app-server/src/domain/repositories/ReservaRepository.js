class ReservaRepository {
  async save(_reserva) {
    throw new Error("Método save() no implementado");
  }

  async findById(_id) {
    throw new Error("Método findById() no implementado");
  }

  async findByUsuario(_usuarioId) {
    throw new Error("Método findByUsuario() no implementado");
  }

  async findByEspacioYFecha(_espacioId, _fecha) {
    throw new Error("Método findByEspacioYFecha() no implementado");
  }

  async findVivas() {
    throw new Error("Método findVivas() no implementado");
  }

  async findVivasPorEspacio(_espacioId) {
    throw new Error("Método findVivasPorEspacio() no implementado");
  }

  async deleteById(_id) {
    throw new Error("Método deleteById() no implementado");
  }
}

module.exports = ReservaRepository;