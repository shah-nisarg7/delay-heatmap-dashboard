async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const stations = await response.json();
    renderTable(stations);
  } catch (err) {
    console.error("Failed to load data.json:", err);
    const body = document.getElementById("data-body");
    body.innerHTML = "<tr><td colspan='4'>Could not load data.</td></tr>";
  }
}

function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

function renderTable(stations) {
  const body = document.getElementById("data-body");
  body.innerHTML = "";
  for (const s of stations) {
    const row = document.createElement("tr");
    addCell(row, s.station);
    addCell(row, s.train_count);
    addCell(row, s.avg_delay_minutes);
    addCell(row, s.lines.join(", "));
    body.appendChild(row);
  }
}

loadData();