const CategoriaReserva = require("../../domain/value-objects/CategoriaReserva");

function normalizarUsoFisico(uso) {
  const u = (uso || "").toLowerCase().trim();
  if (u.includes("laboratorio") || u.includes("lab") || u.includes("sala inform") || u.includes("informatica") || u.includes("informática")) return "laboratorio";
  if (u.includes("aula")) return "aula";
  if (u.includes("seminario")) return "seminario";
  if (u.includes("despacho")) return "despacho";
  if (u.includes("comun") || u.includes("común")) return "sala comun";
  return null;
}

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class ModificarEspacio {
  constructor({ espacioRepository, usuarioRepository }) {
    this.espacioRepository = espacioRepository;
    this.usuarioRepository = usuarioRepository;
  }

  async execute({ espacioId, cambios, esGerente }) {
    if (!esGerente) throw domainError("Solo los gerentes pueden modificar espacios", 403);
    if (!espacioId) throw domainError("espacioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const espacio = await this.espacioRepository.findById(espacioId);
    if (!espacio) throw domainError(`Espacio ${espacioId} no encontrado`, 404);

    const { reservable, categoria, aforo, departamentoId, asignadoAEina, usuariosAsignados } = cambios;

    // Determinar la categoría efectiva — la nueva si se cambia, la actual si no
    const categoriaEfectiva = categoria !== undefined ? categoria : espacio.categoria;

    // Validar que la categoría es válida
    let catVO;
    try {
      catVO = new CategoriaReserva(categoriaEfectiva);
    } catch {
      throw domainError(`Categoría no válida: ${categoriaEfectiva}`, 400);
    }

    // Validar transición de categoría si se cambia.
    // Se usa el tipo físico del espacio (uso) como base para las transiciones.
    // El uso físico viene del GeoJSON y puede tener valores como "SALA INFORMÁTICA"
    // que hay que normalizar al mismo formato que las categorías.
    if (categoria !== undefined && categoria !== espacio.categoria) {
      const usoNormalizado = normalizarUsoFisico(espacio.uso);
      if (!CategoriaReserva.esTransicionValida(espacio.categoria, categoria, usoNormalizado)) {
        throw domainError(
          `No se puede cambiar la categoría de "${espacio.categoria}" a "${categoria}" ` +
          `para un espacio de tipo físico "${espacio.uso}".`,
          400
        );
      }
    }

    // Validar aforo si se cambia
    if (aforo !== undefined && (isNaN(Number(aforo)) || Number(aforo) < 0)) {
      throw domainError("El aforo debe ser un número positivo", 400);
    }

    // Validar asignación si se cambia
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      // Determinar tipo de asignación que se está solicitando
      let tipoAsignacion;
      if (asignadoAEina) {
        tipoAsignacion = "eina";
      } else if (departamentoId) {
        tipoAsignacion = "departamento";
      } else if (usuariosAsignados && usuariosAsignados.length > 0) {
        tipoAsignacion = "persona";
      } else {
        tipoAsignacion = "eina"; // si todo es null/vacío, se asume EINA por defecto
      }

      // Comprobar que la asignación es válida para la categoría
      if (!catVO.admiteAsignacion(tipoAsignacion)) {
        throw domainError(
          `La categoría "${catVO.valor}" no admite asignación de tipo "${tipoAsignacion}". ` +
          `Asignaciones permitidas: ${catVO.asignacionesPermitidas().join(", ")}`,
          400
        );
      }

      // Validar usuarios asignados si los hay
      if (usuariosAsignados && usuariosAsignados.length > 0) {
        const ROLES_VALIDOS_ASIGNACION = ["investigador_contratado", "docente_investigador", "investigador_visitante"];
        let hayNoVisitante = false;

        for (const uid of usuariosAsignados) {
          const usuario = await this.usuarioRepository.findById(uid);
          if (!usuario) throw domainError(`Usuario ${uid} no encontrado`, 404);
          if (!ROLES_VALIDOS_ASIGNACION.includes(usuario.rol)) {
            throw domainError(
              `El usuario ${usuario.nombre} no puede asignarse a un espacio (rol: ${usuario.rol}). ` +
              `Roles permitidos: ${ROLES_VALIDOS_ASIGNACION.join(", ")}`,
              400
            );
          }
          if (usuario.rol !== "investigador_visitante") {
            hayNoVisitante = true;
          }
        }

        // Si el despacho está asignado a personas que no son investigador visitante
        // no puede ser reservable — nadie más tiene permiso para reservarlo
        const reservableEfectivo = reservable !== undefined ? reservable : espacio.reservable;
        if (catVO.esDespacho() && hayNoVisitante && reservableEfectivo) {
          throw domainError(
            "Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable. " +
            "Solo los despachos asignados a investigador visitante o a un departamento pueden ser reservables.",
            400
          );
        }
      }
    }

    // Aplicar cambios
    if (reservable !== undefined) {
      await this.espacioRepository.updateReservable(espacioId, reservable);
    }
    if (categoria !== undefined) {
      await this.espacioRepository.updateCategoria(espacioId, categoria);
    }
    if (aforo !== undefined) {
      await this.espacioRepository.updateAforo(espacioId, Number(aforo));
    }
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      await this.espacioRepository.updateAsignacion(espacioId, {
        departamentoId:    departamentoId    ?? null,
        asignadoAEina:     asignadoAEina     ?? false,
        usuariosAsignados: usuariosAsignados ?? [],
      });
    }

    const actualizado = await this.espacioRepository.findById(espacioId);
    return {
      gid:               actualizado.gid,
      nombre:            actualizado.nombre,
      categoria:         actualizado.categoria,
      reservable:        actualizado.reservable,
      aforo:             actualizado.aforo,
      departamentoId:    actualizado.departamentoId,
      asignadoAEina:     actualizado.asignadoAEina,
      usuariosAsignados: actualizado.usuariosAsignados,
    };
  }
}

module.exports = ModificarEspacio;