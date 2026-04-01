const ReservarEspacioUseCase = require("../../../src/application/uses-cases/ReservarEspacioUseCase");

describe("ReservarEspacioUseCase", () => {
  let espacioRepository;
  let reservaRepository;
  let usuarioRepository;
  let ReservaEntity;
  let ReservaPolicy;
  let useCase;

  beforeEach(() => {
    espacioRepository = {
      findById: jest.fn(),
    };

    reservaRepository = {
      findSolapadas: jest.fn(),
      save: jest.fn(),
    };

    usuarioRepository = {
      findById: jest.fn(),
    };

    ReservaEntity = jest.fn().mockImplementation((data) => data);

    ReservaPolicy = {
      puedeReservar: jest.fn(),
    };

    useCase = new ReservarEspacioUseCase({
      espacioRepository,
      reservaRepository,
      ReservaEntity,
      usuarioRepository,
      ReservaPolicy,
    });
  });

  test("lanza error si falta espacioId", async () => {
    await expect(
      useCase.execute({
        usuarioId: 1,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      })
    ).rejects.toThrow("El id del espacio es obligatorio");
  });

  test("lanza error si el usuario no existe", async () => {
    usuarioRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      })
    ).rejects.toThrow("El usuario no existe");
  });

  test("lanza error si el espacio no existe", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "estudiante",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      })
    ).rejects.toThrow("El espacio no existe");
  });

  test("lanza error si el espacio no es reservable", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "estudiante",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue({
      id_espacio: 1,
      categoria: "aula",
      reservable: false,
      aforo: 20,
      departamentoId: null,
    });

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      })
    ).rejects.toThrow("El espacio no es reservable");
  });

  test("lanza error si la policy no permite reservar", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "estudiante",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue({
      id_espacio: 1,
      categoria: "aula",
      reservable: true,
      aforo: 20,
      departamentoId: null,
    });

    ReservaPolicy.puedeReservar.mockReturnValue(false);

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
      })
    ).rejects.toThrow("Tu rol (estudiante) no permite reservar espacios de tipo aula");
  });

  test("lanza error si supera el aforo", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "gerente",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue({
      id_espacio: 1,
      categoria: "aula",
      reservable: true,
      aforo: 10,
      departamentoId: null,
    });

    ReservaPolicy.puedeReservar.mockReturnValue(true);
    reservaRepository.findSolapadas.mockResolvedValue([]);

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
        numPersonas: 25,
      })
    ).rejects.toThrow("supera el aforo");
  });

  test("lanza error si hay solape", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "gerente",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue({
      id_espacio: 1,
      categoria: "aula",
      reservable: true,
      aforo: 20,
      departamentoId: null,
    });

    ReservaPolicy.puedeReservar.mockReturnValue(true);
    reservaRepository.findSolapadas.mockResolvedValue([{ id: 99 }]);

    await expect(
      useCase.execute({
        espacioId: 1,
        usuarioId: 2,
        fecha: "2026-03-31",
        horaInicio: "10:00",
        duracion: 1,
        numPersonas: 10,
      })
    ).rejects.toThrow("Ya existe una reserva para ese espacio en esa franja horaria");
  });

  test("guarda la reserva si todo es válido", async () => {
    usuarioRepository.findById.mockResolvedValue({
      id: 2,
      rol: "gerente",
      departamentoId: null,
    });

    espacioRepository.findById.mockResolvedValue({
      id_espacio: 1,
      categoria: "aula",
      reservable: true,
      aforo: 20,
      departamentoId: null,
    });

    ReservaPolicy.puedeReservar.mockReturnValue(true);
    reservaRepository.findSolapadas.mockResolvedValue([]);
    reservaRepository.save.mockResolvedValue({ id: 101 });

    const result = await useCase.execute({
      espacioId: 1,
      usuarioId: 2,
      fecha: "2026-03-31",
      horaInicio: "10:00",
      duracion: 1,
      numPersonas: 10,
      tipoUso: "docencia",
      descripcion: "Clase",
    });

    expect(result).toEqual({ id: 101 });
    expect(ReservaEntity).toHaveBeenCalled();
    expect(reservaRepository.save).toHaveBeenCalled();
  });
});