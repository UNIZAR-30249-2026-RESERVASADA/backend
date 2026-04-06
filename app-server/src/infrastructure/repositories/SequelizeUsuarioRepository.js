const UsuarioRepository = require("../../domain/repositories/UsuarioRepository");
const Usuario = require("../../domain/entities/Usuario");

class SequelizeUsuarioRepository extends UsuarioRepository {
  constructor({ UsuarioModel }) {
    super();
    this.UsuarioModel = UsuarioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;
    return new Usuario({
      id:            modelo.id,
      nombre:        modelo.nombre,
      email:         modelo.email,
      contrasenia:   modelo.contrasenia,
      rol:           modelo.rol,
      esGerente:     modelo.esGerente   ?? modelo.es_gerente   ?? false,
      departamentoId: modelo.departamentoId ?? modelo.departamento_id ?? null,
    });
  }

  async findById(id) {
    const modelo = await this.UsuarioModel.findByPk(id);
    return this._toEntity(modelo);
  }

  async findByEmail(email) {
    const modelo = await this.UsuarioModel.findOne({ where: { email } });
    return this._toEntity(modelo);
  }

  async findAll() {
    const modelos = await this.UsuarioModel.findAll();
    return modelos.map((m) => this._toEntity(m));
  }

  async save(usuario) {
    const modelo = await this.UsuarioModel.create({
      nombre:         usuario.nombre,
      email:          usuario.email,
      contrasenia:    usuario.contrasenia,
      rol:            usuario.rol,
      esGerente:      usuario.esGerente,
      departamentoId: usuario.departamentoId,
    });
    return this._toEntity(modelo);
  }

  async updateRol(id, nuevoRol) {
    const modelo = await this.UsuarioModel.findByPk(id);
    if (!modelo) return null;
    modelo.rol = nuevoRol;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateDepartamento(id, departamentoId) {
    const modelo = await this.UsuarioModel.findByPk(id);
    if (!modelo) return null;
    modelo.departamentoId = departamentoId;
    await modelo.save();
    return this._toEntity(modelo);
  }
}

module.exports = SequelizeUsuarioRepository;