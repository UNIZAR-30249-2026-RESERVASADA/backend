/**
 * @aggregate Notificacion
 * Raíz del agregado Notificacion.
 *
 * Frontera del agregado:
 * - Notificacion no contiene otros value objects ni entidades hijas.
 * - Referencias indirectas a raíces de otros agregados:
 *   usuarioId → agregado Usuario
 *   reservaId → agregado Reserva
 *
 * Invariante de clase:
 * - usuarioId nunca es null
 * - reservaId nunca es null
 * - motivo es siempre uno de los valores definidos en MOTIVOS
 * - leida es siempre un booleano
 * - fechaCreacion es siempre una fecha válida en formato ISO
 */
class Notificacion {
  /**
   * Motivos válidos de notificación.
   * Son constantes de dominio — no deben modificarse desde fuera.
   */
  static MOTIVOS = {
    ELIMINADA_POR_GERENTE: "eliminada_por_gerente",
    ESPACIO_NO_RESERVABLE: "espacio_no_reservable",
    PORCENTAJE_OCUPACION:  "porcentaje_ocupacion",
    HORARIO:               "horario",
    POLITICA:              "politica",
  };

  /**
   * Precondición: usuarioId es un identificador válido no nulo
   * Precondición: reservaId es un identificador válido no nulo
   * Precondición: motivo pertenece a Notificacion.MOTIVOS
   * Postcondición: objeto Notificacion válido con leida=false por defecto
   * Aserción de resultado: this.leida === false si no se indica lo contrario
   * Aserción de resultado: this.motivo pertenece a los motivos válidos
   */
  constructor({
    id            = null,
    usuarioId,
    reservaId,
    motivo,
    descripcion   = null,
    leida         = false,
    fechaCreacion = new Date().toISOString(),
  }) {
    if (!usuarioId) throw new Error("usuarioId es obligatorio");
    if (!reservaId) throw new Error("reservaId es obligatorio");
    if (!motivo)    throw new Error("motivo es obligatorio");

    const motivosValidos = Object.values(Notificacion.MOTIVOS);
    if (!motivosValidos.includes(motivo)) {
      throw new Error(`Motivo no válido: '${motivo}'. Válidos: ${motivosValidos.join(", ")}`);
    }

    this.id            = id;
    this.usuarioId     = usuarioId;
    this.reservaId     = reservaId;
    this.motivo        = motivo;
    this.descripcion   = descripcion || null;
    this.leida         = !!leida;
    this.fechaCreacion = fechaCreacion;

    // Aserciones de clase
    console.assert(typeof this.leida === "boolean",       "Aserción fallida: leida debe ser boolean");
    console.assert(motivosValidos.includes(this.motivo),  "Aserción fallida: motivo inválido tras constructor");
    console.assert(this.usuarioId != null,                "Aserción fallida: usuarioId es null");
    console.assert(this.reservaId != null,                "Aserción fallida: reservaId es null");
  }

  /**
   * Marca la notificación como leída.
   * Precondición: la notificación existe
   * Postcondición: leida === true
   * Aserción de resultado: this.leida === true
   */
  marcarLeida() {
    this.leida = true;
    console.assert(this.leida === true, "Aserción fallida: leida debe ser true tras marcarLeida()");
  }

  /**
   * Devuelve el texto legible del motivo para mostrar al usuario.
   * Función sin efectos secundarios — no modifica el estado del objeto.
   * Precondición: this.motivo es un valor válido de MOTIVOS
   * Postcondición: devuelve siempre un string no vacío
   * @returns {string}
   */
  textoMotivo() {
    const textos = {
      [Notificacion.MOTIVOS.ELIMINADA_POR_GERENTE]: "Tu reserva ha sido eliminada por el gerente",
      [Notificacion.MOTIVOS.ESPACIO_NO_RESERVABLE]: "El espacio ya no es reservable",
      [Notificacion.MOTIVOS.PORCENTAJE_OCUPACION]:  "El número de asistentes supera el nuevo límite de ocupación",
      [Notificacion.MOTIVOS.HORARIO]:               "La reserva queda fuera del nuevo horario del espacio",
      [Notificacion.MOTIVOS.POLITICA]:              "Tu rol ya no permite reservar este tipo de espacio",
    };
    const resultado = textos[this.motivo] || this.motivo;
    console.assert(resultado && resultado.length > 0, "Aserción fallida: textoMotivo debe devolver string no vacío");
    return resultado;
  }
}

module.exports = Notificacion;