const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Espacio = sequelize.define('Espacio', {
    gid: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: false
    },
    id_espacio: {
      type: DataTypes.STRING,
    },
    nombre: {
      type: DataTypes.STRING,
    },
    uso: {
      type: DataTypes.STRING,
    },
    edificio: {
      type: DataTypes.STRING,
    },
    planta: {
      type: DataTypes.STRING,
    },
    superficie: {
      type: DataTypes.FLOAT,
    },
    reservable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    aforo: {
      type: DataTypes.INTEGER,
    },
    geom: {
      type: DataTypes.GEOMETRY('MULTIPOLYGON', 4326),
    }
  }, {
    tableName: 'espacios',
    timestamps: false
  });

  return Espacio;
};