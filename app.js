
const SHEET_ID = "1dMNdIcdRSjGE5RZmBN-ygSmu4O4S6060jd4pkq33-qE";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=764769884`;
const PROPOSALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=764769885`;
const LOG_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=764769886`;
const MANUAL_CHANGES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=764769888`;
const REDMINE_BASE_URL = "https://redmine.fibrazo.com.co/issues/";
const DEFAULT_AREA_FILTER = "Growth";
let suppressDefaultAreaFilter = false;
const COLUMN_STORAGE_KEY = "dashboardRedmineVisibleColumnsV29";

let allTickets = [];
let currentFilteredTickets = [];
let sortState = { field: "edad", direction: "desc" ,visible:true};
let visibleColumns = {};
let dashboardStatus = { lastUpdate: "", nextUpdate: "", pendingProposals: "", lastResult: "" };
let proposalsData = [];
let logData = [];
let manualChangesData = [];
let showAllRecentChanges = false;
const RECENT_CHANGES_INITIAL_LIMIT = 10;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
let uiInitialized = false;
let refreshInProgress = false;

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
  priority: { element: document.getElementById("priorityFilter"), field: "prioridad", placeholder: "Todas", selected: [], visible: true },
  redmineStatus: { element: document.getElementById("redmineStatusFilter"), field: "estadoRedmine", placeholder: "Todos", selected: [], visible: true },
  status: { element: document.getElementById("statusFilter"), field: "estadoOperativo", placeholder: "Todos", selected: [], visible: true },
  area: { element: document.getElementById("areaFilter"), field: "areaFZO", placeholder: "Todas", selected: [], visible: true },
  deliveryStatus: { element: document.getElementById("deliveryStatusFilter"), field: "situacionEntrega", placeholder: "Todas", selected: [], visible: true },
  author: { element: document.getElementById("authorFilter"), field: "autor", placeholder: "Todos", selected: [], visible: true },
  responsible: { element: document.getElementById("responsibleFilter"), field: "responsable", placeholder: "Todos", selected: [], visible: true },
  sprint: { element: document.getElementById("sprintFilter"), field: "sprint", placeholder: "Todos", selected: [], visible: true },
  sprintOrigin: { element: document.getElementById("sprintOriginFilter"), field: "origenSprint", placeholder: "Todos", selected: [], visible: true }
};

