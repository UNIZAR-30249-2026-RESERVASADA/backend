const GEO_SERVER_URL = process.env.GEO_SERVER_URL || "http://geo-server:5000";

/**
 * Proxy hacia PyGeoAPI.
 * El gateway reenvía la petición al servidor geográfico (N3)
 * y devuelve la respuesta al frontend (N1).
 * El frontend nunca accede directamente a PyGeoAPI.
 */
async function getEspacios(req, res, next) {
  try {
    const params = new URLSearchParams({
      f:     "json",
      limit: req.query.limit  || "1000",
      ...(req.query.offset && { offset: req.query.offset }),
    });

    const url = `${GEO_SERVER_URL}/collections/espacios/items?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Error obteniendo datos geográficos",
      });
    }

    const data = await response.json();

    // Reescribimos los enlaces "next" para que apunten al gateway
    // en lugar de directamente a PyGeoAPI
    if (data.links) {
      data.links = data.links.map((link) => {
        if (link.rel === "next" && link.href.includes(GEO_SERVER_URL)) {
          link.href = link.href.replace(
            `${GEO_SERVER_URL}/collections/espacios/items`,
            `${req.protocol}://${req.get("host")}/api/geo/espacios`
          );
        }
        return link;
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getEspacios };