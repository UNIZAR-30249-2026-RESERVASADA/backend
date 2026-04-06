const ROLES_VALIDOS = [
  "estudiante",
  "investigador_contratado",
  "docente_investigador",
  "tecnico_laboratorio",
  "conserje",
  "gerente",
  "investigador_visitante",
];

class Rol {
  constructor(valor) {
    const normalizado = (valor || "").toString().trim().toLowerCase();
    if (!ROLES_VALIDOS.includes(normalizado)) {
      throw new Error(`Rol no válido: '${valor}'. Valores permitidos: ${ROLES_VALIDOS.join(", ")}`);
    }
    this._valor = normalizado;
  }

  get valor() {
    return this._valor;
  }

  equals(otroRol) {
    if (!(otroRol instanceof Rol)) return false;
    return this._valor === otroRol._valor;
  }

  esEstudiante()            { return this._valor === "estudiante"; }
  esInvestigadorContratado(){ return this._valor === "investigador_contratado"; }
  esDocenteInvestigador()   { return this._valor === "docente_investigador"; }
  esTecnicoLaboratorio()    { return this._valor === "tecnico_laboratorio"; }
  esConserje()              { return this._valor === "conserje"; }
  esGerente()               { return this._valor === "gerente"; }
  esInvestigadorVisitante() { return this._valor === "investigador_visitante"; }

  toString() {
    return this._valor;
  }

  static get VALORES() {
    return [...ROLES_VALIDOS];
  }

  static esTransicionValida(rolOrigen, rolDestino) {
    const transiciones = {
      estudiante:              ["investigador_contratado"],
      investigador_contratado: ["docente_investigador"],
      docente_investigador:    [],
      tecnico_laboratorio:     ["conserje"],
      conserje:                ["tecnico_laboratorio"],
      gerente:                 [],
      investigador_visitante:  [],
    };
    const origen = (rolOrigen instanceof Rol) ? rolOrigen.valor : rolOrigen;
    const destino = (rolDestino instanceof Rol) ? rolDestino.valor : rolDestino;
    return (transiciones[origen] || []).includes(destino);
  }
}

module.exports = Rol;