async function initDashboard() {
  if (refreshInProgress) return;
  refreshInProgress = true;
  try {
    const cacheBust = Date.now();
    const [mainResponse, proposalsResponse, logResponse, manualResponse] = await Promise.all([
      fetch(`${SHEET_URL}&cacheBust=${cacheBust}`, { cache: "no-store" }),
      fetch(`${PROPOSALS_URL}&cacheBust=${cacheBust}`, { cache: "no-store" }),
      fetch(`${LOG_URL}&cacheBust=${cacheBust}`, { cache: "no-store" }),
      fetch(`${MANUAL_CHANGES_URL}&cacheBust=${cacheBust}`, { cache: "no-store" })
    ]);
    if (!mainResponse.ok) throw new Error(`Error HTTP ${mainResponse.status}`);

    const csvText = await mainResponse.text();
    const sheetRows = csvToObjects(csvText);
    proposalsData = proposalsResponse.ok ? csvToObjects(await proposalsResponse.text()) : [];
    logData = logResponse.ok ? csvToObjects(await logResponse.text()) : [];
    manualChangesData = manualResponse.ok ? csvToObjects(await manualResponse.text()) : [];
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
    renderReviewTabs();
    if (!uiInitialized) {
      setupReviewTabs();
      setupReviewToggle();
      uiInitialized = true;
    }
} catch (error) {
    console.error("Error cargando datos:", error);
    alert("No se pudieron cargar los datos del Google Sheet. Revisa permisos del Sheet, filtros activos en la hoja o caché del navegador.");
  } finally {
    refreshInProgress = false;
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
    areaFZO: get(["Área FZO", "Area FZO"]) || "Sin Área",
    situacionEntrega: get(["Situación de Entrega", "Situacion de Entrega"]) || "Sin información",
    sprint: get(["Sprint", "Situación Sprint", "Situacion Sprint"]) || "Sin información",
    origenSprint: get(["Origen en Sprint", "Origen Sprint"]) || "Sin información"
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
  return [...new Set(data.map(item => item[field]).filter(Boolean))].sort(compareFilterValues);
}

function compareFilterValues(a, b) {
  const aText = String(a || "").trim();
  const bText = String(b || "").trim();
  const aWithoutInfo = normalizeText(aText).includes("sin_informacion") || normalizeText(aText).includes("sin_info");
  const bWithoutInfo = normalizeText(bText).includes("sin_informacion") || normalizeText(bText).includes("sin_info");

  if (aWithoutInfo !== bWithoutInfo) return aWithoutInfo ? 1 : -1;

  const aDate = parseFilterPeriodStart(aText);
  const bDate = parseFilterPeriodStart(bText);
  if (aDate && bDate) return bDate - aDate;
  if (aDate !== bDate) return aDate ? -1 : 1;

  return aText.localeCompare(bText, "es");
}

function parseFilterPeriodStart(value) {
  const match = String(value || "").match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (!match) return 0;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function applyFilters() {
  const search = normalizeText(searchInput.value);
  const isExactTkSearch = /^\d+$/.test(search);
  const filtered = allTickets.filter(ticket => {
    const text = normalizeText(`${ticket.tkPadre} ${ticket.titulo} ${ticket.objetivo} ${ticket.nota} ${ticket.responsable} ${ticket.autor} ${ticket.asignadoA} ${ticket.stakeholder} ${ticket.impacto} ${ticket.estadoRedmine} ${ticket.estadoOperativo} ${ticket.areaFZO}`);
    const matchesSearch = isExactTkSearch
      ? normalizeTicketKey(ticket.tkPadre) === search
      : text.includes(search);
    return matchesSearch
      && matchesMultiFilter(ticket, filters.priority)
      && matchesMultiFilter(ticket, filters.redmineStatus)
      && matchesMultiFilter(ticket, filters.status)
      && matchesMultiFilter(ticket, filters.area)
      && matchesMultiFilter(ticket, filters.deliveryStatus)
      && matchesMultiFilter(ticket, filters.author)
      && matchesMultiFilter(ticket, filters.responsible)
      && matchesMultiFilter(ticket, filters.sprint)
      && matchesMultiFilter(ticket, filters.sprintOrigin)
      && matchesDateRange(ticket.fecha, createdFromFilter.value, createdToFilter.value)
      && matchesDateRange(ticket.fechaCierre, closedFromFilter.value, closedToFilter.value);
  });

  currentFilteredTickets = filtered;
  updateKPIs(filtered);
  renderRedmineStatusChart(filtered);
  renderStatusChart(filtered);
  renderPriorityChart(filtered);
  renderTable(filtered);
  renderReviewTabs();
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
  if (field === "nota") return `<div class="nota-cell" title="${escapeHtml(value)}">${escapeHtml(value)}</div>`;
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

function renderReviewStatus() {
  const lastAiReviewEl = document.getElementById("lastAiReview");
  const nextAiReviewEl = document.getElementById("nextAiReview");

  if (lastAiReviewEl) {
    lastAiReviewEl.textContent = dashboardStatus.lastUpdate || "--";
  }

  if (nextAiReviewEl) {
    nextAiReviewEl.textContent = dashboardStatus.nextUpdate || "--";
  }
}

function setupReviewTabs() {
  const recentTab = document.getElementById("tabRecentChanges");
  const pendingTab = document.getElementById("tabPendingChanges");
  const recentPanel = document.getElementById("recentChangesPanel");
  const pendingPanel = document.getElementById("pendingChangesPanel");
  if (!recentTab || !pendingTab || !recentPanel || !pendingPanel) return;

  const activate = active => {
    const showRecent = active === "recent";
    recentTab.classList.toggle("active", showRecent);
    pendingTab.classList.toggle("active", !showRecent);
    recentPanel.classList.toggle("active", showRecent);
    pendingPanel.classList.toggle("active", !showRecent);
  };

  recentTab.addEventListener("click", event => { event.stopPropagation(); activate("recent"); });
  pendingTab.addEventListener("click", event => { event.stopPropagation(); activate("pending"); });
}

function setupReviewToggle() {
  const panel = document.getElementById("reviewPanel");
  const toggle = document.getElementById("reviewToggle");
  const action = document.getElementById("reviewToggleAction");
  if (!panel || !toggle) return;

  toggle.addEventListener("click", () => {
    const isCollapsed = panel.classList.toggle("collapsed");
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    if (action) action.textContent = isCollapsed ? "Ver detalle ▾" : "Ocultar detalle ▴";
  });
}

function renderReviewTabs() {
  // Solo las propuestas del flujo de aprobación deben aparecer como pendientes.
  // Cambios_Manuales es una bitácora de ediciones ya realizadas, no una cola de aprobación.
  const pendingItems = groupPendingProposalsByTicket(getPendingProposals())
    .sort((a, b) => b.sortDate - a.sortDate);
  const pendingInfo = renderPendingChanges(pendingItems);
  renderRecentChanges();

  const pendingBadge = document.getElementById("pendingBadge");
  if (pendingBadge) {
    if (pendingInfo.total && pendingInfo.visible !== pendingInfo.total) {
      pendingBadge.textContent = `${pendingInfo.visible}/${pendingInfo.total}`;
      pendingBadge.title = `${pendingInfo.visible} pendientes visibles con los filtros actuales de ${pendingInfo.total} pendientes totales`;
    } else {
      pendingBadge.textContent = pendingInfo.visible;
      pendingBadge.title = `${pendingInfo.visible} pendientes por aprobar`;
    }
  }

  const reviewSummary = document.getElementById("reviewSummary");
  if (reviewSummary) {
    reviewSummary.textContent = "";
  }
}

function getPendingProposals() {
  return proposalsData.filter(row => normalizeText(getRowValue(row, ["Estado Propuesta", "Estado"])) === "pendiente_aprobacion");
}

function getPendingManualChanges() {
  return manualChangesData.filter(row => normalizeText(getRowValue(row, ["Estado"])) === "pendiente_aprobacion_dash");
}

function renderRecentChanges() {
  const panel = document.getElementById("recentChangesPanel");
  if (!panel) return;

  const allRows = getAppliedChangeRows();
  const rows = filterTrackingRowsByVisibleTickets(allRows);
  if (!rows.length) {
    panel.innerHTML = `<div class="review-empty">No hay nuevos cambios</div>`;
    return;
  }

  const visibleRows = showAllRecentChanges ? rows : rows.slice(0, RECENT_CHANGES_INITIAL_LIMIT);
  const hasMoreRows = rows.length > RECENT_CHANGES_INITIAL_LIMIT;
  const listHtml = `<div class="review-list changes-list single-line-changes-list">${visibleRows.map(row => {
    const tkText = row.tk ? `TK #${escapeHtml(row.tk)}` : escapeHtml(row.title || "Cambio registrado");
    const tkHtml = row.link ? `<a class="ticket-link" href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer">${tkText}</a>` : tkText;
    const title = row.title ? ` | ${escapeHtml(row.title)}` : "";
    return `
      <article class="review-item applied-change single-line-change ${row.sourceType === "manual" ? "manual-change" : ""}">
        <div class="single-change-top">
          <div class="single-change-title"><strong>${tkHtml}</strong>${title}</div>
          <time>${escapeHtml(row.date || "Sin fecha")}</time>
        </div>
        <div class="single-change-summary">${escapeHtml(row.summary || "Cambio registrado")}</div>
      </article>
    `;
  }).join("")}</div>`;

  const moreButtonHtml = hasMoreRows
    ? `<div class="review-more-actions">
        <button id="toggleRecentChangesLimit" type="button" class="review-more-btn">
          ${showAllRecentChanges ? "Ver solo las últimas 10" : `Ver más actualizaciones (${rows.length - RECENT_CHANGES_INITIAL_LIMIT})`}
        </button>
      </div>`
    : "";

  panel.innerHTML = `${listHtml}${moreButtonHtml}`;

  const toggleButton = document.getElementById("toggleRecentChangesLimit");
  if (toggleButton) {
    toggleButton.addEventListener("click", event => {
      event.stopPropagation();
      showAllRecentChanges = !showAllRecentChanges;
      renderRecentChanges();
    });
  }
}

function getAppliedChangeRows() {
  const appliedProposals = groupAppliedProposalsByTicket([...proposalsData]
    .filter(row => Object.values(row).some(Boolean))
    .filter(isAppliedProposal));

  const manualChanges = groupManualChangesByTicket([...manualChangesData]
    .filter(row => Object.values(row).some(Boolean))
    .filter(row => {
      const estado = normalizeText(getRowValue(row, ["Estado"]));
      return estado === "aprobado_dash" || estado === "aprobado" || estado === "visible_dash" || estado === "publicado";
    }));

  return [...appliedProposals, ...manualChanges]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 80);
}

function isAppliedProposal(row) {
  const estado = normalizeText(getRowValue(row, ["Estado Propuesta", "Estado"]));
  const fechaAplicacion = getRowValue(row, ["Fecha Aplicación", "Fecha Aplicacion"]);
  const resultadoAplicacion = normalizeText(getRowValue(row, ["Resultado Aplicación", "Resultado Aplicacion"]));
  const excludedStates = ["pendiente_aprobacion", "desestimado_historico", "desestimado_duplicado", "rechazado"];
  const excludedResults = ["no_aplicado", "sin_cambio_duplicado"];
  if (excludedStates.some(value => estado === value || estado.startsWith(value))) return false;
  if (excludedResults.includes(resultadoAplicacion)) return false;
  return Boolean(fechaAplicacion || resultadoAplicacion === "ok" || estado.includes("aplic") || estado.includes("ejecut") || estado.includes("realiz"));
}

function groupAppliedProposalsByTicket(rows) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const tk = getRowValue(row, ["#TK Redmine", "TK Redmine"]);
    const applicationDate = getRowValue(row, ["Fecha Aplicación", "Fecha Aplicacion", "Fecha Detección", "Fecha Deteccion", "Fecha"]);
    const dateKey = normalizeDateMinute(applicationDate);
    const key = `${dateKey || "sin_fecha"}__${tk || "sin_tk"}`;
    const parsed = safeParseJson(getRowValue(row, ["Datos JSON Propuesto", "Datos JSON", "JSON"]));
    const changes = parsed && parsed.changes && typeof parsed.changes === "object" ? parsed.changes : {};
    const summary = getRowValue(row, ["Resumen Novedad", "Detalle", "Resumen"]);
    const result = getRowValue(row, ["Resultado Aplicación", "Resultado Aplicacion"]) || "OK";

    if (!groups.has(key)) {
      groups.set(key, {
        sourceType: "applied",
        tk,
        action: "Actualización Redmine",
        title: getRowValue(row, ["Título", "Titulo"]),
        date: applicationDate,
        author: getRowValue(row, ["Aplicado Por", "Autor Novedad", "Autor"]),
        link: getRowValue(row, ["Link Redmine"]) || (tk ? `${REDMINE_BASE_URL}${tk}` : ""),
        sortDate: parseDateLike(applicationDate) || index,
        result,
        count: 0,
        fieldSet: new Set(),
        statusMap: new Map(),
        genericNotes: []
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.sortDate = Math.max(group.sortDate || 0, parseDateLike(applicationDate) || 0);
    if (!group.title) group.title = getRowValue(row, ["Título", "Titulo"]);
    if (!group.date) group.date = applicationDate;
    if (!group.author) group.author = getRowValue(row, ["Aplicado Por", "Autor Novedad", "Autor"]);
    if (!group.result || group.result === "OK") group.result = result || "OK";

    Object.entries(changes).forEach(([field, value]) => {
      const fieldName = normalizeDisplayField(field);
      if (!fieldName) return;
      group.fieldSet.add(fieldName);
      if (isStatusField(fieldName)) {
        group.statusMap.set(fieldName, extractFieldChangeText(fieldName, summary, value));
      }
    });

    const statusFromSummary = extractStatusChangeFromText(summary);
    if (statusFromSummary) {
      group.statusMap.set("Estado Redmine", statusFromSummary);
      group.fieldSet.add("Estado Redmine");
    }

    if (!Object.keys(changes).length && summary) {
      group.genericNotes.push(summary);
    }
  });

  return [...groups.values()].map(group => {
    const statusParts = [...group.statusMap.values()].filter(Boolean);
    const otherFields = [...group.fieldSet].filter(field => !isStatusField(field));
    const otherPart = otherFields.length ? `Campos actualizados: ${formatFieldList(otherFields)}` : "";
    const fallback = group.genericNotes.length ? "Novedad actualizada" : "Cambio aplicado";
    return {
      sourceType: group.sourceType,
      tk: group.tk,
      action: group.action,
      title: group.title,
      summary: [...statusParts, otherPart].filter(Boolean).join(" · ") || fallback,
      date: group.date,
      author: group.author,
      link: group.link,
      sortDate: group.sortDate,
      result: group.result || "OK",
      count: group.count
    };
  });
}

function groupManualChangesByTicket(rows) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const tk = getRowValue(row, ["#TK Redmine", "TK Redmine"]);
    const date = getRowValue(row, ["Fecha Cambio", "Fecha"]);
    const dateKey = normalizeDateMinute(date);
    const key = `${dateKey || "sin_fecha"}__${tk || "sin_tk"}`;
    const field = normalizeDisplayField(getRowValue(row, ["Campo Modificado", "Campo"]));
    const oldValue = getRowValue(row, ["Valor Anterior"]);
    const newValue = getRowValue(row, ["Valor Nuevo"]);
    const detail = getRowValue(row, ["Detalle"]);

    if (!groups.has(key)) {
      groups.set(key, {
        sourceType: "manual",
        tk,
        action: "Cambio manual aprobado",
        title: "Cambios manuales aprobados",
        date,
        author: "",
        link: tk ? `${REDMINE_BASE_URL}${tk}` : "",
        sortDate: parseDateLike(date) || index,
        result: "OK",
        count: 0,
        fieldSet: new Set(),
        statusMap: new Map(),
        details: []
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.sortDate = Math.max(group.sortDate || 0, parseDateLike(date) || 0);
    if (field) group.fieldSet.add(field);
    if (field && isStatusField(field)) {
      group.statusMap.set(field, `${field}: ${oldValue || "vacío"} → ${newValue || "vacío"}`);
    }
    if (detail) group.details.push(detail);
  });

  return [...groups.values()].map(group => {
    const statusParts = [...group.statusMap.values()].filter(Boolean);
    const otherFields = [...group.fieldSet].filter(field => !isStatusField(field));
    const otherPart = otherFields.length ? `Campos actualizados: ${formatFieldList(otherFields)}` : "";
    return {
      sourceType: group.sourceType,
      tk: group.tk,
      action: group.action,
      title: group.title,
      summary: [...statusParts, otherPart].filter(Boolean).join(" · ") || "Cambio manual aprobado",
      date: group.date,
      author: group.author,
      link: group.link,
      sortDate: group.sortDate,
      result: group.result,
      count: group.count
    };
  });
}

function safeParseJson(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch (error) { return null; }
}

function normalizeDisplayField(field) {
  const text = String(field || "").trim();
  if (!text) return "";
  const normalized = normalizeHeader(text);
  const aliases = {
    "estadoredmine": "Estado Redmine",
    "estadooperativo": "Estado Operativo",
    "versionprevista": "Versión Prevista",
    "ultimanovedad": "Última Novedad",
    "stakeholder": "Stakeholder",
    "asignadoa": "Asignado A",
    "prioridadredmine": "Prioridad Redmine",
    "tiporedmine": "Tipo Redmine",
    "plataforma": "Plataforma",
    "fechacierre": "Fecha Cierre",
    "fechacreacion": "Fecha Creación",
    "complexity": "Complexity",
    "impacto": "Impacto",
    "doc": "Doc",
    "edicionmultiple": "Edición múltiple"
  };
  return aliases[normalized] || text;
}

function isStatusField(field) {
  const normalized = normalizeHeader(field);
  return normalized === "estadoredmine" || normalized === "estadooperativo";
}

function extractFieldChangeText(fieldName, summary, value) {
  const parsed = fieldName === "Estado Redmine"
    ? extractStatusChangeFromText(summary)
    : extractNamedChangeFromText(summary, fieldName);
  if (parsed) return parsed;
  return `${fieldName}: actualizado${value ? ` a ${value}` : ""}`;
}

function extractStatusChangeFromText(text) {
  const parsed = extractNamedChangeFromText(text, "Estado");
  return parsed ? parsed.replace(/^Estado:/, "Estado Redmine:") : "";
}

function extractNamedChangeFromText(text, label) {
  const value = String(text || "");
  if (!value) return "";
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s+cambiad[oa]\\s+de\\s+(.+?)\\s+a\\s+([^;\\n]+)`, "i");
  const match = value.match(regex);
  if (!match) return "";
  const from = cleanChangeValue(match[1]);
  const to = cleanChangeValue(match[2]);
  return `${label}: ${from} → ${to}`;
}

