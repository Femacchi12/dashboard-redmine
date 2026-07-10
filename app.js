
// Estado visible de revisión IA / correos.
// Este valor debe actualizarse cuando se haga una revisión real de correos Redmine.
const LAST_AI_REVIEW_AT = "2026-07-09T15:47:23-05:00";
const AI_REVIEW_INTERVAL_HOURS = 4;

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1dMNdIcdRSjGE5RZmBN-ygSmu4O4S6060jd4pkq33-qE/gviz/tq?tqx=out:csv&gid=764769884";
const REDMINE_BASE_URL = "https://redmine.fibrazo.com.co/issues/";
const DEFAULT_AREA_FILTER = "Growth";
let suppressDefaultAreaFilter = false;
const COLUMN_STORAGE_KEY = "dashboardRedmineVisibleColumnsV24";

let allTickets = [];
let currentFilteredTickets = [];
let sortState = { field: "edad", direction: "desc" ,visible:true};
let visibleColumns = {};
let dashboardStatus = { lastUpdate: "", nextUpdate: "", pendingProposals: "", lastResult: "" };

const searchInput = document.getElementById("searchInput");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const createdFromFilter = document.getElementById("createdFromFilter");
const createdToFilter = document.getElementById("createdToFilter");
const closedFromFilter = document.getElementById("closedFromFilter");
const closedToFilter = document.getElementById("closedToFilter");
const tableWrapper = document.getElementById("tableWrapper");
const scrollLeftBtn = document.getElementById("scrollLeftBtn");
const scrollRightBtn = document.getElementById("scrollRightBtn");
const columnsControl = document.getElementById("columnsControl");
const columnsBtn = document.getElementById("columnsBtn");
const columnsMenu = document.getElementById("columnsMenu");
const tableHeadRow = document.getElementById("tableHeadRow");

const columnsConfig = [
  { field: "tkPadre", label: "#TK Redmine", visible:true, locked: true },
  { field: "edad", label: "Envejecimiento (Días)", visible:true },
  { field: "estadoRedmine", label: "Estado Redmine", visible:true },
  { field: "areaFZO", label: "Área FZO", visible:true },
  { field: "autor", label: "Autor", visible:true },
  { field: "titulo", label: "Título", visible:true },
  { field: "objetivo", label: "Objetivo", visible:true },
  { field: "plataforma", label: "Plataforma", visible:true },
  { field: "estadoOperativo", label: "Estado Operativo", visible:true },
  { field: "responsable", label: "Responsable", visible:true },
  { field: "fecha", label: "Fecha Creación", visible:false },
  { field: "asignadoA", label: "Asignado A", visible:true },
  { field: "prioridad", label: "Prioridad Redmine", visible:true },
  { field: "complejidad", label: "Complexity", visible:false },
  { field: "versionPrevista", label: "Versión Prevista", visible:false },
  { field: "tipoRedmine", label: "Tipo Redmine", visible:false },
  { field: "fechaCierre", label: "Fecha Cierre", visible:false },
  { field: "impacto", label: "Impacto", visible:false },
  { field: "stakeholder", label: "Stakeholder", visible:false },
  { field: "nota", label: "Última Novedad", visible:true }
];

const filters = {
  priority: { element: document.getElementById("priorityFilter"), field: "prioridad", placeholder: "Todas", selected: [] ,visible:true},
  redmineStatus: { element: document.getElementById("redmineStatusFilter"), field: "estadoRedmine", placeholder: "Todos", selected: [] ,visible:true},
  status: { element: document.getElementById("statusFilter"), field: "estadoOperativo", placeholder: "Todos", selected: [] ,visible:true},
  area: { element: document.getElementById("areaFilter"), field: "areaFZO", placeholder: "Todas", selected: [] ,visible:true},
  author: { element: document.getElementById("authorFilter"), field: "autor", placeholder: "Todos", selected: [] ,visible:true},
  responsible: { element: document.getElementById("responsibleFilter"), field: "responsable", placeholder: "Todos", selected: [] ,visible:true}
};

