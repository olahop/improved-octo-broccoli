// Mock data + AI-analysis simulation for the Thrift Window shop-side POC.
// Mirrors the Garment shape from the thrift-window API (see ../thrift-window).

const CATEGORIES = [
  { id: "jakker", label: "Jakker" },
  { id: "gensere", label: "Gensere & strikk" },
  { id: "bukser", label: "Bukser & jeans" },
  { id: "skjorter", label: "Skjorter & topper" },
  { id: "kjoler", label: "Kjoler" },
  { id: "sko", label: "Sko" },
];

const CONDITIONS = [
  { id: "as_new", label: "Som ny" },
  { id: "very_good", label: "Svært god" },
  { id: "good", label: "God" },
  { id: "fair", label: "Brukt, fin stand" },
];

const COLORS = [
  { id: "black", label: "Sort", hex: "#232020" },
  { id: "white", label: "Hvit", hex: "#f4f1ec" },
  { id: "beige", label: "Beige", hex: "#d8c3a0" },
  { id: "brown", label: "Brun", hex: "#6b4a30" },
  { id: "navy", label: "Marineblå", hex: "#233258" },
  { id: "blue", label: "Blå", hex: "#3c6ea5" },
  { id: "green", label: "Grønn", hex: "#4c6b4f" },
  { id: "red", label: "Rød", hex: "#9c3b34" },
  { id: "mustard", label: "Sennep", hex: "#c99a2e" },
  { id: "gray", label: "Grå", hex: "#8a857e" },
];

const GENDERS = [
  { id: "female", label: "Dame" },
  { id: "male", label: "Herre" },
  { id: "any", label: "Unisex" },
];

const MATERIALS = ["Bomull", "Ull", "Polyester", "Lin", "Silke", "Skinn", "Nylon", "Viskose", "Kashmir", "Denim"];

const ICONS = {
  jakker: "🧥", gensere: "🧶", bukser: "👖", skjorter: "👕", kjoler: "👗", sko: "👟",
};

const RACKS = ["A1", "A2", "A3", "B1", "B2", "C1", "C2", "D1"];

function seedRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const INVENTORY_SEED = [
  ["Barbour", "jakker", "Waxjakke Beadnell", "female", ["green"], 1590, "available"],
  ["Levi's", "bukser", "501 Original straight jeans", "male", ["blue"], 590, "available"],
  ["Acne Studios", "gensere", "Ribbestrikket rullekrage", "female", ["beige"], 890, "available"],
  ["Carhartt WIP", "jakker", "Detroit jacket canvas", "any", ["brown"], 1290, "sold"],
  ["Filippa K", "skjorter", "Silkeskjorte", "female", ["white"], 490, "available"],
  ["Ganni", "kjoler", "Printet midi-kjole", "female", ["red"], 790, "not_available"],
  ["Nike", "sko", "Air Max 90", "any", ["white"], 690, "available"],
  ["Norse Projects", "gensere", "Merinogenser", "male", ["navy"], 750, "sold"],
  ["Levi's", "jakker", "Trucker jacket", "female", ["blue"], 690, "available"],
  ["Church's", "sko", "Loafers i skinn", "male", ["brown"], 1490, "available"],
  ["COS", "bukser", "Vide uldbukser", "female", ["gray"], 590, "not_available"],
  ["Vagabond", "sko", "Chelsea boots", "female", ["black"], 890, "available"],
  ["Weekday", "skjorter", "Oversized bomullsskjorte", "any", ["white"], 350, "sold"],
  ["Wood Wood", "gensere", "Bomullsgenser med logo", "male", ["gray"], 590, "available"],
  ["Zara", "kjoler", "Blomstrete sommerkjole", "female", ["mustard"], 350, "available"],
  ["Stutterheim", "jakker", "Regnfrakk", "any", ["black"], 990, "available"],
  ["Holzweiler", "skjorter", "Ternet flanellskjorte", "male", ["red"], 490, "not_available"],
  ["Diesel", "bukser", "Baggy denim", "male", ["black"], 690, "sold"],
  ["Samsøe Samsøe", "gensere", "Oversized hettegenser", "female", ["beige"], 490, "available"],
  ["Common Projects", "sko", "Achilles low", "any", ["white"], 1290, "available"],
];

const INVENTORY = INVENTORY_SEED.map((row, i) => {
  const [brand, category, title, gender, colors, priceKr, status] = row;
  const rand = seedRandom(i * 53 + 7);
  const condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)].id;
  const sizePool = category === "sko"
    ? ["36", "37", "38", "39", "40", "41", "42", "43", "44"]
    : ["XS", "S", "M", "L", "XL"];
  const size = sizePool[Math.floor(rand() * sizePool.length)];
  const daysAgo = Math.floor(rand() * 30);
  const addedAt = Date.now() - daysAgo * 86400000;
  const rack = RACKS[Math.floor(rand() * RACKS.length)];
  // Simulated customer-app engagement (views/favorites this week) — stands
  // in for real analytics from the showroom app. Only published items
  // (available/sold) are visible to customers, so backroom items get none.
  const isVisible = status !== "not_available";
  const views = isVisible ? Math.floor(rand() * 140) : 0;
  const favorites = isVisible ? Math.floor(rand() * views * 0.25) : 0;
  return {
    id: "inv" + (i + 1),
    title, brand, category, gender, size, condition, colors,
    materials: [{ material: MATERIALS[Math.floor(rand() * MATERIALS.length)], percentage: 100 }],
    priceKr, status,
    rack,
    addedAt,
    soldAt: status === "sold" ? addedAt + Math.floor(rand() * 10) * 86400000 : null,
    note: rand() > 0.8 ? "Lite slitasje ved venstre lomme." : "",
    icon: ICONS[category] || "🏷️",
    views, favorites,
    // Drop a photo at images/<id>.jpg (e.g. images/inv1.jpg) to replace the
    // placeholder — it's picked up automatically, no code changes needed.
    image: "images/inv" + (i + 1) + ".jpg",
  };
});

