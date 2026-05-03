class UsuarioRepository {
  async findById(_id) {
    throw new Error("Método findById() no implementado");
  }

  async findByEmail(_email) {
    throw new Error("Método findByEmail() no implementado");
  }

  async save(_usuario) {
    throw new Error("Método save() no implementado");
  }

  async updateRol(_id, _nuevoRol) {
    throw new Error("Método updateRol() no implementado");
  }

  async updateDepartamento(_id, _departamentoId) {
    throw new Error("Método updateDepartamento() no implementado");
  }

  async updateEsGerente(_id, _esGerente) {
    throw new Error("Método updateEsGerente() no implementado");
  }

  async findAll() {
    throw new Error("Método findAll() no implementado");
  }
}

module.exports = UsuarioRepository;