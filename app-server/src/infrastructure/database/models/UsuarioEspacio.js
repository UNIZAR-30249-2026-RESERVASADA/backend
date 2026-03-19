const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UsuarioEspacio = sequelize.define(
    "UsuarioEspacio",
    {
      usuarioId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },
      espacioId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },
      // aquí podrías añadir atributos de la relación (p.ej. tipo de asignación)
    },
    {
      tableName: "usuarios_espacios",
      timestamps: false,
    }
  );

  return UsuarioEspacio;
};