async function initDashboard() {
  try {
    const response = await fetch(`${SHEET_URL}&cacheBust=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const csvText = await response.text();
    const sheetRows = csvToObjects(csvText);
    dashboardStatus = extractDashboardStatus(sheetRows);
    allTickets = sheetRows
      .map(normalizeTicket)
      .filter(t => t.titulo || t.tkPadre || t.autor || t.responsable || t.estadoRedmine);

    visibleColumns = loadVisibleColumns();
    buildAllMultiSelects();
    renderTableHeaders();
    setupColumnSelector();
    applyFilters();
    renderReviewStatus();
} catch (error) {
    console.error("Error cargando datos:", error);
    alert("No se pudieron cargar los datos del Google Sheet. Revisa permisos del Sheet, filtros activos en la hoja o caché del navegador.");
  }
}

function csvToObjects(csv) {
  const rows = parseCSV(csv);
  const headers = rows[0] || [];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[String(header || "").trim()] = String(row[index] || "").trim();
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


function extractDashboardStatus(rows) {
  const getFromRow = (row, aliases) => {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias) && String(row[alias] || "").trim() !== "") {
        return String(row[alias]).trim();
      }
    }
    const normalizedAliases = aliases.map(normalizeHeader);
    const foundKey = Object.keys(row).find(key => normalizedAliases.includes(normalizeHeader(key)));
    return foundKey ? String(row[foundKey] || "").trim() : "";
  };

  const lastAliases = ["Última actualización", "Ultima actualizacion", "Última Actualización", "Ultima Actualizacion"];
  const nextAliases = ["Próxima actualización", "Proxima actualizacion", "Próxima Actualización", "Proxima Actualizacion"];
  const pendingAliases = ["Propuestas pendientes", "Propuestas Pendientes", "Pendientes aprobación", "Pendientes aprobacion"];
  const resultAliases = ["Último resultado revisión", "Ultimo resultado revision", "Último Resultado Revisión", "Ultimo Resultado Revision"];

  for (const row of rows) {
    const lastUpdate = getFromRow(row, lastAliases);
    const nextUpdate = getFromRow(row, nextAliases);
    const pendingProposals = getFromRow(row, pendingAliases);
    const lastResult = getFromRow(row, resultAliases);
    if (lastUpdate || nextUpdate || pendingProposals || lastResult) {
      return { lastUpdate, nextUpdate, pendingProposals, lastResult };
    }
  }

  return { lastUpdate: "", nextUpdate: "", pendingProposals: "", lastResult: "" };
}

function normalizeTicket(ticket) {
  const get = aliases => {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(ticket, alias) && ticket[alias] !== "") return ticket[alias];
    }

    const normalizedAliases = aliases.map(normalizeHeader);
    const foundKey = Object.keys(ticket).find(key => normalizedAliases.includes(normalizeHeader(key)));
    return foundKey ? ticket[foundKey] : "";
  };

  const getTk = aliases => String(get(aliases) || "").replace(/\.0$/, "").trim();

  return {
    tkPadre: getTk(["#TK Redmine", "#TK Padre Redmine", "TK Redmine", "TK Padre Redmine", "TK Padre"]),
    fecha: get(["Fecha Creación", "Fecha Creacion", "Fecha de creación", "Fecha creación"]),
    fechaCierre: get(["Fecha Cierre", "fecha de cierre", "Fecha de cierre"]),
    edad: Number(get(["Envejecimiento (Días)", "Envejecimiento Dias", "Envejecimiento", "Edad"])) || 0,
    plataforma: get(["Plataforma", "Proyecto"]) || "Sin Plataforma",
    impacto: get(["Impacto"]) || "Sin Impacto",
    complejidad: get(["Complexity", "Complejidad"]) || "Sin Complexity",
    tipoRedmine: get(["Tipo Redmine", "Tipo"]) || "Sin Tipo",
    prioridad: get(["Prioridad Redmine", "Prioridad"]) || "Sin Prioridad",
    estadoRedmine: get(["Estado Redmine", "Estado"]) || "Sin Estado Redmine",
    titulo: get(["Título", "Titulo", "Asunto"]),
    objetivo: get(["Objetivo", "Descripción", "Descripcion"]),
    estadoOperativo: get(["Estado Operativo"]) || "Sin Estado Operativo",
    responsable: get(["Responsable", "Creador"]) || "Sin Responsable",
    nota: get(["Última Novedad","Nota"]),
    asignadoA: get(["asignado a", "Asignado a", "Asignado A", "Asignado"]),
    autor: get(["Autor", "autor"]) || "Sin Autor",
    versionPrevista: get(["Versión Prevista", "versión prevista", "Version prevista"]),
    stakeholder: get(["Stakeholder"]),
    areaFZO: get(["Área FZO", "Area FZO"]) || "Sin Área"
  };
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildAllMultiSelects() {
  Object.values(filters).forEach(filter => {
    const values = uniqueValues(allTickets, filter.field);
    filter.values = values;
    if (filter === filters.area && filter.selected.length === 0) {
      setDefaultAreaFilter(values);
    }
    buildMultiSelect(filter, values);
  });
}

function setDefaultAreaFilter(values = filters.area.values || uniqueValues(allTickets, filters.area.field)) {
  const defaultValue = values.find(value => normalizeText(value) === normalizeText(DEFAULT_AREA_FILTER));
  filters.area.selected = defaultValue ? [defaultValue] : [];
}

function buildMultiSelect(filter, values) {
  filter.values = values;
  filter.element.innerHTML = "";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "multi-select-button";
  button.innerHTML = `<span>${filter.placeholder}</span>`;

  const menu = document.createElement("div");
  menu.className = "multi-select-menu";

  const search = document.createElement("input");
  search.type = "text";
  search.className = "multi-filter-search";
  search.placeholder = "Buscar opción...";

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "multi-options-wrap";

  const emptyState = document.createElement("div");
  emptyState.className = "multi-empty";
  emptyState.textContent = "Sin opciones relacionadas";

  menu.appendChild(search);
  menu.appendChild(optionsWrap);
  menu.appendChild(emptyState);

  function renderOptions(term = "") {
    const normalizedTerm = normalizeText(term);
    optionsWrap.innerHTML = "";
    const visibleValues = values.filter(value => normalizeText(value).includes(normalizedTerm));
    emptyState.style.display = visibleValues.length ? "none" : "block";

    visibleValues.forEach(value => {
      const option = document.createElement("label");
      option.className = "multi-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = value;
      checkbox.checked = filter.selected.includes(value);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked && !filter.selected.includes(value)) filter.selected.push(value);
        if (!checkbox.checked) filter.selected = filter.selected.filter(selectedValue => selectedValue !== value);
        updateMultiSelectLabel(filter);
        applyFilters();
      });

      const text = document.createElement("span");
      text.textContent = value;
      option.appendChild(checkbox);
      option.appendChild(text);
      optionsWrap.appendChild(option);
    });
  }

  search.addEventListener("input", event => renderOptions(event.target.value));
  search.addEventListener("click", event => event.stopPropagation());
  menu.addEventListener("click", event => event.stopPropagation());

  button.addEventListener("click", event => {
    event.stopPropagation();
    closeOtherMultiSelects(filter.element);
    columnsControl.classList.remove("open");
    filter.element.classList.toggle("open");
    if (filter.element.classList.contains("open")) {
      search.value = "";
      renderOptions("");
      setTimeout(() => search.focus(), 0);
    }
  });

  filter.element.appendChild(button);
  filter.element.appendChild(menu);
  renderOptions("");
  updateMultiSelectLabel(filter);
}

function updateMultiSelectLabel(filter) {
  const label = filter.element.querySelector(".multi-select-button span");
  if (filter.selected.length === 0) label.textContent = filter.placeholder;
  else if (filter.selected.length === 1) label.textContent = filter.selected[0];
  else label.textContent = `${filter.selected.length} seleccionados`;
}

function closeOtherMultiSelects(currentElement) {
  Object.values(filters).forEach(filter => {
    if (filter.element !== currentElement) filter.element.classList.remove("open");
  });
}

function uniqueValues(data, field) {
  return [...new Set(data.map(item => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

function applyFilters() {
  const search = normalizeText(searchInput.value);
  const filtered = allTickets.filter(ticket => {
    const text = normalizeText(`${ticket.tkPadre} ${ticket.titulo} ${ticket.objetivo} ${ticket.nota} ${ticket.responsable} ${ticket.autor} ${ticket.asignadoA} ${ticket.stakeholder} ${ticket.impacto} ${ticket.estadoRedmine} ${ticket.estadoOperativo} ${ticket.areaFZO}`);
    return text.includes(search)
      && matchesMultiFilter(ticket, filters.priority)
      && matchesMultiFilter(ticket, filters.redmineStatus)
      && matchesMultiFilter(ticket, filters.status)
      && matchesMultiFilter(ticket, filters.area)
      && matchesMultiFilter(ticket, filters.author)
      && matchesMultiFilter(ticket, filters.responsible)
      && matchesDateRange(ticket.fecha, createdFromFilter.value, createdToFilter.value)
      && matchesDateRange(ticket.fechaCierre, closedFromFilter.value, closedToFilter.value);
  });

  currentFilteredTickets = filtered;
  updateKPIs(filtered);
  renderRedmineStatusChart(filtered);
  renderStatusChart(filtered);
  renderPriorityChart(filtered);
  renderTable(filtered);
}

function matchesMultiFilter(ticket, filter) {
  return filter.selected.length === 0 || filter.selected.includes(ticket[filter.field]);
}

function matchesDateRange(value, from, to) {
  if (!from && !to) return true;
  const date = parseDate(value);
  if (!date) return false;
  if (from && date < parseDate(from)) return false;
  if (to && date > parseDate(to)) return false;
  return true;
}

function clearFilters() {
  suppressDefaultAreaFilter = true;
  searchInput.value = "";
  createdFromFilter.value = "";
  createdToFilter.value = "";
  closedFromFilter.value = "";
  closedToFilter.value = "";
  Object.values(filters).forEach(filter => {
    filter.selected = [];
  });
  Object.values(filters).forEach(filter => {
    buildMultiSelect(filter, filter.values || uniqueValues(allTickets, filter.field));
  });
  applyFilters();
  suppressDefaultAreaFilter = false;
}

function updateKPIs(data) {
  const total = data.length;
  const newRedmine = data.filter(t => normalizeText(t.estadoRedmine) === "new").length;
  const resolvedRedmine = data.filter(t => normalizeText(t.estadoRedmine) === "resolved").length;
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

function countBy(data, field) {
  return data.reduce((acc, item) => {
    const key = item[field] || "Sin Dato";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderBarChart(elementId, counts) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-chart">Sin datos para mostrar</div>`;
    return;
  }

  entries.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <div class="bar-value">${value}</div>
    `;
    container.appendChild(row);
  });
}

function renderTableHeaders() {
  tableHeadRow.innerHTML = columnsConfig.map(column => `<th data-sort="${column.field}" data-col="${column.field}">${escapeHtml(column.label)}</th>`).join("");
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (sortState.field === field) sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      else sortState = { field, direction: "asc" };
      renderTable(currentFilteredTickets);
    });
  });
}

function renderTable(data) {
  const tbody = document.getElementById("ticketsTable");
  tbody.innerHTML = "";
  document.getElementById("tableCount").textContent = `${data.length} registros`;

  sortTickets([...data]).forEach(ticket => {
    const row = document.createElement("tr");
    row.innerHTML = columnsConfig.map(column => `<td data-col="${column.field}">${renderCell(ticket, column.field)}</td>`).join("");
    tbody.appendChild(row);
  });

  updateSortHeaders();
  applyColumnVisibility();
}

function renderCell(ticket, field) {
  const value = ticket[field];
  if (field === "tkPadre") return renderTicketLink(value);
  if (["prioridad", "estadoRedmine", "estadoOperativo", "areaFZO"].includes(field)) return `<span class="tag ${getTagClass(value)}">${escapeHtml(value)}</span>`;
  if (field === "responsable") return `<span class="manual-pill">${escapeHtml(value)}</span>`;
  return escapeHtml(value);
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

    if (field === "fecha" || field === "fechaCierre") {
      valueA = parseDate(valueA)?.getTime() || 0;
      valueB = parseDate(valueB)?.getTime() || 0;
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
    if (th.dataset.sort === sortState.field) th.classList.add(sortState.direction === "asc" ? "sort-asc" : "sort-desc");
  });
}

function setupColumnSelector() {
  columnsMenu.innerHTML = "";

  const actions = document.createElement("div");
  actions.className = "columns-actions";

  const showAllBtn = document.createElement("button");
  showAllBtn.type = "button";
  showAllBtn.textContent = "Ver Todas";
  showAllBtn.addEventListener("click", event => {
    event.stopPropagation();
    columnsConfig.forEach(col => visibleColumns[col.field] = true);
    saveVisibleColumns();
    setupColumnSelector();
    applyColumnVisibility();
  });

  const defaultBtn = document.createElement("button");
  defaultBtn.type = "button";
  defaultBtn.textContent = "Vista Sugerida";
  defaultBtn.addEventListener("click", event => {
    event.stopPropagation();
    localStorage.removeItem(COLUMN_STORAGE_KEY);
    visibleColumns = loadVisibleColumns();
    setupColumnSelector();
    applyColumnVisibility();
  });

  actions.appendChild(showAllBtn);
  actions.appendChild(defaultBtn);
  columnsMenu.appendChild(actions);

  columnsConfig.forEach(column => {
    const option = document.createElement("label");
    option.className = "column-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = column.field;
    checkbox.checked = visibleColumns[column.field] !== false;
    checkbox.disabled = Boolean(column.locked);
    checkbox.addEventListener("change", event => {
      visibleColumns[column.field] = event.target.checked;
      saveVisibleColumns();
      applyColumnVisibility();
    });

    const text = document.createElement("span");
    text.textContent = column.locked ? `${column.label} (Fija)` : column.label;
    option.appendChild(checkbox);
    option.appendChild(text);
    columnsMenu.appendChild(option);
  });

  applyColumnVisibility();
}

function loadVisibleColumns() {
  const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return columnsConfig.reduce((acc, column) => {
        acc[column.field] = Object.prototype.hasOwnProperty.call(parsed, column.field) ? parsed[column.field] : column.visible;
        return acc;
      }, {});
    } catch (error) {
      console.warn("No se pudo leer configuración de columnas:", error);
    }
  }

  return columnsConfig.reduce((acc, column) => {
    acc[column.field] = column.visible;
    return acc;
  }, {});
}

function saveVisibleColumns() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
}

function applyColumnVisibility() {
  columnsConfig.forEach(column => {
    const visible = visibleColumns[column.field] !== false || column.locked;
    document.querySelectorAll(`[data-col="${column.field}"]`).forEach(cell => {
      cell.style.display = visible ? "" : "none";
    });
  });
}

function renderTicketLink(ticketNumber) {
  const cleanTicket = String(ticketNumber || "").trim();
  if (!cleanTicket || cleanTicket === "------" || cleanTicket === "--------" || cleanTicket.toLowerCase() === "no creado") return escapeHtml(cleanTicket.toLowerCase() === "no creado" ? "No Creado" : "");
  const url = `${REDMINE_BASE_URL}${encodeURIComponent(cleanTicket)}`;
  return `<a class="ticket-link" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanTicket)}</a>`;
}

function parseDate(value) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue || cleanValue === "------") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) return new Date(`${cleanValue}T00:00:00`);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue)) {
    const [day, month, year] = cleanValue.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  const parsed = new Date(cleanValue);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTagClass(value) {
  return normalizeText(value).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
createdFromFilter.addEventListener("change", applyFilters);
createdToFilter.addEventListener("change", applyFilters);
closedFromFilter.addEventListener("change", applyFilters);
closedToFilter.addEventListener("change", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);

columnsBtn.addEventListener("click", event => {
  event.stopPropagation();
  closeOtherMultiSelects(null);
  columnsControl.classList.toggle("open");
});

columnsMenu.addEventListener("click", event => event.stopPropagation());
scrollLeftBtn.addEventListener("click", () => tableWrapper.scrollBy({ left: -420, behavior: "smooth" }));
scrollRightBtn.addEventListener("click", () => tableWrapper.scrollBy({ left: 420, behavior: "smooth" }));
tableWrapper.addEventListener("wheel", event => {
  if (event.shiftKey) {
    event.preventDefault();
    tableWrapper.scrollLeft += event.deltaY;
  }
});


function formatDashboardDateTime(date) {
  if (!(date instanceof Date) || isNaN(date)) return "--";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(date);
}

function calculateNextAiReview(lastDate) {
  if (!(lastDate instanceof Date) || isNaN(lastDate)) return null;
  const now = new Date();
  let next = new Date(lastDate.getTime());
  const intervalMs = AI_REVIEW_INTERVAL_HOURS * 60 * 60 * 1000;
  while (next <= now) {
    next = new Date(next.getTime() + intervalMs);
  }
  return next;
}

function renderReviewStatus() {
  const lastAiReviewEl = document.getElementById("lastAiReview");
  const nextAiReviewEl = document.getElementById("nextAiReview");
  const pendingProposalsEl = document.getElementById("pendingProposals");

  if (lastAiReviewEl) {
    lastAiReviewEl.textContent = dashboardStatus.lastUpdate || formatDashboardDateTime(new Date(LAST_AI_REVIEW_AT));
  }

  if (nextAiReviewEl) {
    const fallbackNextReview = calculateNextAiReview(new Date(LAST_AI_REVIEW_AT));
    nextAiReviewEl.textContent = dashboardStatus.nextUpdate || formatDashboardDateTime(fallbackNextReview);
  }

  if (pendingProposalsEl) {
    const pending = dashboardStatus.pendingProposals || "0";
    const result = dashboardStatus.lastResult ? ` · ${dashboardStatus.lastResult}` : "";
    pendingProposalsEl.textContent = `${pending}${result}`;
  }
}


document.addEventListener("click", () => {
  Object.values(filters).forEach(filter => filter.element.classList.remove("open"));
  columnsControl.classList.remove("open");
});

initDashboard();

renderReviewStatus();
