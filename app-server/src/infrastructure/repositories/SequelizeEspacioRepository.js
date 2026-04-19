const EspacioRepository = require("../../domain/repositories/EspacioRepository");
const Espacio = require("../../domain/entities/Espacio");

class SequelizeEspacioRepository extends EspacioRepository {
  constructor({ EspacioModel, UsuarioEspacioModel, UsuarioModel }) {
    super();
    this.EspacioModel        = EspacioModel;
    this.UsuarioEspacioModel = UsuarioEspacioModel;
    this.UsuarioModel        = UsuarioModel;
  }

  _toEntity(modelo) {
    if (!modelo) return null;

    const usuariosAsignados = (modelo.UsuarioEspacios ?? [])
      .map((ue) => ue.usuarioId ?? ue.usuario_id);

    return new Espacio({
      gid:               modelo.gid,
      idEspacio:         modelo.id_espacio,
      nombre:            modelo.nombre,
      uso:               modelo.uso,
      categoria:         modelo.categoria,
      edificio:          modelo.edificio,
      planta:            modelo.planta,
      superficie:        modelo.superficie,
      reservable:        modelo.reservable,
      aforo:             modelo.aforo,
      geom:              modelo.geom,
      asignadoAEina:     modelo.asignadoAEina ?? false,
      departamentoId:    modelo.departamento_id ?? modelo.departamentoId ?? null,
      edificioId:        modelo.edificio_id    ?? modelo.edificioId     ?? null,
      usuariosAsignados,
    });
  }

  async findById(id) {
    const modelo = await this.EspacioModel.findByPk(id, {
      include: [{ model: this.UsuarioEspacioModel }],
    });
    return this._toEntity(modelo);
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.planta)    where.planta    = filters.planta;
    if (filters.categoria) where.categoria = filters.categoria;
    if (typeof filters.reservable === "boolean") where.reservable = filters.reservable;

    const modelos = await this.EspacioModel.findAll({
      where,
      include: [{ model: this.UsuarioEspacioModel }],
    });
    return modelos.map((m) => this._toEntity(m));
  }

  async findAllMetadatos() {
    const { Op } = require("sequelize");

    // 1. Cargar espacios con sus relaciones de usuario
    const modelos = await this.EspacioModel.findAll({
      attributes: [
        "gid", "id_espacio", "nombre", "uso", "categoria",
        "reservable", "aforo", "planta",
        "departamentoId", "asignadoAEina",
      ],
      include: [{ model: this.UsuarioEspacioModel, attributes: ["usuarioId"] }],
      order: [["id_espacio", "ASC"]],
    });

    // 2. Recoger todos los usuarioIds unicos
    const todosLosIds = new Set();
    for (const m of modelos) {
      for (const ue of m.UsuarioEspacios ?? []) {
        const uid = ue.usuarioId ?? ue.usuario_id;
        if (uid) todosLosIds.add(Number(uid));
      }
    }

    // 3. Cargar usuarios de una sola vez
    const usuariosPorId = {};
    if (todosLosIds.size > 0) {
      const usuarios = await this.UsuarioModel.findAll({
        where: { id: Array.from(todosLosIds) },
        attributes: ["id", "nombre", "rol"],
      });
      for (const u of usuarios) usuariosPorId[Number(u.id)] = u;
    }

    // 4. Construir resultado
    return modelos.map((m) => ({
      gid:            m.gid,
      id_espacio:     m.id_espacio,
      nombre:         m.nombre,
      uso:            m.uso ?? null,
      categoria:      m.categoria,
      reservable:     m.reservable,
      aforo:          m.aforo,
      planta:         m.planta,
      departamentoId: m.departamentoId ?? m.departamento_id ?? null,
      asignadoAEina:  m.asignadoAEina  ?? false,
      usuariosAsignados: (m.UsuarioEspacios ?? []).map((ue) => {
        const uid = Number(ue.usuarioId ?? ue.usuario_id);
        const u   = usuariosPorId[uid];
        return { id: uid, nombre: u?.nombre ?? null, rol: u?.rol ?? null };
      }),
    }));
  }

  async updateCategoria(id, categoria) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.categoria = categoria;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateReservable(id, reservable) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.reservable = reservable;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateAforo(id, aforo) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;
    modelo.aforo = aforo;
    await modelo.save();
    return this._toEntity(modelo);
  }

  async updateAsignacion(id, { departamentoId, asignadoAEina, usuariosAsignados }) {
    const modelo = await this.EspacioModel.findByPk(id);
    if (!modelo) return null;

    // Actualizar campos de asignación en el espacio
    modelo.departamentoId = departamentoId ?? null;
    modelo.asignadoAEina  = asignadoAEina  ?? false;
    await modelo.save();

    // Actualizar usuarios asignados — borrar los anteriores y crear los nuevos
    await this.UsuarioEspacioModel.destroy({ where: { espacioId: id } });
    if (usuariosAsignados && usuariosAsignados.length > 0) {
      await Promise.all(
        usuariosAsignados.map((uid) =>
          this.UsuarioEspacioModel.findOrCreate({
            where: { usuarioId: uid, espacioId: id },
          })
        )
      );
    }

    return this._toEntity(await this.EspacioModel.findByPk(id, {
      include: [{ model: this.UsuarioEspacioModel }],
    }));
  }
}

module.exports = SequelizeEspacioRepository;