// ─────────────────────────────────────────────────────────────
// CONFIG — set your GCE backend URL here (or via window._env)
// After deploying to GCE, replace the string below with:
//   "http://<YOUR_GCE_EXTERNAL_IP>:5000"
// ─────────────────────────────────────────────────────────────
const API_BASE = (window._env && window._env.API_BASE)
  ? window._env.API_BASE
  : "http://136.114.173.194:5000";   // ← replace YOUR_GCE_IP

// ─────────────────────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────────────────────
const statusText       = document.getElementById("statusText");
const refreshBtn       = document.getElementById("refreshBtn");
const windowN          = document.getElementById("windowN");
const pollMs           = document.getElementById("pollMs");
const kpiDecision      = document.getElementById("kpiDecision");
const kpiProb          = document.getElementById("kpiProb");
const kpiPV            = document.getElementById("kpiPV");
const kpiTime          = document.getElementById("kpiTime");
const kpiLoad          = document.getElementById("kpiLoad");
const kpiGrid          = document.getElementById("kpiGrid");
const kpiTemp          = document.getElementById("kpiTemp");
const kpiCloud         = document.getElementById("kpiCloud");
const kpiSolarHours    = document.getElementById("kpiSolarHours");
const kpiSolarCap      = document.getElementById("kpiSolarCap");
const aiInsightsContent = document.getElementById("aiInsightsContent");
const addressInput     = document.getElementById("addressInput");
const searchBtn        = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const locationStatus   = document.getElementById("locationStatus");
const refreshInsightsBtn = document.getElementById("refreshInsightsBtn");

let currentLat = 12.9716;   // default: Bangalore
let currentLon = 77.5946;

// ─────────────────────────────────────────────────────────────
// Charts
// ─────────────────────────────────────────────────────────────
const makeLine = (ctx, label, color = "#38bdf8") => new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets: [{ label, data: [], borderColor: color, borderWidth: 2, fill: false, tension: 0.2, pointRadius: 2 }] },
  options: {
    responsive: true,
    animation: false,
    plugins: {
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        pan:  { enabled: true, mode: "x" }
      }
    },
    scales: {
      x: { ticks: { color: "#a1a1aa" }, grid: { color: "#1f2937" } },
      y: { beginAtZero: true, ticks: { color: "#a1a1aa" }, grid: { color: "#1f2937" } }
    }
  }
});

const pvChart   = makeLine(document.getElementById("pvChart").getContext("2d"),   "PV Pred (W)");
const probChart = makeLine(document.getElementById("probChart").getContext("2d"), "Solar Probability", "#a78bfa");

document.getElementById("pvReset").addEventListener("click",   () => pvChart.resetZoom());
document.getElementById("probReset").addEventListener("click", () => probChart.resetZoom());

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const fmtTime = s => { try { return new Date(s).toLocaleTimeString(); } catch { return s; } };
const fmtNum  = (n, d = 2) => (n == null ? "—" : Number(n).toFixed(d));
const decisionLabel = x => x ? "SOLAR" : "GRID";

// ─────────────────────────────────────────────────────────────
// Poll /status from GCE backend
// ─────────────────────────────────────────────────────────────
async function fetchStatus() {
  try {
    statusText.textContent = "Updating…";
    const n   = Number(windowN.value || 120);
    const res = await fetch(`${API_BASE}/status?n=${n}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const js   = await res.json();
    const rows = js.data || [];
    statusText.textContent = `OK (${rows.length})`;

    if (rows.length) {
      const last = rows[rows.length - 1];
      kpiDecision.textContent = decisionLabel(last.decision_solar_mode);
      kpiProb.textContent     = fmtNum(last.solar_mode_probability, 2);
      kpiPV.textContent       = fmtNum(last.pv_power_pred, 1);
      kpiTime.textContent     = fmtTime(last.t);
      kpiLoad.textContent     = fmtNum(last.load_power, 0);
      kpiGrid.textContent     = String(last.grid_available);
    }

    pvChart.data.labels              = rows.map(r => fmtTime(r.t));
    pvChart.data.datasets[0].data    = rows.map(r => r.pv_power_pred ?? 0);
    pvChart.update();

    probChart.data.labels             = rows.map(r => fmtTime(r.t));
    probChart.data.datasets[0].data   = rows.map(r => r.solar_mode_probability ?? 0);
    probChart.update();

    const tbody = document.querySelector("#eventsTable tbody");
    tbody.innerHTML = "";
    for (let i = rows.length - 1; i >= 0; i--) {
      const r  = rows[i];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fmtTime(r.t)}</td>
        <td>${fmtNum(r.pv_power_pred, 1)}</td>
        <td>${fmtNum(r.solar_mode_probability, 2)}</td>
        <td class="${r.decision_solar_mode ? 'solar' : 'grid'}">${decisionLabel(r.decision_solar_mode)}</td>
        <td>${fmtNum(r.load_power, 0)}</td>
        <td>${fmtNum(r.cloud_cover, 2)}</td>
        <td>${fmtNum(r.temp_c, 1)}</td>`;
      tbody.appendChild(tr);
    }
  } catch (e) {
    statusText.textContent = "Error — check GCE backend";
    console.error(e);
  }
}

