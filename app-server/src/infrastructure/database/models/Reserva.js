const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Reserva = sequelize.define(
    "Reserva",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      espacioId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "espacio_id",
        references: {
          model: "espacios",
          key: "gid",
        },
      },
      usuarioId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "usuario_id",
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: "hora_inicio",
      },
      duracion: {
        type: DataTypes.INTEGER,    
        allowNull: true,
      },
      numPersonas: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "num_personas",
      },
      tipoUso: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "tipo_uso",
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "aceptada",
      },
    },
    {
      tableName: "reservas",
      timestamps: false,
    }
  );

  return Reserva;
};