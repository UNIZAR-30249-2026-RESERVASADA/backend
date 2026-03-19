const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ByronSpace API - Gateway",
      version: "1.0.0",
      description: "API REST pública para la gestión de reservas de espacios en el edificio Ada Byron",
      contact: {
        name: "LabIS - UNIZAR",
        url: "https://unizar.es",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local (desarrollo)",
      },
    ],
    components: {
      schemas: {
        Reserva: {
          type: "object",
          required: ["espacioId", "usuarioId", "fecha", "horaInicio", "duracion"],
          properties: {
            id: { type: "integer", example: 1 },
            espacioId: { type: "integer", example: 5308, description: "ID del espacio (gid)" },
            usuarioId: { type: "integer", example: 1 },
            fecha: { type: "string", format: "date", example: "2026-03-19" },
            horaInicio: { type: "string", format: "time", example: "12:20" },
            duracion: { type: "integer", example: 1, description: "Duración en horas" },
            numPersonas: { type: "integer", nullable: true, example: 14 },
            tipoUso: { type: "string", nullable: true, example: "docencia", enum: ["docencia", "reunion", "examen", "otros"] },
            descripcion: { type: "string", nullable: true, example: "Clase de algoritmia" },
            estado: { type: "string", example: "aceptada", enum: ["aceptada", "pendiente", "cancelada"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        EspacioMetadatos: {
          type: "object",
          properties: {
            id_espacio: { type: "string", example: "CRE.1065.00.130" },
            categoria: { type: "string", example: "laboratorio" },
            reservable: { type: "boolean", example: true },
            aforo: { type: "integer", example: 21 },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "El espacio no existe" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
