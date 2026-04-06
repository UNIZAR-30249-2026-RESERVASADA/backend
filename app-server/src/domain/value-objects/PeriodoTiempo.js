class PeriodoTiempo {
  /**
   * @param {string} fecha      - "YYYY-MM-DD"
   * @param {string} horaInicio - "HH:MM"
   * @param {number} duracion   - minutos
   */
  constructor(fecha, horaInicio, duracion) {
    if (!fecha)      throw new Error("fecha es obligatoria");
    if (!horaInicio) throw new Error("horaInicio es obligatoria");

    const duracionNum = Number(duracion);
    if (Number.isNaN(duracionNum) || duracionNum <= 0) {
      throw new Error("duracion debe ser un número positivo de minutos");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error("fecha debe tener formato YYYY-MM-DD");
    }

    if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
      throw new Error("horaInicio debe tener formato HH:MM");
    }

    this._fecha      = fecha;
    this._horaInicio = horaInicio;
    this._duracion   = duracionNum;
  }

  get fecha()      { return this._fecha; }
  get horaInicio() { return this._horaInicio; }
  get duracion()   { return this._duracion; }

  get horaFin() {
    const [h, m] = this._horaInicio.split(":").map(Number);
    const totalMinutos = h * 60 + m + this._duracion;
    const hFin = Math.floor(totalMinutos / 60) % 24;
    const mFin = totalMinutos % 60;
    return `${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`;
  }

  /**
   * Comprueba si este periodo se solapa con otro.
   * Función sin efectos secundarios — solo evalúa condiciones.
   * @param {PeriodoTiempo} otro
   * @returns {boolean}
   */
  seSOlapaConOtro(otro) {
    if (!(otro instanceof PeriodoTiempo)) return false;
    if (this._fecha !== otro._fecha) return false;

    const [h1, m1] = this._horaInicio.split(":").map(Number);
    const inicio1  = h1 * 60 + m1;
    const fin1     = inicio1 + this._duracion;

    const [h2, m2] = otro._horaInicio.split(":").map(Number);
    const inicio2  = h2 * 60 + m2;
    const fin2     = inicio2 + otro._duracion;

    return inicio1 < fin2 && inicio2 < fin1;
  }

  equals(otroPeriodo) {
    if (!(otroPeriodo instanceof PeriodoTiempo)) return false;
    return (
      this._fecha      === otroPeriodo._fecha &&
      this._horaInicio === otroPeriodo._horaInicio &&
      this._duracion   === otroPeriodo._duracion
    );
  }

  toString() {
    return `${this._fecha} ${this._horaInicio} (${this._duracion} min)`;
  }
}

module.exports = PeriodoTiempo;