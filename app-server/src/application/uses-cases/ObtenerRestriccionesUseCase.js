const ReservaPolicy = require("../../domain/policies/ReservaPolicy");

class ObtenerRestriccionesUseCase {
  async execute({ rolUsuario }) {
    if (!rolUsuario) {
      throw new Error("El rol del usuario es obligatorio");
    }

    // Solo retorna el mensaje descriptivo
    // La validación real está en ReservaPolicy al intentar reservar
    return {
      rol: rolUsuario,
      mensaje: ReservaPolicy.obtenerRestriccionesTexto(rolUsuario),
    };
  }
}

module.exports = ObtenerRestriccionesUseCase;
