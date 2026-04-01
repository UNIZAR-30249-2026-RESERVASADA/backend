const GetEspaciosMetadatosUseCase = require("../../../src/application/uses-cases/GetEspaciosMetadatosUseCase");

describe("GetEspaciosMetadatosUseCase", () => {
  let espacioRepository;
  let useCase;

  beforeEach(() => {
    espacioRepository = {
      findAllMetadatos: jest.fn(),
    };

    useCase = new GetEspaciosMetadatosUseCase({
      espacioRepository,
    });
  });

  test("devuelve la lista de metadatos transformada", async () => {
    espacioRepository.findAllMetadatos.mockResolvedValue([
      {
        id_espacio: 1,
        categoria: "aula",
        reservable: true,
        aforo: 30,
      },
      {
        id_espacio: 2,
        categoria: "laboratorio",
        reservable: false,
        aforo: 20,
      },
    ]);

    const result = await useCase.execute();

    expect(result).toEqual([
      {
        id_espacio: 1,
        categoria: "aula",
        reservable: true,
        aforo: 30,
        ocupado: false,
      },
      {
        id_espacio: 2,
        categoria: "laboratorio",
        reservable: false,
        aforo: 20,
        ocupado: false,
      },
    ]);
  });

  test("devuelve array vacío si no hay espacios", async () => {
    espacioRepository.findAllMetadatos.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});