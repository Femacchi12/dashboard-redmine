const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1dMNdIcdRSjGE5RZmBN-ygSmu4O4S6060jd4pkq33-qE/gviz/tq?tqx=out:csv&gid=1553715397";

// Cambia esta URL si tu Redmine usa otro dominio.
// La estructura esperada es: https://TU-REDMINE/issues/13489
const REDMINE_BASE_URL = "https://redmine.fibrazo.com/issues/";

let allTickets = [];

const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const impactFilter = document.getElementById("impactFilter");
const priorityFilter = document.getElementById("priorityFilter");
const redmineStatusFilter = document.getElementById("redmineStatusFilter");
const statusFilter = document.getElementById("statusFilter");
const creatorFilter = document.getElementById("creatorFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

async function initDashboard() {
  try {
    // El cacheBust ayuda a que al refrescar el dashboard busque una versión nueva del Sheet.
    const response = await fetch(`${SHEET_URL}&cacheBust=${Date.now()}`, {
      cache: "no-store"
    });

    const csvText = await response.text();

    allTickets = csvToObjects(csvText)
      .filter(ticket =>
        ticket["Título"] ||
        ticket["#TK Padre Redmine"] ||
        ticket["Creador"]
      )
      .map(normalizeTicket);

    fillFilters();
    applyFilters();

    document.getElementById("lastUpdate").textContent =
      new Date().toLocaleString("es-CO");

  } catch (error) {
    console.error("Error cargando datos:", error);
    alert("No se pudieron cargar los datos del Google Sheet. Revisa permisos del Sheet.");
  }
}

function csvToObjects(csv) {
  const rows = parseCSV(csv);
  const headers = rows[0];

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index]?.trim() || "";
    });
    return obj;
  });
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (value || row.length) {
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      }
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeTicket(ticket) {
  return {
    tkPadre: ticket["#TK Padre Redmine"] || "",
    tkHijo: ticket["#TK Hjo Redmine"] || "",
    fecha: ticket["Fecha Creación"] || "",
    edad: Number(ticket["Envejecimiento (Días)"]) || 0,
    plataforma: ticket["Plataforma"] || "Sin plataforma",
    impacto: ticket["Impacto"] || "Sin impacto",
    complejidad: ticket["Complejidad"] || "Sin complejidad",
    tipoRedmine: ticket["Tipo Redmine"] || "Sin tipo",
    prioridad: ticket["Prioridad Redmine"] || "Sin prioridad",
    estadoRedmine: ticket["Estado Redmine"] || "Sin estado Redmine",
    titulo: ticket["Título"] || "",
    objetivo: ticket["Objetivo"] || "",
    estadoOperativo: ticket["Estado Operativo"] || "Sin estado operativo",
    creador: ticket["Creador"] || "Sin creador",
    doc: ticket["Doc"] || "",
    nota: ticket["Nota"] || "",
    asignadoA: ticket["Asignado a"] || ""
  };
}

function fillFilters() {
  fillSelect(platformFilter, uniqueValues(allTickets, "plataforma"));
  fillSelect(impactFilter, uniqueValues(allTickets, "impacto"));
  fillSelect(priorityFilter, uniqueValues(allTickets, "prioridad"));
  fillSelect(redmineStatusFilter, uniqueValues(allTickets, "estadoRedmine"));
  fillSelect(statusFilter, uniqueValues(allTickets, "estadoOperativo"));
  fillSelect(creatorFilter, uniqueValues(allTickets, "creador"));
}

