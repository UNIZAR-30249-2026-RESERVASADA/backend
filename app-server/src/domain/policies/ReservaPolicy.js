class ReservaPolicy {
  /**
   * Verifica si un usuario puede reservar un espacio según su rol y departamento
   * @param {string} rolUsuario - rol del usuario
   * @param {string} categoriaEspacio - categoría del espacio
   * @param {number} deptUsuario - departamento del usuario (null si no aplica)
   * @param {number} deptEspacio - departamento del espacio (null si es común)
   * @returns {boolean} true si puede reservar, false si no
   */
  static puedeReservar(rolUsuario, categoriaEspacio, deptUsuario = null, deptEspacio = null) {
    if (!rolUsuario || !categoriaEspacio) {
      return false;
    }

    const rol = rolUsuario.toLowerCase();
    const categoria = categoriaEspacio.toLowerCase();

    // Según la tabla de requisitos:
    // Estudiante: Solo Sala común
    if (rol === "estudiante") {
      return categoria.includes("sala común");
    }

    // Investigador contratado: Aula, Seminario, Sala común, Laboratorio (solo su dpto)
    if (rol === "investigador_contratado") {
      if (categoria.includes("laboratorio")) {
        // Solo puede si es de su mismo dpto
        return deptUsuario && deptEspacio && deptUsuario === deptEspacio;
      }
      return categoria.includes("aula") || categoria.includes("seminario") || categoria.includes("sala común");
    }

    // Docente-Investigador: Aula, Seminario, Sala común, Laboratorio (solo su dpto)
    if (rol === "docente_investigador") {
      if (categoria.includes("laboratorio")) {
        return deptUsuario && deptEspacio && deptUsuario === deptEspacio;
      }
      return categoria.includes("aula") || categoria.includes("seminario") || categoria.includes("sala común");
    }

    // Técnico de Lab: Solo Laboratorio de su dpto
    if (rol === "tecnico_laboratorio") {
      if (categoria.includes("laboratorio")) {
        return deptUsuario && deptEspacio && deptUsuario === deptEspacio;
      }
      return false;
    }

    // Conserje: Aula, Seminario, Sala común
    if (rol === "conserje") {
      return categoria.includes("aula") || categoria.includes("seminario") || categoria.includes("sala común");
    }

    // Investigador Visitante: Aula, Seminario, Sala común, Laboratorio (solo su dpto)
    if (rol === "investigador_visitante") {
      if (categoria.includes("laboratorio")) {
        return deptUsuario && deptEspacio && deptUsuario === deptEspacio;
      }
      return categoria.includes("aula") || categoria.includes("seminario") || categoria.includes("sala común");
    }

    // Gerente: Todo
    if (rol === "gerente") {
      return true;
    }

    return false;
  }

  /**
   * Obtiene el mensaje de restricción para un rol
   */
  static obtenerRestriccionesTexto(rolUsuario) {
    const restricciones = {
      estudiante: "Puedes reservar: Solo Salas comunes",
      investigador_contratado: "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto)",
      docente_investigador: "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto)",
      conserje: "Puedes reservar: Aulas, Seminarios, Salas comunes",
      tecnico_laboratorio: "Puedes reservar: Laboratorios (solo de tu dpto)",
      investigador_visitante: "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto)",
      gerente: "Puedes reservar cualquier espacio",
    };

    return restricciones[rolUsuario] || "Sin permisos definidos";
  }
}

module.exports = ReservaPolicy;
