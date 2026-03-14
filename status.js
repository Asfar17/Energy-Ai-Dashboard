export default async function handler(req, res) {
  const n = req.query.n || 120;

  const response = await fetch(`http://136.114.173.194:5000/status?n=${n}`);
  const data = await response.json();

  res.status(200).json(data);
}