const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      contrasenia: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM(
          "estudiante",
          "investigador_contratado",
          "docente_investigador",
          "conserje",
          "tecnico_laboratorio",
          "investigador_visitante"
        ),
        allowNull: true,
      },
      esGerente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      departamentoId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "departamentos",
          key: "id",
        },
      },
    },
    {
      tableName: "usuarios",
      timestamps: false,
    }
  );

  return Usuario;
};
