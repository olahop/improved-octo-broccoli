// Thrift Window for Shops — inventory + intake POC
// Client-only prototype: mock data (data.js), in-memory inventory mutation,
// fake vision-AI analysis and fake "find in store" photo matching.

const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.6 2 4 5.6 4 10c0 5.5 7 11.5 7.3 11.7a1 1 0 001.4 0C13 21.5 20 15.5 20 10c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"/></svg>`,
};

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Router ----------
function go(hash) { location.hash = hash; }
function currentRoute() {
  const h = location.hash.replace("#", "") || "home";
  const [name, param] = h.split("/");
  return { name, param };
}
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => render());

function render() {
  const { name, param } = currentRoute();
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById("item-overlay").classList.remove("open");

  const tabs = ["home", "inventory", "find"];
  if (tabs.includes(name)) {
    document.getElementById("view-" + name).classList.add("active");
    if (name === "home") renderHome();
    if (name === "inventory") renderInventory();
    if (name === "find") renderFind();
  } else if (name === "item") {
    openItemOverlay(param);
  } else {
    go("home");
  }
  window.scrollTo(0, 0);
}

function photoTag(g) {
  return `<img class="photo-img" src="${g.image}" alt="" onerror="this.remove()">`;
}

// ---------- Home / dashboard ----------
function renderHome() {
  const available = INVENTORY.filter((g) => g.status === "available").length;
  const notAvailable = INVENTORY.filter((g) => g.status === "not_available").length;
  const sold = INVENTORY.filter((g) => g.status === "sold");
  const weekAgo = Date.now() - 7 * 86400000;
  const soldThisWeek = sold.filter((g) => g.soldAt && g.soldAt >= weekAgo);
  const revenue = soldThisWeek.reduce((sum, g) => sum + g.priceKr, 0);

  document.getElementById("home-stats").innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${available}</div>
      <div class="stat-label">Til salgs nå</div>
      <div class="stat-trend">${notAvailable} venter på prising</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${soldThisWeek.length}</div>
      <div class="stat-label">Solgt denne uken</div>
      <div class="stat-trend">${revenue} kr omsetning</div>
    </div>
  `;

  const recent = [...INVENTORY].sort((a, b) => b.addedAt - a.addedAt).slice(0, 4);
  document.getElementById("home-recent").innerHTML = recent.map((g) => dashRowHTML(g)).join("");
}

function dashRowHTML(g) {
  return `
  <div class="dash-row" onclick="go('item/${g.id}')">
    <div class="dash-thumb" style="background:${photoBg(g)}">${g.icon}${photoTag(g)}</div>
    <div class="dash-row-info">
      <div class="dash-row-title">${g.brand} — ${g.title}</div>
      <div class="dash-row-meta">${g.priceKr} kr · Hylle ${g.rack}</div>
    </div>
    <span class="status-badge ${g.status}">${statusLabel(g.status)}</span>
  </div>`;
}

function photoBg(g) {
  const hex = colorSwatch(g.colors[0]);
  return `linear-gradient(160deg, ${hex}22, ${hex}44)`;
}

// ---------- Inventory list ----------
let invFilter = { q: "", status: "all" };
function renderInventory() {
  document.getElementById("inv-search-input").value = invFilter.q;
  document.querySelectorAll(".status-tab").forEach((t) => t.classList.toggle("active", t.dataset.status === invFilter.status));

  let list = INVENTORY.filter((g) => {
    if (invFilter.status !== "all" && g.status !== invFilter.status) return false;
    if (invFilter.q && !`${g.brand} ${g.title}`.toLowerCase().includes(invFilter.q.toLowerCase())) return false;
    return true;
  });
  list = [...list].sort((a, b) => b.addedAt - a.addedAt);

  document.getElementById("inv-result-count").textContent = `${list.length} ${list.length === 1 ? "vare" : "varer"}`;
  const wrap = document.getElementById("inv-list");
  const empty = document.getElementById("inv-empty");
  if (!list.length) {
    wrap.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  wrap.innerHTML = list.map((g) => `
    <div class="inv-row" onclick="go('item/${g.id}')">
      <div class="inv-thumb" style="background:${photoBg(g)}">${g.icon}${photoTag(g)}</div>
      <div class="inv-info">
        <div class="inv-brand">${g.brand}</div>
        <div class="inv-title">${g.title}</div>
        <div class="inv-meta-row">
          <span class="status-badge ${g.status}">${statusLabel(g.status)}</span>
          <span>Str. ${g.size}</span>
          <span>Hylle ${g.rack}</span>
        </div>
      </div>
      <div class="inv-price">${g.priceKr} kr</div>
    </div>
  `).join("");
}
function setInvStatus(status) { invFilter.status = status; renderInventory(); }
document.addEventListener("input", (e) => {
  if (e.target.id === "inv-search-input") { invFilter.q = e.target.value; renderInventory(); }
});

// ---------- Item detail / edit ----------
function openItemOverlay(id) {
  const g = invById(id);
  if (!g) { go("inventory"); return; }
  const overlay = document.getElementById("item-overlay");
  overlay.innerHTML = `
    <div class="overlay-topbar">
      <button class="icon-btn" onclick="history.back()">${ICON.back}</button>
      <h2>${g.brand} — ${g.title}</h2>
    </div>
    <div class="detail-photo" style="background:${photoBg(g)}"><span>${g.icon}</span>${photoTag(g)}</div>
    <div class="overlay-body">
      <div class="detail-brand">${g.brand}</div>
      <div class="detail-title">${g.title}</div>
      <div class="detail-price">${g.priceKr} kr</div>
      <div class="tag-row">
        <div class="tag">Str. ${g.size}</div>
        <div class="tag">${conditionLabel(g.condition)}</div>
        <div class="tag">${genderLabel(g.gender)}</div>
        ${g.colors.map((c) => `<div class="tag"><span class="swatch" style="background:${colorSwatch(c)}"></span>${colorLabel(c)}</div>`).join("")}
      </div>

      ${g.note ? `<div class="note-box">${ICON.sparkle} ${g.note}</div><div style="height:16px"></div>` : ""}

      <div class="detail-section">
        <h3>Status</h3>
        <div class="status-action-row">
          <div class="status-opt ${g.status === "available" ? "active available" : ""}" onclick="setItemStatus('${g.id}','available')">Til salgs</div>
          <div class="status-opt ${g.status === "not_available" ? "active not_available" : ""}" onclick="setItemStatus('${g.id}','not_available')">Ikke klar</div>
          <div class="status-opt ${g.status === "sold" ? "active sold" : ""}" onclick="setItemStatus('${g.id}','sold')">Solgt</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Plassering i butikk</h3>
        <div class="rack-box">
          <div class="rack-code">${g.rack}</div>
          <div>
            <div style="font-weight:700; font-size:13.5px;">Hylle ${g.rack}</div>
            <div style="font-size:12px; color:var(--muted); margin-top:2px;">Vises når kunde eller ansatt skanner varen med «Finn vare»</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Materiale</h3>
        <p style="font-size:13.5px; margin:0; color:var(--text)">${g.materials.map((m) => `${m.percentage}% ${m.material}`).join(", ")}</p>
      </div>

      <div class="detail-section">
        <h3>Lagt til</h3>
        <p style="font-size:13.5px; margin:0; color:var(--muted)">${new Date(g.addedAt).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
    </div>
  `;
  overlay.classList.add("open");
  overlay.scrollTop = 0;
}
function setItemStatus(id, status) {
  const g = invById(id);
  g.status = status;
  if (status === "sold" && !g.soldAt) g.soldAt = Date.now();
  showToast(`Status endret til «${statusLabel(status)}»`);
  openItemOverlay(id);
}

// ============================================================
// ADD GARMENT — capture wizard
// ============================================================
let wizard = { photos: [], step: 1, ai: null, form: null };

function openAddWizard() {
  wizard = { photos: [], step: 1, ai: null, form: null };
  renderWizard();
  document.getElementById("wizard-overlay").classList.add("open");
}
function closeWizard() {
  document.getElementById("wizard-overlay").classList.remove("open");
}

function renderWizard() {
  const overlay = document.getElementById("wizard-overlay");
  overlay.innerHTML = `
    <div class="overlay-topbar">
      <button class="icon-btn" onclick="closeWizard()">${ICON.close}</button>
      <h2>Legg til vare</h2>
    </div>
    <div class="wizard-steps">
      <div class="wizard-step ${wizard.step >= 1 ? "done" : ""}"></div>
      <div class="wizard-step ${wizard.step >= 2 ? "done" : ""}"></div>
      <div class="wizard-step ${wizard.step >= 3 ? "done" : ""}"></div>
    </div>
    <div id="wizard-body"></div>
  `;
  const body = document.getElementById("wizard-body");
  if (wizard.step === 1) renderWizardPhotos(body);
  else if (wizard.step === 2) renderWizardAnalyzing(body);
  else renderWizardForm(body);
}

function renderWizardPhotos(body) {
  const slots = [0, 1, 2, 3];
  body.innerHTML = `
    <div class="overlay-body">
      <p style="font-size:13.5px; color:var(--muted); margin:0 0 16px;">Ta 3–4 bilder av plagget — forfra, bakfra og eventuelle merkelapper eller skader.</p>
      <div class="photo-grid">
        ${slots.map((i) => photoSlotHTML(i)).join("")}
      </div>
    </div>
    <div class="wizard-foot">
      <button class="btn btn-primary btn-block" id="wizard-continue" ${wizard.photos.length < 2 ? "disabled" : ""} onclick="startAnalyzing()">
        Analyser bilder ${wizard.photos.length ? `(${wizard.photos.length})` : ""}
      </button>
    </div>
  `;
}
function photoSlotHTML(i) {
  const photo = wizard.photos[i];
  if (photo) {
    return `
    <div class="photo-slot filled">
      <img src="${photo}" alt="">
      <div class="remove-x" onclick="removeWizardPhoto(${i})">${ICON.close}</div>
    </div>`;
  }
  return `
  <div class="photo-slot">
    <span class="fill-emoji">${ICON.camera}</span>
    <span>Bilde ${i + 1}</span>
    <input type="file" accept="image/*" capture="environment" onchange="onWizardPhoto(event, ${i})">
  </div>`;
}
function onWizardPhoto(e, i) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    wizard.photos[i] = reader.result;
    renderWizard();
  };
  reader.readAsDataURL(file);
}
function removeWizardPhoto(i) {
  wizard.photos[i] = null;
  wizard.photos = wizard.photos.filter((p) => p);
  renderWizard();
}

function startAnalyzing() {
  wizard.step = 2;
  renderWizard();
  setTimeout(() => {
    wizard.ai = fakeAnalyze();
    wizard.form = { ...wizard.ai, priceKr: wizard.ai.suggestedPriceKr };
    wizard.step = 3;
    renderWizard();
  }, 1600);
}
function renderWizardAnalyzing(body) {
  body.innerHTML = `
    <div class="analyzing">
      <div class="spinner"></div>
      <h3>Analyserer bildene …</h3>
      <p>KI-modellen kjenner igjen merke, kategori, farge og materiale, og fyller ut skjemaet automatisk.</p>
    </div>
  `;
}

function renderWizardForm(body) {
  const f = wizard.form;
  body.innerHTML = `
    <div class="overlay-body">
      <div class="ai-banner">${ICON.sparkle} KI-forslag basert på bildene — sjekk og rett før publisering.</div>

      <div class="form-row">
        <div class="form-group">
          <label>Merke</label>
          <input type="text" id="f-brand" value="${f.brand}">
        </div>
        <div class="form-group">
          <label>Størrelse</label>
          <input type="text" id="f-size" value="${f.size}">
        </div>
      </div>

      <div class="form-group">
        <label>Tittel</label>
        <input type="text" id="f-title" value="${f.title}">
      </div>

      <div class="form-group">
        <label>Kategori</label>
        <div class="filter-options" id="f-category">
          ${CATEGORIES.map((c) => `<div class="opt-pill ${f.category === c.id ? "active" : ""}" onclick="setWizardField('category','${c.id}')">${c.label}</div>`).join("")}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Kjønn</label>
          <div class="filter-options">
            ${GENDERS.map((g) => `<div class="opt-pill ${f.gender === g.id ? "active" : ""}" onclick="setWizardField('gender','${g.id}')">${g.label}</div>`).join("")}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Tilstand</label>
        <div class="filter-options">
          ${CONDITIONS.map((c) => `<div class="opt-pill ${f.condition === c.id ? "active" : ""}" onclick="setWizardField('condition','${c.id}')">${c.label}</div>`).join("")}
        </div>
      </div>

      <div class="form-group">
        <label>Farge</label>
        <div class="filter-options">
          ${COLORS.map((c) => `<div class="opt-pill color-pill ${f.colors.includes(c.id) ? "active" : ""}" onclick="toggleWizardColor('${c.id}')"><span class="swatch" style="background:${c.hex}"></span>${c.label}</div>`).join("")}
        </div>
      </div>

      <div class="form-group">
        <label>Materiale</label>
        <input type="text" id="f-materials" value="${f.materials.map((m) => `${m.percentage}% ${m.material}`).join(", ")}">
      </div>

      <div class="form-group">
        <label>Pris</label>
        <div class="price-input-wrap">
          <input type="number" id="f-price" value="${f.priceKr}">
          <span class="suffix">kr</span>
        </div>
        <div class="suggested-price-hint">KI foreslo ${f.suggestedPriceKr} kr basert på merke og tilstand</div>
      </div>

      <div class="form-group">
        <label>Notat (synlig for ansatte)</label>
        <textarea id="f-note" placeholder="F.eks. flekker, skader, manglende knapper …">${f.note || ""}</textarea>
      </div>
    </div>
    <div class="wizard-foot">
      <button class="btn btn-secondary" onclick="wizard.step=1; renderWizard()">Tilbake</button>
      <button class="btn btn-primary" onclick="publishWizard()">Publiser vare</button>
    </div>
  `;
}
function setWizardField(key, value) {
  wizard.form[key] = value;
  renderWizardForm(document.getElementById("wizard-body"));
}
function toggleWizardColor(id) {
  const i = wizard.form.colors.indexOf(id);
  if (i === -1) wizard.form.colors.push(id); else wizard.form.colors.splice(i, 1);
  renderWizardForm(document.getElementById("wizard-body"));
}
function publishWizard() {
  const f = wizard.form;
  const brand = document.getElementById("f-brand").value.trim() || "Ukjent merke";
  const title = document.getElementById("f-title").value.trim() || "Uten tittel";
  const size = document.getElementById("f-size").value.trim() || "-";
  const priceKr = Number(document.getElementById("f-price").value) || 0;
  const note = document.getElementById("f-note").value.trim();
  const materialsText = document.getElementById("f-materials").value.trim();

  const newItem = {
    id: "inv" + (INVENTORY.length + 1) + "-" + Date.now(),
    title, brand, size, priceKr, note,
    category: f.category, gender: f.gender, condition: f.condition, colors: f.colors,
    materials: [{ material: materialsText || "Ukjent", percentage: 100 }],
    status: "not_available",
    rack: RACKS[Math.floor(Math.random() * RACKS.length)],
    addedAt: Date.now(),
    soldAt: null,
    icon: ICONS[f.category] || "🏷️",
    image: wizard.photos[0] || "images/placeholder-none.jpg",
  };
  INVENTORY.unshift(newItem);
  closeWizard();
  showToast("Vare publisert — klar for prising i lager");
  go("item/" + newItem.id);
}

// ============================================================
// FIND GARMENT — photo match flow
// ============================================================
let findState = { mode: "idle", photo: null, result: null, poolSold: false };

function renderFind() {
  const overlay = document.getElementById("view-find");
  const poolLabel = findState.poolSold ? "Søker i solgte varer" : "Søker i varer til salgs";
  if (findState.mode === "idle") {
    overlay.innerHTML = `
      <div class="view-header">
        <h1>Finn vare</h1>
        <p>Ta bilde av en vare på stativet for å slå opp pris og detaljer</p>
      </div>
      <div class="find-scan" onclick="captureFindPhoto()">
        <span class="scan-emoji">📷</span>
        <div class="scan-frame"></div>
      </div>
      <div style="padding:0 18px;">
        <div class="filter-options" style="justify-content:center; margin-bottom:16px;">
          <div class="opt-pill ${!findState.poolSold ? "active" : ""}" onclick="setFindPool(false)">Varer til salgs</div>
          <div class="opt-pill ${findState.poolSold ? "active" : ""}" onclick="setFindPool(true)">Solgte varer (historikk)</div>
        </div>
        <input type="file" accept="image/*" capture="environment" id="find-file" style="display:none" onchange="onFindPhoto(event)">
        <button class="btn btn-primary btn-block" onclick="document.getElementById('find-file').click()">${ICON.camera} Ta bilde av varen</button>
      </div>
    `;
  } else if (findState.mode === "scanning") {
    overlay.innerHTML = `
      <div class="view-header"><h1>Finn vare</h1><p>${poolLabel} …</p></div>
      <div class="find-scan">
        <img src="${findState.photo}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.6;">
        <div class="scan-frame"></div>
        <div class="scan-line"></div>
      </div>
      <div class="analyzing" style="padding-top:10px">
        <p>Sammenligner mot ${findState.poolSold ? "solgte varer" : "varer i butikken"} …</p>
      </div>
    `;
  } else if (findState.mode === "result") {
    const g = findState.result;
    overlay.innerHTML = `
      <div class="view-header"><h1>Treff funnet</h1><p>${poolLabel}</p></div>
      <div class="match-card">
        <div class="inv-thumb" style="width:64px; height:78px; background:${photoBg(g)}">${g.icon}${photoTag(g)}</div>
        <div style="flex:1; min-width:0;">
          <div class="match-confidence">${ICON.check} 94 % treffsikkerhet</div>
          <div class="inv-brand">${g.brand}</div>
          <div class="inv-title">${g.title}</div>
          <div class="inv-meta-row" style="margin-bottom:6px;">
            <span class="status-badge ${g.status}">${statusLabel(g.status)}</span>
            <span>Str. ${g.size}</span>
          </div>
          <div class="inv-price">${g.priceKr} kr</div>
        </div>
      </div>
      <div style="padding:16px 18px 0; display:flex; flex-direction:column; gap:10px;">
        <div class="rack-box">
          <div class="rack-code">${g.rack}</div>
          <div>
            <div style="font-weight:700; font-size:13.5px;">Hylle ${g.rack}</div>
            <div style="font-size:12px; color:var(--muted); margin-top:2px;">${g.status === "sold" ? "Solgt — ikke lenger i butikk" : "Varen finnes her akkurat nå"}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-block" onclick="go('item/${g.id}')">Se full detalj</button>
        ${g.status !== "sold" ? `<button class="btn btn-danger btn-block" onclick="setItemStatus('${g.id}','sold'); resetFind()">Merk som solgt</button>` : ""}
        <button class="btn btn-ghost btn-block" style="color:var(--muted)" onclick="resetFind()">Søk på nytt</button>
      </div>
    `;
  }
}
function setFindPool(sold) { findState.poolSold = sold; renderFind(); }
function onFindPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    findState.mode = "scanning";
    findState.photo = reader.result;
    renderFind();
    setTimeout(() => {
      const pool = INVENTORY.filter((g) => (findState.poolSold ? g.status === "sold" : g.status !== "sold"));
      findState.result = fakeMatch(pool);
      findState.mode = "result";
      renderFind();
    }, 1600);
  };
  reader.readAsDataURL(file);
}
function captureFindPhoto() { document.getElementById("find-file").click(); }
function resetFind() { findState = { mode: "idle", photo: null, result: null, poolSold: findState.poolSold }; renderFind(); }
