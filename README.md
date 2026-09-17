# Thrift Window for shops — inventory & intake (POC)

A clickable, mobile-shaped prototype of the shop-facing side of Thrift
Window: the app staff use both to manage inventory and to feed the customer
showroom (`../thrift-window-user`). No backend, no accounts — static
HTML/CSS/JS with mock data and in-memory state, so it's realistic to click
through without a build step. Assumes a single logged-in shop the whole way
through (no login flow).

Open `index.html` directly in a browser. On an actual phone, the "Legg til
vare" and "Finn vare" camera steps use a native file picker
(`<input type=file capture>`), so tapping them opens the real camera.

## What's here

- **Hjem** — daily overview: items for sale, items sold this week, revenue.
- **Lager** — the full inventory list, filterable by status (til salgs /
  ikke klar / solgt) and searchable.
- **Legg til vare** — the intake flow this product centers on: take 3–4
  photos → a simulated ~1.5s "vision AI analysis" (standing in for the real
  `POST /garments/analyze` call in `../thrift-window/api`) prefills brand,
  category, condition, size, color, material and a suggested price → staff
  reviews/edits → sets status and publishes. New items land in Lager with
  status "Ikke klar" until priced/confirmed.
- **Finn vare** — photograph a garment on the rack to look up its price,
  status and shelf location, or mark it sold on the spot. A toggle switches
  the search pool to *sold* items, for the "find something we sold before"
  case (returns/customer questions).

## Photos

Garments render as a color-tinted placeholder with a category emoji by
default. To use real photos for the seed inventory, drop a file at:

```
images/inv1.jpg
images/inv2.jpg
...
```

matching an item's `id` in `data.js` (`inv1`…`inv20`). Missing files fail
silently and fall back to the placeholder. Items added through the "Legg
til vare" wizard use the actual photo you capture, no setup needed.

## Simplifications vs. the real product

- No login, no multi-shop switching.
- The "vision AI" and "find match" steps pick from a small set of
  plausible mock results/matches rather than actually inspecting the photo.
- New items and status changes live only in memory for the session (not
  persisted across a page reload) — good enough to demo the flow end to
  end, not a substitute for the real DynamoDB-backed API.
- Material composition is one free-text field here rather than the
  structured per-component list the real API models.