// ─────────────────────────────────────────────────────────────
// Integrated data (weather + solar + AI) from GCE backend
// ─────────────────────────────────────────────────────────────
async function fetchIntegratedData(lat, lon) {
  try {
    const res = await fetch(`${API_BASE}/integrated-data/${lat}/${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
         const text = await res.text();
         console.error("Backend returned:", text);
         throw new Error("Backend returned non-JSON");
         }
     const data = await res.json();

    if (data.weather?.success) {
      kpiTemp.textContent  = fmtNum(data.weather.data.temperature, 1);
      kpiCloud.textContent = fmtNum(data.weather.data.cloud_cover, 0);
    } else {
      kpiTemp.textContent = kpiCloud.textContent = "—";
    }

    if (data.solar?.success) {
      kpiSolarHours.textContent = fmtNum(data.solar.data.max_sunshine_hours, 0);
      kpiSolarCap.textContent   = fmtNum(data.solar.data.panel_capacity_watts, 0);
    } else {
      kpiSolarHours.textContent = kpiSolarCap.textContent = "—";
    }

    if (data.ai_insights?.success) {
      aiInsightsContent.innerHTML = `<p>${data.ai_insights.insights}</p>`;
    } else if (data.ai_insights?.insights) {
      aiInsightsContent.innerHTML = `<p><em>Basic Analysis:</em><br>${data.ai_insights.insights}</p>`;
    } else {
      aiInsightsContent.innerHTML = `<p>AI insights unavailable: ${data.ai_insights?.error || "unknown error"}</p>`;
    }
  } catch (e) {
    console.error("Integrated data error:", e);
    aiInsightsContent.innerHTML = `<p>Could not load insights: ${e.message}</p>`;
    kpiTemp.textContent = kpiCloud.textContent = kpiSolarHours.textContent = kpiSolarCap.textContent = "—";
  }
}

// ─────────────────────────────────────────────────────────────
// Location search
// ─────────────────────────────────────────────────────────────
async function searchLocation() {
  const address = addressInput.value.trim();
  if (!address) { locationStatus.textContent = "Enter an address first"; return; }
  try {
    locationStatus.textContent = "Searching…";
    const res  = await fetch(`${API_BASE}/api/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (data.success) {
      currentLat = data.latitude;
      currentLon = data.longitude;
      locationStatus.textContent = `📍 ${data.formatted_address}`;
      fetchIntegratedData(currentLat, currentLon);
    } else {
      locationStatus.textContent = `Error: ${data.error}`;
    }
  } catch (e) {
    locationStatus.textContent = `Error: ${e.message}`;
  }
}

function useCurrentLocation() {
  if (!navigator.geolocation) { locationStatus.textContent = "Geolocation not supported"; return; }
  locationStatus.textContent = "Getting location…";
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentLat = pos.coords.latitude;
      currentLon = pos.coords.longitude;
      locationStatus.textContent = `📍 ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`;
      fetchIntegratedData(currentLat, currentLon);
    },
    err => { locationStatus.textContent = `GPS error: ${err.message}`; }
  );
}

async function refreshInsights() {
  refreshInsightsBtn.textContent = "Refreshing…";
  refreshInsightsBtn.disabled = true;
  await fetchIntegratedData(currentLat, currentLon);
  refreshInsightsBtn.textContent = "Refresh Insights";
  refreshInsightsBtn.disabled = false;
}

// ─────────────────────────────────────────────────────────────
// Polling
// ─────────────────────────────────────────────────────────────
let timer = null;
function applyPolling() {
  if (timer) clearInterval(timer);
  timer = setInterval(fetchStatus, Number(pollMs.value || 5000));
}

// ─────────────────────────────────────────────────────────────
// Event listeners + init
// ─────────────────────────────────────────────────────────────
refreshBtn.addEventListener("click", fetchStatus);
pollMs.addEventListener("change", applyPolling);
searchBtn.addEventListener("click", searchLocation);
currentLocationBtn.addEventListener("click", useCurrentLocation);
refreshInsightsBtn.addEventListener("click", refreshInsights);
addressInput.addEventListener("keypress", e => { if (e.key === "Enter") searchLocation(); });

window.addEventListener("load", () => {
  fetchStatus();
  applyPolling();
  fetchIntegratedData(currentLat, currentLon);
});
