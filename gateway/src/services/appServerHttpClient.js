const { appServerUrl } = require("../config/appServer");

async function crearReserva(reservaData) {
  const response = await fetch(`${appServerUrl}/reservas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reservaData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al crear la reserva en el app-server");
  }

  return data;
}

async function obtenerMetadatosEspacios() {
  const response = await fetch(`${appServerUrl}/espacios/metadatos`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error obteniendo metadatos de espacios");
  }

  return data;
}

async function login(email, password) {
  try {
    console.log("appServerHttpClient.login: enviando a", `${appServerUrl}/auth/login`);
    const resp = await fetch(`${appServerUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("appServerHttpClient.login: response status", resp.status);

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      console.error("appServerHttpClient.login: error body", errBody);
      throw new Error(errBody.message || `Error ${resp.status}`);
    }

    return await resp.json();
  } catch (err) {
    console.error("appServerHttpClient.login: error", err);
    throw err;
  }
}

async function obtenerRestricciones(rol) {
  try {
    console.log("appServerHttpClient.obtenerRestricciones: enviando a", `${appServerUrl}/auth/restricciones/${rol}`);
    const resp = await fetch(`${appServerUrl}/auth/restricciones/${rol}`);

    console.log("appServerHttpClient.obtenerRestricciones: response status", resp.status);

    if (!resp.ok) {
      throw new Error(`Error ${resp.status}`);
    }

    return await resp.json();
  } catch (err) {
    console.error("appServerHttpClient.obtenerRestricciones: error", err);
    throw err;
  }
}

module.exports = {
  crearReserva,
  obtenerMetadatosEspacios,
  login,
  obtenerRestricciones,
};