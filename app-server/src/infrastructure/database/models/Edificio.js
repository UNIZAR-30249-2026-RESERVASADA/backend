const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Edificio = sequelize.define(
    "Edificio",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      id_edificio: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      campus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      horarioApertura: {
        type: DataTypes.STRING, // o TIME si quieres
        allowNull: true,
      },
      horarioCierre: {
        type: DataTypes.STRING, // o TIME si quieres
        allowNull: false,
      },
      porcentajeOcupacion: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      tableName: "edificios",
      timestamps: false,
    }
  );

  return Edificio;
};
// ...existing code...