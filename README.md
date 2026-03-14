# Energy AI — Dashboard (Vercel)

Pure static frontend. All data comes from the GCE backend via API calls.

## Setup

1. Open `dashboard.js` and set your GCE backend URL:
   ```js
   const API_BASE = "https://YOUR-GCE-IP-OR-DOMAIN";
   ```

2. Push this folder to a GitHub repo, then import it on Vercel.
   Vercel will auto-detect it as a static site — no build step needed.

## What it calls on the GCE backend

| Endpoint | Purpose |
|---|---|
| `GET /status?n=120` | Latest predictions from the ML model |
| `GET /api/integrated-data/<lat>/<lon>` | Weather + Solar + AI insights |
| `POST /api/geocode` | Address → coordinates |

## GCE backend must have CORS enabled

Add this to your Flask app on GCE:
```python
from flask_cors import CORS
CORS(app)
```
And install: `pip install flask-cors`
