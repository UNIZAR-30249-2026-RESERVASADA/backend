class Espacio {
  constructor({
    gid,             // PK en la tabla
    idEspacio,       // id_espacio
    nombre,
    uso,
    categoria,
    edificio,        // nombre edificio (campo string)
    planta,
    superficie,
    reservable,
    aforo,
    geom,
    departamentoId = null,
    edificioId = null,
  }) {
    this.gid = gid;
    this.idEspacio = idEspacio;
    this.nombre = nombre;
    this.uso = uso;
    this.categoria = categoria;
    this.edificio = edificio;
    this.planta = planta;
    this.superficie = superficie;
    this.reservable = reservable;
    this.aforo = aforo;
    this.geom = geom;

    this.departamentoId = departamentoId;
    this.edificioId = edificioId;
  }
}

module.exports = Espacio;