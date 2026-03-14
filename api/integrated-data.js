export default async function handler(req, res) {

  const { lat, lon } = req.query;

  try {

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
