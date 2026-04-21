const CategoriaReserva           = require("../../domain/value-objects/CategoriaReserva");
const InvalidacionReservasService = require("../../domain/services/InvalidacionReservasService");

function domainError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizarUsoFisico(uso) {
  const u = (uso || "").toLowerCase().trim();
  if (u.includes("laboratorio") || u.includes("lab") || u.includes("sala inform") || u.includes("informatica") || u.includes("informática")) return "laboratorio";
  if (u.includes("aula"))      return "aula";
  if (u.includes("seminario")) return "seminario";
  if (u.includes("despacho"))  return "despacho";
  if (u.includes("comun") || u.includes("común")) return "sala comun";
  return null;
}

class ModificarEspacio {
  constructor({ espacioRepository, usuarioRepository, reservaRepository }) {
    this.espacioRepository    = espacioRepository;
    this.usuarioRepository    = usuarioRepository;
    this.reservaRepository    = reservaRepository;
    this.invalidacionService  = new InvalidacionReservasService();
  }

  async execute({ espacioId, cambios, esGerente }) {
    console.log("reservaRepository:", this.reservaRepository);
    console.log("invalidacionService:", this.invalidacionService);
    if (!esGerente) throw domainError("Solo los gerentes pueden modificar espacios", 403);
    if (!espacioId) throw domainError("espacioId es obligatorio", 400);
    if (!cambios || Object.keys(cambios).length === 0) {
      throw domainError("No se han proporcionado cambios", 400);
    }

    const espacio = await this.espacioRepository.findById(espacioId);
    if (!espacio) throw domainError(`Espacio ${espacioId} no encontrado`, 404);

    const { reservable, categoria, aforo, departamentoId, asignadoAEina, usuariosAsignados } = cambios;

    // --- VALIDACIONES DE DOMINIO ---

    // Categoría efectiva tras el cambio
    const categoriaEfectiva = categoria !== undefined ? categoria : espacio.categoria;
    let catVO;
    try {
      catVO = new CategoriaReserva(categoriaEfectiva);
    } catch {
      throw domainError(`Categoría no válida: ${categoriaEfectiva}`, 400);
    }

    // Validar transición de categoría usando el tipo físico como base
    if (categoria !== undefined && categoria !== espacio.categoria) {
      const usoNorm = normalizarUsoFisico(espacio.uso);
      if (!CategoriaReserva.esTransicionValida(espacio.categoria, categoria, usoNorm)) {
        throw domainError(
          `No se puede cambiar la categoría de "${espacio.categoria}" a "${categoria}" ` +
          `para un espacio de tipo físico "${espacio.uso}".`,
          400
        );
      }
    }

    // Validar aforo
    if (aforo !== undefined && (isNaN(Number(aforo)) || Number(aforo) < 0)) {
      throw domainError("El aforo debe ser un número positivo", 400);
    }

    // Validar asignación
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      let tipoAsignacion;
      if (asignadoAEina)                                         tipoAsignacion = "eina";
      else if (departamentoId)                                   tipoAsignacion = "departamento";
      else if (usuariosAsignados && usuariosAsignados.length > 0) tipoAsignacion = "persona";
      else                                                        tipoAsignacion = "eina";

      if (!catVO.admiteAsignacion(tipoAsignacion)) {
        throw domainError(
          `La categoría "${catVO.valor}" no admite asignación de tipo "${tipoAsignacion}". ` +
          `Asignaciones permitidas: ${catVO.asignacionesPermitidas().join(", ")}`,
          400
        );
      }

      if (usuariosAsignados && usuariosAsignados.length > 0) {
        const ROLES_VALIDOS = ["investigador_contratado", "docente_investigador", "investigador_visitante"];
        let hayNoVisitante = false;

        for (const uid of usuariosAsignados) {
          const usuario = await this.usuarioRepository.findById(uid);
          if (!usuario) throw domainError(`Usuario ${uid} no encontrado`, 404);
          if (!ROLES_VALIDOS.includes(usuario.rol)) {
            throw domainError(
              `El usuario ${usuario.nombre} no puede asignarse (rol: ${usuario.rol}). ` +
              `Roles permitidos: ${ROLES_VALIDOS.join(", ")}`,
              400
            );
          }
          if (usuario.rol !== "investigador_visitante") hayNoVisitante = true;
        }

        const reservableEfectivo = reservable !== undefined ? reservable : espacio.reservable;
        if (catVO.esDespacho() && hayNoVisitante && reservableEfectivo) {
          throw domainError(
            "Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable.",
            400
          );
        }
      }
    }

    // --- APLICAR CAMBIOS ---

    if (reservable  !== undefined) await this.espacioRepository.updateReservable(espacioId, reservable);
    if (categoria   !== undefined) await this.espacioRepository.updateCategoria(espacioId, categoria);
    if (aforo       !== undefined) await this.espacioRepository.updateAforo(espacioId, Number(aforo));
    if (departamentoId !== undefined || asignadoAEina !== undefined || usuariosAsignados !== undefined) {
      await this.espacioRepository.updateAsignacion(espacioId, {
        departamentoId:    departamentoId    ?? null,
        asignadoAEina:     asignadoAEina     ?? false,
        usuariosAsignados: usuariosAsignados ?? [],
      });
    }

    // --- INVALIDAR RESERVAS AFECTADAS (requisito I) ---
    // Solo si cambia reservable o categoría hay que revisar las reservas existentes
    const nuevaReservable = reservable !== undefined ? reservable : espacio.reservable;
    const nuevaCategoria  = categoria  !== undefined ? categoria  : espacio.categoria;

    // Calcular si el espacio actualizado está asignado a investigador visitante
    // (necesario para ReservaPolicy en despachos O7)
    const espacioActualizado = await this.espacioRepository.findById(espacioId);
    const asignadoAInvVisitante = (espacioActualizado.usuariosAsignados || [])
      .some(u => u.rol === "investigador_visitante");

    const reservasCanceladas = await this.invalidacionService.invalidarSiProcede({
      espacioId,
      nuevaReservable,
      nuevaCategoria,
      deptEspacioId:        espacioActualizado.departamentoId ?? null,
      asignadoAInvVisitante,
      reservaRepository:    this.reservaRepository,
      usuarioRepository:    this.usuarioRepository,
    });

    // --- DEVOLVER ESPACIO ACTUALIZADO ---

    const actualizado = espacioActualizado;
    return {
      gid:               actualizado.gid,
      nombre:            actualizado.nombre,
      categoria:         actualizado.categoria,
      reservable:        actualizado.reservable,
      aforo:             actualizado.aforo,
      departamentoId:    actualizado.departamentoId,
      asignadoAEina:     actualizado.asignadoAEina,
      usuariosAsignados: actualizado.usuariosAsignados,
      reservasCanceladas,
    };
  }
}

module.exports = ModificarEspacio;