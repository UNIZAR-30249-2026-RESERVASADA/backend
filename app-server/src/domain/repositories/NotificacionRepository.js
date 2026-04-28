/**
 * @repository NotificacionRepository
 * Interfaz abstracta del repositorio de Notificacion.
 * Define el contrato que debe cumplir cualquier implementación de infraestructura.
 * Sigue el patrón de interfaz reveladora — los nombres de métodos expresan
 * la intención de negocio, no detalles de implementación.
 */
class NotificacionRepository {
  /**
   * Persiste una notificación nueva o actualiza una existente.
   * Precondición: notificacion es una instancia válida de Notificacion
   * Postcondición: la notificación queda persistida y se devuelve con id asignado
   * @param {Notificacion} _notificacion
   * @returns {Promise<Notificacion>}
   */
  async save(_notificacion) {
    throw new Error("save() no implementado");
  }

  /**
   * Devuelve todas las notificaciones de un usuario ordenadas por fecha descendente.
   * Función sin efectos secundarios.
   * Precondición: usuarioId es un identificador válido
   * Postcondición: devuelve array (vacío si no hay notificaciones)
   * @param {number} _usuarioId
   * @returns {Promise<Notificacion[]>}
   */
  async findByUsuario(_usuarioId) {
    throw new Error("findByUsuario() no implementado");
  }

  /**
   * Devuelve una notificación por su id.
   * Función sin efectos secundarios.
   * Precondición: id es un identificador válido
   * Postcondición: devuelve la notificación o null si no existe
   * @param {number} _id
   * @returns {Promise<Notificacion|null>}
   */
  async findById(_id) {
    throw new Error("findById() no implementado");
  }

  /**
   * Marca todas las notificaciones no leídas de un usuario como leídas.
   * Precondición: usuarioId es un identificador válido
   * Postcondición: todas las notificaciones del usuario tienen leida=true
   * @param {number} _usuarioId
   * @returns {Promise<void>}
   */
  async marcarLeidaPorUsuario(_usuarioId) {
    throw new Error("marcarLeidaPorUsuario() no implementado");
  }
}

module.exports = NotificacionRepository;