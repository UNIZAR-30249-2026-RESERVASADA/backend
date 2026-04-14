const Rol              = require("../value-objects/Rol");
const CategoriaReserva = require("../value-objects/CategoriaReserva");

class ReservaPolicy {
  /**
   * Determina si un usuario con el rol dado puede reservar un espacio.
   * Función sin efectos secundarios.
   *
   * @param {string|Rol}              rolUsuario
   * @param {string|CategoriaReserva} categoriaEspacio
   * @param {Departamento|null}       deptUsuario
   * @param {Departamento|null}       deptEspacio                          - si tiene valor, el espacio está asignado a ese departamento
   * @param {boolean}                 usuarioEstaAsignado                  - el usuario está en usuariosAsignados del espacio
   * @param {boolean}                 espacioAsignadoAInvestigadorVisitante - algún usuario asignado tiene rol investigador_visitante
   * @returns {boolean}
   */
  static puedeReservar(
    rolUsuario,
    categoriaEspacio,
    deptUsuario                          = null,
    deptEspacio                          = null,
    usuarioEstaAsignado                  = false,
    espacioAsignadoAInvestigadorVisitante = false
  ) {
    if (!rolUsuario || !categoriaEspacio) return false;

    const rol      = rolUsuario      instanceof Rol              ? rolUsuario      : new Rol(rolUsuario);
    const categoria = categoriaEspacio instanceof CategoriaReserva ? categoriaEspacio : new CategoriaReserva(categoriaEspacio);

    const mismoDepto = deptUsuario && deptEspacio
      ? deptUsuario.esMismoDepartamento(deptEspacio)
      : false;

    if (rol.esGerente()) return true;

    if (rol.esEstudiante()) return categoria.esSalaComun();

    if (rol.esInvestigadorContratado() || rol.esDocenteInvestigador()) {
      if (categoria.esLaboratorio()) return mismoDepto;

      if (categoria.esDespacho()) {
        // O3: asignado a departamento — deptEspacio tiene valor
        if (deptEspacio) return mismoDepto;
        // O7: asignado a investigador visitante
        if (espacioAsignadoAInvestigadorVisitante) return mismoDepto;
        // Asignado a otra persona — no reservable
        return false;
      }

      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    if (rol.esTecnicoLaboratorio()) {
      if (categoria.esLaboratorio()) return mismoDepto;
      return categoria.esSeminario() || categoria.esSalaComun();
    }

    if (rol.esConserje()) {
      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    if (rol.esInvestigadorVisitante()) {
      if (categoria.esDespacho()) return usuarioEstaAsignado;
      if (categoria.esLaboratorio()) return mismoDepto;
      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    return false;
  }
}

module.exports = ReservaPolicy;