class SequelizeUsuarioRepository {
  constructor(UsuarioModel) {
    this.UsuarioModel = UsuarioModel;
  }

  async findById(id) {
    return await this.UsuarioModel.findByPk(id);
  }

  async findByEmail(email) {
    return await this.UsuarioModel.findOne({ where: { email } });
  }

  async findAll() {
    return await this.UsuarioModel.findAll();
  }
}

module.exports = SequelizeUsuarioRepository;