function fillSelect(select, values) {
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function uniqueValues(data, field) {
  return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const platform = platformFilter.value;
  const impact = impactFilter.value;
  const priority = priorityFilter.value;
  const redmineStatus = redmineStatusFilter.value;
  const operativeStatus = statusFilter.value;
  const creator = creatorFilter.value;

  const filtered = allTickets.filter(ticket => {
    const text = `
      ${ticket.tkPadre}
      ${ticket.tkHijo}
      ${ticket.titulo}
      ${ticket.objetivo}
      ${ticket.nota}
      ${ticket.creador}
      ${ticket.asignadoA}
    `.toLowerCase();

    return (
      text.includes(search) &&
      (!platform || ticket.plataforma === platform) &&
      (!impact || ticket.impacto === impact) &&
      (!priority || ticket.prioridad === priority) &&
      (!redmineStatus || ticket.estadoRedmine === redmineStatus) &&
      (!operativeStatus || ticket.estadoOperativo === operativeStatus) &&
      (!creator || ticket.creador === creator)
    );
  });

  updateKPIs(filtered);
  renderStatusChart(filtered);
  renderPriorityChart(filtered);
  renderRedmineStatusChart(filtered);
  renderImpactChart(filtered);
  renderTable(filtered);
}

function clearFilters() {
  searchInput.value = "";
  platformFilter.value = "";
  impactFilter.value = "";
  priorityFilter.value = "";
  redmineStatusFilter.value = "";
  statusFilter.value = "";
  creatorFilter.value = "";

  applyFilters();
}

function updateKPIs(data) {
  const total = data.length;

  const newTickets = data.filter(t =>
    t.estadoOperativo.toLowerCase().includes("nuevo")
  ).length;

  const resolvedTickets = data.filter(t =>
    t.estadoOperativo.toLowerCase().includes("resuelto")
  ).length;

  const highTickets = data.filter(t =>
    ["high", "urgent"].includes(t.prioridad.toLowerCase())
  ).length;

  const ticketsWithAge = data.filter(t => t.edad > 0);

  const avgAge =
    ticketsWithAge.length === 0
      ? 0
      : Math.round(
          ticketsWithAge.reduce((sum, t) => sum + t.edad, 0) /
          ticketsWithAge.length
        );

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiNew").textContent = newTickets;
  document.getElementById("kpiResolved").textContent = resolvedTickets;
  document.getElementById("kpiHigh").textContent = highTickets;
  document.getElementById("kpiAvgAge").textContent = `${avgAge} días`;
}

function renderStatusChart(data) {
  renderBarChart("statusChart", countBy(data, "estadoOperativo"));
}

function renderPriorityChart(data) {
  renderBarChart("priorityChart", countBy(data, "prioridad"));
}

function renderRedmineStatusChart(data) {
  renderBarChart("redmineStatusChart", countBy(data, "estadoRedmine"));
}

function renderImpactChart(data) {
  renderBarChart("impactChart", countBy(data, "impacto"));
}

function countBy(data, field) {
  return data.reduce((acc, item) => {
    const key = item[field] || "Sin dato";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderBarChart(containerId, counts) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(entry => entry[1]), 1);

  entries.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    row.innerHTML = `
      <div class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${(value / max) * 100}%"></div>
      </div>
      <div class="bar-value">${value}</div>
    `;

    container.appendChild(row);
  });
}

function renderTable(data) {
  const tbody = document.getElementById("ticketsTable");
  tbody.innerHTML = "";

  document.getElementById("tableCount").textContent = `${data.length} registros`;

  data
    .sort((a, b) => b.edad - a.edad)
    .forEach(ticket => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${renderTicketLink(ticket.tkPadre)}</td>
        <td>${escapeHtml(ticket.fecha)}</td>
        <td>${ticket.edad || ""}</td>
        <td>${escapeHtml(ticket.plataforma)}</td>
        <td>${escapeHtml(ticket.impacto)}</td>
        <td>${escapeHtml(ticket.tipoRedmine)}</td>
        <td>${escapeHtml(ticket.titulo)}</td>
        <td><span class="tag ${getTagClass(ticket.prioridad)}">${escapeHtml(ticket.prioridad)}</span></td>
        <td><span class="tag ${getTagClass(ticket.estadoRedmine)}">${escapeHtml(ticket.estadoRedmine)}</span></td>
        <td><span class="tag ${getTagClass(ticket.estadoOperativo)}">${escapeHtml(ticket.estadoOperativo)}</span></td>
        <td>${escapeHtml(ticket.creador)}</td>
      `;

      tbody.appendChild(row);
    });
}

function renderTicketLink(ticketNumber) {
  const cleanTicket = String(ticketNumber || "").trim();

  if (!cleanTicket || cleanTicket === "------" || cleanTicket === "--------") {
    return "";
  }

  const url = `${REDMINE_BASE_URL}${encodeURIComponent(cleanTicket)}`;

  return `
    <a class="ticket-link" href="${url}" target="_blank" rel="noopener noreferrer">
      ${escapeHtml(cleanTicket)}
    </a>
  `;
}

function getTagClass(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", applyFilters);
platformFilter.addEventListener("change", applyFilters);
impactFilter.addEventListener("change", applyFilters);
priorityFilter.addEventListener("change", applyFilters);
redmineStatusFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);
creatorFilter.addEventListener("change", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);

initDashboard();
