const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1dMNdIcdRSjGE5RZmBN-ygSmu4O4S6060jd4pkq33-qE/gviz/tq?tqx=out:csv&gid=1553715397";

// Cambia esta URL si tu Redmine usa otro dominio.
// La estructura esperada es: https://TU-REDMINE/issues/13489
const REDMINE_BASE_URL = "https://redmine.fibrazo.com.co/issues/";

let allTickets = [];
let currentFilteredTickets = [];
let sortState = {
  field: "edad",
  direction: "desc"
};

const searchInput = document.getElementById("searchInput");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const filters = {
  platform: {
    element: document.getElementById("platformFilter"),
    field: "plataforma",
    placeholder: "Todas",
    selected: []
  },
  impact: {
    element: document.getElementById("impactFilter"),
    field: "impacto",
    placeholder: "Todos",
    selected: []
  },
  priority: {
    element: document.getElementById("priorityFilter"),
    field: "prioridad",
    placeholder: "Todas",
    selected: []
  },
  redmineStatus: {
    element: document.getElementById("redmineStatusFilter"),
    field: "estadoRedmine",
    placeholder: "Todos",
    selected: []
  },
  status: {
    element: document.getElementById("statusFilter"),
    field: "estadoOperativo",
    placeholder: "Todos",
    selected: []
  },
  creator: {
    element: document.getElementById("creatorFilter"),
    field: "creador",
    placeholder: "Todos",
    selected: []
  }
};

async function initDashboard() {
  try {
    const response = await fetch(`${SHEET_URL}&cacheBust=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const csvText = await response.text();

    allTickets = csvToObjects(csvText)
      .filter(ticket =>
        ticket["Título"] ||
        ticket["#TK Padre Redmine"] ||
        ticket["Creador"]
      )
      .map(normalizeTicket);

    buildAllMultiSelects();
    applyFilters();

    document.getElementById("lastUpdate").textContent =
      new Date().toLocaleString("es-CO");

  } catch (error) {
    console.error("Error cargando datos:", error);
    alert("No se pudieron cargar los datos del Google Sheet. Revisa permisos del Sheet o caché del navegador.");
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

function buildAllMultiSelects() {
  Object.values(filters).forEach(filter => {
    const values = uniqueValues(allTickets, filter.field);
    buildMultiSelect(filter, values);
  });
}

function buildMultiSelect(filter, values) {
  filter.element.innerHTML = "";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "multi-select-button";
  button.innerHTML = `<span>${filter.placeholder}</span>`;

  const menu = document.createElement("div");
  menu.className = "multi-select-menu";

  values.forEach(value => {
    const option = document.createElement("label");
    option.className = "multi-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;

    checkbox.addEventListener("change", () => {
      filter.selected = getCheckedValues(menu);
      updateMultiSelectLabel(filter);
      applyFilters();
    });

    const text = document.createElement("span");
    text.textContent = value;

    option.appendChild(checkbox);
    option.appendChild(text);
    menu.appendChild(option);
  });

  button.addEventListener("click", event => {
    event.stopPropagation();
    closeOtherMultiSelects(filter.element);
    filter.element.classList.toggle("open");
  });

  menu.addEventListener("click", event => {
    event.stopPropagation();
  });

  filter.element.appendChild(button);
  filter.element.appendChild(menu);
  updateMultiSelectLabel(filter);
}

function getCheckedValues(menu) {
  return [...menu.querySelectorAll("input[type='checkbox']:checked")]
    .map(input => input.value);
}

function updateMultiSelectLabel(filter) {
  const label = filter.element.querySelector(".multi-select-button span");

  if (filter.selected.length === 0) {
    label.textContent = filter.placeholder;
  } else if (filter.selected.length === 1) {
    label.textContent = filter.selected[0];
  } else {
    label.textContent = `${filter.selected.length} seleccionados`;
  }
}

function closeOtherMultiSelects(currentElement) {
  Object.values(filters).forEach(filter => {
    if (filter.element !== currentElement) {
      filter.element.classList.remove("open");
    }
  });
}

document.addEventListener("click", () => {
  Object.values(filters).forEach(filter => {
    filter.element.classList.remove("open");
  });
});

function uniqueValues(data, field) {
  return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();

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
      matchesMultiFilter(ticket, filters.platform) &&
      matchesMultiFilter(ticket, filters.impact) &&
      matchesMultiFilter(ticket, filters.priority) &&
      matchesMultiFilter(ticket, filters.redmineStatus) &&
      matchesMultiFilter(ticket, filters.status) &&
      matchesMultiFilter(ticket, filters.creator)
    );
  });

  currentFilteredTickets = filtered;

  updateKPIs(filtered);
  renderStatusChart(filtered);
  renderPriorityChart(filtered);
  renderRedmineStatusChart(filtered);
  renderImpactChart(filtered);
  renderTable(filtered);
}

function matchesMultiFilter(ticket, filter) {
  if (filter.selected.length === 0) {
    return true;
  }

  return filter.selected.includes(ticket[filter.field]);
}

function clearFilters() {
  searchInput.value = "";

  Object.values(filters).forEach(filter => {
    filter.selected = [];
    filter.element
      .querySelectorAll("input[type='checkbox']")
      .forEach(checkbox => {
        checkbox.checked = false;
      });
    updateMultiSelectLabel(filter);
  });

  applyFilters();
}

function updateKPIs(data) {
  const total = data.length;

  const newRedmine = data.filter(t =>
    normalizeText(t.estadoRedmine) === "new"
  ).length;

  const resolvedRedmine = data.filter(t =>
    normalizeText(t.estadoRedmine) === "resolved"
  ).length;

  const otherRedmine = total - newRedmine - resolvedRedmine;

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiNewRedmine").textContent = newRedmine;
  document.getElementById("kpiOtherRedmine").textContent = otherRedmine;
  document.getElementById("kpiResolvedRedmine").textContent = resolvedRedmine;
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

  const sortedData = sortTickets([...data]);

  sortedData.forEach(ticket => {
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

  updateSortHeaders();
}

function sortTickets(data) {
  const { field, direction } = sortState;
  const multiplier = direction === "asc" ? 1 : -1;

  return data.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    if (field === "edad") {
      valueA = Number(valueA) || 0;
      valueB = Number(valueB) || 0;
      return (valueA - valueB) * multiplier;
    }

    if (field === "fecha") {
      valueA = Date.parse(valueA) || 0;
      valueB = Date.parse(valueB) || 0;
      return (valueA - valueB) * multiplier;
    }

    valueA = normalizeText(valueA);
    valueB = normalizeText(valueB);

    return valueA.localeCompare(valueB, "es") * multiplier;
  });
}

function updateSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");

    if (th.dataset.sort === sortState.field) {
      th.classList.add(sortState.direction === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

function setupSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;

      if (sortState.field === field) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      } else {
        sortState.field = field;
        sortState.direction = field === "edad" ? "desc" : "asc";
      }

      renderTable(currentFilteredTickets);
    });
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

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTagClass(value) {
  return normalizeText(value)
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
clearFiltersBtn.addEventListener("click", clearFilters);
setupSortHeaders();

initDashboard();
