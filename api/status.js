export default async function handler(req, res) {
  try {
    const { path } = req.query;

    const backendUrl = `http://136.114.173.194:5000/${path}`;

    const response = await fetch(backendUrl);

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      res.status(200).send(text);
    }

  } catch (error) {
    res.status(500).json({
      error: "Proxy error",
      message: error.message
    });
  }
}