function cleanChangeValue(value) {
  return String(value || "").replace(/^["'“”]+|["'“”]+$/g, "").trim();
}

function formatFieldList(fields) {
  const clean = [...new Set(fields)].filter(Boolean);
  if (!clean.length) return "Sin campos";
  if (clean.length <= 4) return clean.join(", ");
  return `${clean.slice(0, 4).join(", ")} +${clean.length - 4} más`;
}

function normalizeDateMinute(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace(/:\d{2}(\s*(AM|PM|a\.\s*m\.|p\.\s*m\.))?$/i, "").trim();
}

function parseDateLike(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const normalized = text
    .replace(/a\.\s*m\./gi, "AM")
    .replace(/p\.\s*m\./gi, "PM")
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$2-$1");
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getRecentReviewRows() {
  return getAppliedChangeRows();
}

function getLatestLogResult() {
  const rows = [...logData].filter(row => Object.values(row).some(Boolean));
  const latest = rows[rows.length - 1];
  return latest ? getRowValue(latest, ["Resultado"]) : "";
}

function formatReviewResult(value) {
  const text = String(value || "").trim();
  return normalizeText(text) === "sin_cambios" ? "Sin cambios" : text;
}

function formatReviewDetail(detail, result) {
  const text = String(detail || "").trim();
  const normalized = normalizeText(text);
  if (!text && normalizeText(result) === "sin_cambios") return "No hay nuevos cambios";
  if (normalized.includes("no_se_detectaron_novedades") || normalized.includes("no_hay_novedades")) return "No hay nuevos cambios";
  return text || "Sin detalle";
}

function renderPendingChanges(items) {
  const panel = document.getElementById("pendingChangesPanel");
  const allGroupedItems = items;
  const groupedItems = filterTrackingRowsByVisibleTickets(allGroupedItems);

  if (!panel) return { visible: groupedItems.length, total: allGroupedItems.length };

  if (!groupedItems.length) {
    const hiddenNote = allGroupedItems.length ? `<div class="review-filter-note">Hay ${allGroupedItems.length} pendiente(s) total(es), pero no coinciden con los filtros actuales.</div>` : "";
    panel.innerHTML = `<div class="review-empty">No hay cambios pendientes por aprobar.</div>${hiddenNote}`;
    return { visible: groupedItems.length, total: allGroupedItems.length };
  }

  panel.innerHTML = `<div class="review-list single-line-changes-list">${groupedItems.map(row => {
    const tkText = row.tk ? `TK #${escapeHtml(row.tk)}` : "Sin TK";
    const tkHtml = row.link ? `<a class="ticket-link" href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer">${tkText}</a>` : tkText;
    const title = row.title ? ` | ${escapeHtml(row.title)}` : "";
    return `
      <article class="review-item pending single-line-change">
        <div class="single-change-top">
          <div class="single-change-title"><strong>${tkHtml}</strong>${title}</div>
          <time>${escapeHtml(row.date || "Sin fecha")}</time>
        </div>
        <div class="single-change-summary">${escapeHtml(row.summary || "Cambio pendiente")}</div>
      </article>
    `;
  }).join("")}</div>`;

  return { visible: groupedItems.length, total: allGroupedItems.length };
}

function filterTrackingRowsByVisibleTickets(rows) {
  if (!Array.isArray(currentFilteredTickets) || !currentFilteredTickets.length) return [];
  const visibleTickets = new Set(currentFilteredTickets.map(ticket => normalizeTicketKey(ticket.tkPadre)).filter(Boolean));
  return rows.filter(row => visibleTickets.has(normalizeTicketKey(row.tk)));
}

function normalizeTicketKey(value) {
  return String(value || "").trim().replace(/^#/, "").toLowerCase();
}

function groupPendingProposalsByTicket(rows) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const tk = getRowValue(row, ["#TK Redmine", "TK Redmine"]);
    const date = getRowValue(row, ["Fecha Detección", "Fecha Deteccion", "Fecha"]);
    const dateKey = normalizeDateMinute(date);
    const key = `${dateKey || "sin_fecha"}__${tk || "sin_tk"}`;
    const parsed = safeParseJson(getRowValue(row, ["Datos JSON Propuesto", "Datos JSON", "JSON"]));
    const changes = parsed && parsed.changes && typeof parsed.changes === "object" ? parsed.changes : {};
    const summary = getRowValue(row, ["Resumen Novedad", "Detalle", "Resumen"]);

    if (!groups.has(key)) {
      groups.set(key, {
        tk,
        title: getRowValue(row, ["Título", "Titulo"]),
        date,
        link: getRowValue(row, ["Link Redmine"]) || (tk ? `${REDMINE_BASE_URL}${tk}` : ""),
        count: 0,
        sortDate: parseDateLike(date) || index,
        fieldSet: new Set(),
        statusMap: new Map(),
        genericNotes: []
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.sortDate = Math.max(group.sortDate || 0, parseDateLike(date) || 0);
    if (!group.title) group.title = getRowValue(row, ["Título", "Titulo"]);

    Object.entries(changes).forEach(([field, value]) => {
      const fieldName = normalizeDisplayField(field);
      if (!fieldName) return;
      group.fieldSet.add(fieldName);
      if (isStatusField(fieldName)) {
        group.statusMap.set(fieldName, extractFieldChangeText(fieldName, summary, value));
      }
    });

    const statusFromSummary = extractStatusChangeFromText(summary);
    if (statusFromSummary) {
      group.statusMap.set("Estado Redmine", statusFromSummary);
      group.fieldSet.add("Estado Redmine");
    }

    if (!Object.keys(changes).length && summary) group.genericNotes.push(summary);
  });

  return [...groups.values()]
    .sort((a, b) => b.sortDate - a.sortDate)
    .map(group => {
      const statusParts = [...group.statusMap.values()].filter(Boolean);
      const otherFields = [...group.fieldSet].filter(field => !isStatusField(field));
      const otherPart = otherFields.length ? `Campos por actualizar: ${formatFieldList(otherFields)}` : "";
      return {
        tk: group.tk,
        title: group.title,
        date: group.date,
        link: group.link,
        count: group.count,
        summary: [...statusParts, otherPart].filter(Boolean).join(" · ") || "Cambio pendiente de aprobación"
      };
    });
}

function groupPendingManualChangesByTicket(rows) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const tk = getRowValue(row, ["#TK Redmine", "TK Redmine"]);
    const date = getRowValue(row, ["Fecha Cambio", "Fecha"]);
    const dateKey = normalizeDateMinute(date);
    const key = `${dateKey || "sin_fecha"}__${tk || "sin_tk"}`;
    const field = normalizeDisplayField(getRowValue(row, ["Campo Modificado", "Campo"]));
    const oldValue = getRowValue(row, ["Valor Anterior"]);
    const newValue = getRowValue(row, ["Valor Nuevo"]);

    if (!groups.has(key)) {
      groups.set(key, {
        tk,
        title: "Cambio manual pendiente",
        date,
        link: tk ? `${REDMINE_BASE_URL}${tk}` : "",
        count: 0,
        sortDate: parseDateLike(date) || index,
        fieldSet: new Set(),
        statusMap: new Map()
      });
    }

    const group = groups.get(key);
    group.count += 1;
    if (field) group.fieldSet.add(field);
    if (field && isStatusField(field)) {
      group.statusMap.set(field, `${field}: ${oldValue || "vacío"} → ${newValue || "vacío"}`);
    }
  });

  return [...groups.values()].map(group => {
    const statusParts = [...group.statusMap.values()].filter(Boolean);
    const otherFields = [...group.fieldSet].filter(field => !isStatusField(field));
    const otherPart = otherFields.length ? `Campos por mostrar: ${formatFieldList(otherFields)}` : "";
    return {
      tk: group.tk,
      title: group.title,
      date: group.date,
      link: group.link,
      count: group.count,
      sortDate: group.sortDate,
      summary: [...statusParts, otherPart].filter(Boolean).join(" · ") || "Cambio manual pendiente de aprobación"
    };
  });
}

function getRowValue(row, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias) && String(row[alias] || "").trim() !== "") return String(row[alias]).trim();
  }
  const normalizedAliases = aliases.map(normalizeHeader);
  const foundKey = Object.keys(row).find(key => normalizedAliases.includes(normalizeHeader(key)));
  return foundKey ? String(row[foundKey] || "").trim() : "";
}


document.addEventListener("click", () => {
  Object.values(filters).forEach(filter => filter.element.classList.remove("open"));
  columnsControl.classList.remove("open");
});

initDashboard();
setInterval(initDashboard, AUTO_REFRESH_MS);
