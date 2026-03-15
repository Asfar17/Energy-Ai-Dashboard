export default async function handler(req, res) {

  const n = req.query.n || 120;

  try {

    const backend = await fetch(
      `http://104.198.225.12:5000/status?n=${n}`
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
