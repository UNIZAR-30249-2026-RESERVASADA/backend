const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Departamento = sequelize.define(
    "Departamento",
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
    },
    {
      tableName: "departamentos",
      timestamps: false,
    }
  );

  return Departamento;
};