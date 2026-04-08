const Rol              = require("../value-objects/Rol");
const CategoriaReserva = require("../value-objects/CategoriaReserva");

class ReservaPolicy {
  /**
   * Determina si un usuario con el rol dado puede reservar un espacio
   * de la categoría dada, teniendo en cuenta restricciones de departamento.
   * Función sin efectos secundarios.
   *
   * @param {string|Rol} rolUsuario
   * @param {string|CategoriaReserva} categoriaEspacio
   * @param {Departamento|null} deptUsuario
   * @param {Departamento|null} deptEspacio
   * @returns {boolean}
   */
  static puedeReservar(rolUsuario, categoriaEspacio, deptUsuario = null, deptEspacio = null) {
    if (!rolUsuario || !categoriaEspacio) return false;

    const rol      = rolUsuario      instanceof Rol              ? rolUsuario      : new Rol(rolUsuario);
    const categoria = categoriaEspacio instanceof CategoriaReserva ? categoriaEspacio : new CategoriaReserva(categoriaEspacio);

    // Usa esMismoDepartamento() de la entidad Departamento
    const mismoDepto = deptUsuario && deptEspacio
      ? deptUsuario.esMismoDepartamento(deptEspacio)
      : false;

    if (rol.esGerente()) return true;

    if (rol.esEstudiante()) {
      return categoria.esSalaComun();
    }

    if (rol.esInvestigadorContratado() || rol.esDocenteInvestigador()) {
      if (categoria.esLaboratorio() || categoria.esDespacho()) return mismoDepto;
      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    if (rol.esTecnicoLaboratorio()) {
      if (categoria.esLaboratorio()) return mismoDepto;
      if (categoria.esSeminario() || categoria.esSalaComun()) return true;
      return false;
    }

    if (rol.esConserje()) {
      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    if (rol.esInvestigadorVisitante()) {
      if (categoria.esLaboratorio()) return mismoDepto;
      return categoria.esAula() || categoria.esSeminario() || categoria.esSalaComun();
    }

    return false;
  }

  static categoriasLibres(rolUsuario) {
    const rol = new Rol(rolUsuario);

    if (rol.esGerente())    return CategoriaReserva.VALORES;
    if (rol.esEstudiante()) return ["sala comun"];

    if (rol.esInvestigadorContratado() || rol.esDocenteInvestigador()) {
      return ["aula", "seminario", "sala comun"];
    }

    if (rol.esTecnicoLaboratorio())    return ["seminario", "sala comun"];
    if (rol.esConserje())              return ["aula", "seminario", "sala comun"];
    if (rol.esInvestigadorVisitante()) return ["aula", "seminario", "sala comun"];

    return [];
  }

  static categoriasConRestriccionDepartamento(rolUsuario) {
    const rol = new Rol(rolUsuario);

    if (rol.esInvestigadorContratado() || rol.esDocenteInvestigador()) {
      return ["laboratorio", "despacho"];
    }
    if (rol.esTecnicoLaboratorio() || rol.esInvestigadorVisitante()) {
      return ["laboratorio"];
    }
    return [];
  }
}

module.exports = ReservaPolicy;