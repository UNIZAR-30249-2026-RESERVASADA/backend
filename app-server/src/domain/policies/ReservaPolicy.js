class ReservaPolicy {
  static puedeReservar(rolUsuario, categoriaEspacio, deptUsuario = null, deptEspacio = null) {
    if (!rolUsuario || !categoriaEspacio) {
      return false;
    }

    const rol = rolUsuario.toLowerCase();
    const categoria = categoriaEspacio.toLowerCase();

    if (rol === "estudiante") {
      return categoria.includes("sala común");
    }

    if (rol === "investigador_contratado") {
      if (categoria.includes("laboratorio") || categoria.includes("despacho")) {
        if (!deptEspacio) return false;
        return deptUsuario && String(deptUsuario) === String(deptEspacio);
      }
      return (
        categoria.includes("aula") ||
        categoria.includes("seminario") ||
        categoria.includes("sala común")
      );
    }

    if (rol === "docente_investigador") {
      if (categoria.includes("laboratorio") || categoria.includes("despacho")) {
        if (!deptEspacio) return false;
        return deptUsuario && String(deptUsuario) === String(deptEspacio);
      }
      return (
        categoria.includes("aula") ||
        categoria.includes("seminario") ||
        categoria.includes("sala común")
      );
    }

    if (rol === "tecnico_laboratorio") {
      if (categoria.includes("laboratorio")) {
        if (!deptEspacio) return false;
        return deptUsuario && String(deptUsuario) === String(deptEspacio);
      }
      return false;
    }

    if (rol === "conserje") {
      return (
        categoria.includes("aula") ||
        categoria.includes("seminario") ||
        categoria.includes("sala común")
      );
    }

    if (rol === "investigador_visitante") {
      if (categoria.includes("laboratorio")) {
        if (!deptEspacio) return false;
        return deptUsuario && String(deptUsuario) === String(deptEspacio);
      }
      return (
        categoria.includes("aula") ||
        categoria.includes("seminario") ||
        categoria.includes("sala común")
      );
    }

    if (rol === "gerente") {
      return true;
    }

    return false;
  }

  static obtenerRestriccionesUI(rolUsuario) {
    const rol = (rolUsuario || "").toLowerCase();

    const mapa = {
      estudiante: {
        rol: "estudiante",
        mensaje: "Puedes reservar: Solo Salas comunes",
        categoriasPermitidas: ["sala común"],
        categoriasConRestriccionDepartamento: [],
        puedeReservarTodo: false,
      },
      investigador_contratado: {
        rol: "investigador_contratado",
        mensaje:
          "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto), Despachos (solo de tu dpto)",
        categoriasPermitidas: [
          "aula",
          "seminario",
          "sala común",
          "laboratorio",
          "despacho",
        ],
        categoriasConRestriccionDepartamento: ["laboratorio", "despacho"],
        puedeReservarTodo: false,
      },
      docente_investigador: {
        rol: "docente_investigador",
        mensaje:
          "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto), Despachos (solo de tu dpto)",
        categoriasPermitidas: [
          "aula",
          "seminario",
          "sala común",
          "laboratorio",
          "despacho",
        ],
        categoriasConRestriccionDepartamento: ["laboratorio", "despacho"],
        puedeReservarTodo: false,
      },
      tecnico_laboratorio: {
        rol: "tecnico_laboratorio",
        mensaje: "Puedes reservar: Laboratorios (solo de tu dpto)",
        categoriasPermitidas: ["laboratorio"],
        categoriasConRestriccionDepartamento: ["laboratorio"],
        puedeReservarTodo: false,
      },
      conserje: {
        rol: "conserje",
        mensaje: "Puedes reservar: Aulas, Seminarios, Salas comunes",
        categoriasPermitidas: ["aula", "seminario", "sala común"],
        categoriasConRestriccionDepartamento: [],
        puedeReservarTodo: false,
      },
      investigador_visitante: {
        rol: "investigador_visitante",
        mensaje:
          "Puedes reservar: Aulas, Salas comunes, Seminarios, Laboratorios (solo de tu dpto)",
        categoriasPermitidas: [
          "aula",
          "seminario",
          "sala común",
          "laboratorio",
        ],
        categoriasConRestriccionDepartamento: ["laboratorio"],
        puedeReservarTodo: false,
      },
      gerente: {
        rol: "gerente",
        mensaje: "Puedes reservar cualquier espacio",
        categoriasPermitidas: [],
        categoriasConRestriccionDepartamento: [],
        puedeReservarTodo: true,
      },
    };

    return (
      mapa[rol] || {
        rol,
        mensaje: "Sin permisos definidos",
        categoriasPermitidas: [],
        categoriasConRestriccionDepartamento: [],
        puedeReservarTodo: false,
      }
    );
  }
}

module.exports = ReservaPolicy;