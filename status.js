export default async function handler(req, res) {
  const n = req.query.n || 120;

  const response = await fetch(`http://104.198.225.12/status?n=${n}`);
  const data = await response.json();

  res.status(200).json(data);
}