function invById(id) { return INVENTORY.find((g) => g.id === id); }
function categoryLabel(id) { return (CATEGORIES.find((c) => c.id === id) || {}).label || id; }
function conditionLabel(id) { return (CONDITIONS.find((c) => c.id === id) || {}).label || id; }
function genderLabel(id) { return (GENDERS.find((g) => g.id === id) || {}).label || id; }
function colorLabel(id) { return (COLORS.find((c) => c.id === id) || {}).label || id; }
function colorSwatch(id) { return (COLORS.find((c) => c.id === id) || {}).hex || "#ccc"; }
function statusLabel(id) {
  return { available: "Til salgs", not_available: "Ikke klar", sold: "Solgt" }[id] || id;
}

// ---------- Trends ----------
// Demand score blends views and favorites (weighted higher, since a
// favorite is a stronger signal) from the simulated customer-app activity.
function demandScore(g) { return g.views + g.favorites * 3; }

// Ranked once at load from the (deterministic) mock views/favorites, plus a
// cosmetic week-over-week change figure standing in for real analytics.
const CATEGORY_TRENDS = CATEGORIES.map((c, idx) => {
  const items = INVENTORY.filter((g) => g.category === c.id && g.status !== "not_available");
  const score = items.reduce((sum, g) => sum + demandScore(g), 0);
  const rand = seedRandom(idx * 91 + 5);
  const changePct = Math.round(rand() * 65 - 15); // -15%..+50%
  return { id: c.id, label: c.label, score, changePct, itemCount: items.length };
}).sort((a, b) => b.score - a.score);

function topTrendingItems(n) {
  return [...INVENTORY]
    .filter((g) => g.status === "available")
    .sort((a, b) => demandScore(b) - demandScore(a))
    .slice(0, n);
}

// Backroom (not_available) items in the hottest categories — candidates to
// price and put out, since customer demand for that category is already high.
function backroomPriorityItems() {
  const hotIds = CATEGORY_TRENDS.slice(0, 3).map((c) => c.id);
  return INVENTORY
    .filter((g) => g.status === "not_available" && hotIds.includes(g.category))
    .sort((a, b) => hotIds.indexOf(a.category) - hotIds.indexOf(b.category) || a.addedAt - b.addedAt);
}

function categoryAvgPrice(categoryId) {
  const items = INVENTORY.filter((g) => g.category === categoryId && g.status !== "not_available");
  if (!items.length) return null;
  return Math.round(items.reduce((s, g) => s + g.priceKr, 0) / items.length);
}

// Simple heuristic: cheap + in demand → consider raising the price;
// pricey + little interest → consider a cut. Stands in for real
// price-elasticity analytics.
function priceSuggestion(g) {
  const avg = categoryAvgPrice(g.category);
  if (!avg) return null;
  const demand = demandScore(g);
  if (g.priceKr < avg * 0.75 && demand > 40) return { type: "increase", avg };
  if (g.priceKr > avg * 1.3 && demand < 15) return { type: "decrease", avg };
  return { type: "ok", avg };
}

// ---------- Fake "vision AI" analysis ----------
// A handful of plausible extraction results the capture wizard cycles through,
// standing in for a real POST /garments/analyze call to a vision LLM.
const AI_MOCK_RESULTS = [
  { brand: "Filippa K", category: "skjorter", title: "Bomullsskjorte, slim fit", gender: "female", condition: "very_good", size: "S", colors: ["white"], materials: [{ material: "Bomull", percentage: 100 }], note: "Lett gulning innerst i krage.", suggestedPriceKr: 390 },
  { brand: "Norrøna", category: "jakker", title: "Fleecejakke", gender: "any", condition: "good", size: "M", colors: ["navy"], materials: [{ material: "Polyester", percentage: 100 }], note: "", suggestedPriceKr: 590 },
  { brand: "Levi's", category: "bukser", title: "505 Regular jeans", gender: "male", condition: "very_good", size: "32/34", colors: ["blue"], materials: [{ material: "Denim", percentage: 98 }, { material: "Elastan", percentage: 2 }], note: "Lett slitt ved bunn av bein.", suggestedPriceKr: 490 },
  { brand: "Ganni", category: "kjoler", title: "Printet sommerkjole", gender: "female", condition: "as_new", size: "36", colors: ["mustard"], materials: [{ material: "Viskose", percentage: 100 }], note: "", suggestedPriceKr: 690 },
  { brand: "Ukjent merke", category: "gensere", title: "Strikkegenser, kabelstrikk", gender: "any", condition: "good", size: "L", colors: ["beige"], materials: [{ material: "Ull", percentage: 80 }, { material: "Polyamid", percentage: 20 }], note: "En liten hull nær venstre albue — bør nevnes ved salg.", suggestedPriceKr: 350 },
  { brand: "New Balance", category: "sko", title: "574 sneakers", gender: "any", condition: "very_good", size: "42", colors: ["gray"], materials: [{ material: "Skinn", percentage: 40 }, { material: "Nylon", percentage: 60 }], note: "", suggestedPriceKr: 590 },
];

function fakeAnalyze() {
  return AI_MOCK_RESULTS[Math.floor(Math.random() * AI_MOCK_RESULTS.length)];
}

function fakeMatch(pool) {
  const candidates = pool.length ? pool : INVENTORY;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
