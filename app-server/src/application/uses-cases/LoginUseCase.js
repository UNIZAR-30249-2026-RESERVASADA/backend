const bcrypt = require("bcryptjs");

class LoginUseCase {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }
  async execute({ email, password }) {
    if (!email) {
      throw new Error("Email es obligatorio");
    }

    if (!password) {
      throw new Error("Password es obligatorio");
    }

    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    // ⭐ Validar password con bcrypt (comparar hasheada)
    console.log("LoginUseCase: comparando passwords");
    console.log("LoginUseCase: password recibido:", password);
    console.log("LoginUseCase: hash en BD:", usuario.contrasenia);
    
    const passwordValida = await bcrypt.compare(password, usuario.contrasenia);
    console.log("LoginUseCase: passwordValida:", passwordValida);
    
    if (!passwordValida) {
      throw new Error("Password incorrecto");
    }

    // Retorna el usuario con su rol (sin contraseña)
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      departamentoId: usuario.departamentoId,
    };
  }
}

module.exports = LoginUseCase;
