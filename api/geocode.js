export default async function handler(req, res) {

  try {

    const backend = await fetch(
      "http://35.225.191.36:5000/api/geocode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      }
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
