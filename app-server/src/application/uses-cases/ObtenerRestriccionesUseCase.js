const ReservaPolicy = require("../../domain/policies/ReservaPolicy");

class ObtenerRestriccionesUseCase {
  async execute({ rolUsuario }) {
    if (!rolUsuario) {
      throw new Error("El rol del usuario es obligatorio");
    }

    return {
      rol: rolUsuario,
      puedereservar: ReservaPolicy.restriccionesporRol[rolUsuario.toLowerCase()] || [],
      mensaje: ReservaPolicy.obtenerRestriccionesTexto(rolUsuario),
    };
  }
}

module.exports = ObtenerRestriccionesUseCase;
