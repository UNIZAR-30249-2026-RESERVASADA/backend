class GetEspaciosMetadatos {
  constructor({ espacioRepository }) {
    this.espacioRepository = espacioRepository;
  }

  async execute() {
    const espacios = await this.espacioRepository.findAllMetadatos();
    return espacios.map((espacio) => ({
      gid:        espacio.gid,
      id_espacio: espacio.id_espacio,
      nombre:     espacio.nombre,
      categoria:  espacio.categoria,
      reservable: espacio.reservable,
      aforo:      espacio.aforo,
      planta:     espacio.planta,
      ocupado:    false,
    }));
  }
}

module.exports = GetEspaciosMetadatos;