jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const LoginUseCase = require("../../../src/application/uses-cases/LoginUseCase");

describe("LoginUseCase", () => {
  let usuarioRepository;
  let useCase;

  beforeEach(() => {
    usuarioRepository = {
      findByEmail: jest.fn(),
    };

    useCase = new LoginUseCase({
      usuarioRepository,
    });

    jest.clearAllMocks();
  });

  test("lanza error si no existe el usuario", async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: "noexiste@unizar.es",
        password: "password",
      })
    ).rejects.toThrow();
  });

  test("lanza error si la contraseña es incorrecta", async () => {
    usuarioRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: "ana@unizar.es",
      contrasenia: "hash-falso",
      rol: "docente_investigador",
      departamentoId: 1,
    });

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: "ana@unizar.es",
        password: "password",
      })
    ).rejects.toThrow();
  });

  test("devuelve el usuario si las credenciales son correctas", async () => {
    usuarioRepository.findByEmail.mockResolvedValue({
      id: 1,
      nombre: "Ana",
      email: "ana@unizar.es",
      contrasenia: "hash-correcto",
      rol: "docente_investigador",
      departamentoId: 1,
    });

    bcrypt.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: "ana@unizar.es",
      password: "password",
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        email: "ana@unizar.es",
        rol: "docente_investigador",
      })
    );
  });
});