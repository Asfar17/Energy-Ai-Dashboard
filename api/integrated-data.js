export default async function handler(req, res) {

  const { lat, lon } = req.query;

  try {aexport default async function handler(req, res) {

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      error: "Missing lat or lon"
    });
  }

  try {

    const backendURL =
      `http://136.114.173.194:5000/api/integrated-data/${lat}/${lon}`;

    const response = await fetch(backendURL);

    const text = await response.text();

    try {

      const json = JSON.parse(text);
      res.status(200).json(json);

    } catch {

      res.status(500).json({
        error: "Backend did not return JSON",
        backend_response: text
      });

    }

  } catch (error) {

    res.status(500).json({
      error: "Backend connection failed",
      message: error.message
    });

  }

}


    const backend = await fetch(
      `http://136.114.173.194:5000/integrated-data/${lat}/${lon}`
    );

    const data = await backend.json();

    res.status(200).json(data);

  } catch (err) {

    res.status(500).json({
      error: "Backend request failed",
      message: err.message
    });

  }

}
