export default async function handler(req, res) {

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      error: "Missing lat or lon"
    });
  }

  try {

    const backendURL =
      `http://136.115.91.50:5000/api/integrated-data/${lat}/${lon}`;

    const response = await fetch(backendURL);

    const text = await response.text();

    try {

      const json = JSON.parse(text);

      return res.status(200).json(json);

    } catch {

      return res.status(500).json({
        error: "Backend returned non JSON",
        backend_response: text
      });

    }

  } catch (error) {

    return res.status(500).json({
      error: "Backend connection failed",
      message: error.message
    });

  }

}
