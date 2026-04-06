class GetEspaciosMetadatos {
  constructor({ espacioRepository }) {
    this.espacioRepository = espacioRepository;
  }

  async execute() {
    const espacios = await this.espacioRepository.findAllMetadatos();

    return espacios.map((espacio) => ({
      id_espacio: espacio.id_espacio,
      categoria: espacio.categoria,
      reservable: espacio.reservable,
      aforo: espacio.aforo,
      ocupado: false,
    }));
  }
}

module.exports = GetEspaciosMetadatos;