# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Build and export static HTML to /out
npm run lint     # Run Next.js ESLint
```

No test suite is configured.

## Architecture

**BCB POS** is a bilingual (Lao/English) Point-of-Sale system for a bun restaurant chain ("Basic Chinese Bun"). It is a Next.js App Router app exported as static HTML (via `output: 'export'` in [next.config.js](next.config.js)), deployed to Netlify from the `/out` directory.

All state is managed with React hooks only — no Redux or Zustand. The Supabase client in [src/lib/supabase.js](src/lib/supabase.js) is the sole backend interface, used directly inside page components.

### Three user flows (one page each)

| Route | File | Purpose |
|---|---|---|
| `/order` | [src/app/order/page.js](src/app/order/page.js) | Walk-in counter POS — 4-step wizard |
| `/preorder` | [src/app/preorder/page.js](src/app/preorder/page.js) | Online pre-order with payment slip upload — 6-step wizard |
| `/staff` | [src/app/staff/page.js](src/app/staff/page.js) | Staff dashboard: order management, inventory, sales reports, config |

Netlify redirects `/` → `/order` (see [netlify.toml](netlify.toml)).

### Supabase schema

Two tables drive the entire app:

- **`orders`** — all orders (walk-in and online). Key fields: `qnum`, `type` (`walkin`/`online`), `status` (`pending`/`confirmed`/`rejected`/`done`), `items` (JSON), `total`, `slip_url`, `done`, `cancelled`, `done_at`
- **`shop_config`** — key-value store for all shop settings. Keys include: `menus`, `prices`, `stock_total`, `stock_shop`, `stock_online`, `menu_images`, `qr_image`, `shop_info`, `settings`, `branches`, `next_queue`

Storage bucket **`bcb-uploads`** holds menu images, QR codes, payment slips, and logos.

Real-time order updates and config sync use Supabase Postgres Changes subscriptions with a 15-second polling fallback.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

These go in `.env.local` (not committed). Both are public-safe frontend keys.

### Styling

Global CSS variables and utility classes (`.btn-primary`, `.btn-outline`, `.card`, `.input-field`, `.tag`) are defined in [src/app/globals.css](src/app/globals.css). Custom Tailwind colors (`brown`, `cream`, `warm`, `gray`) and font families (Noto Sans Lao, Playfair Display) are in [tailwind.config.js](tailwind.config.js). Pages use a hybrid of Tailwind classes and inline `style` props.

### Notable staff features

- Bluetooth ESC/POS thermal printer support alongside browser `print()`
- Web Speech Synthesis for queue number announcements
- JSON export/import for full data backups
- Daily/custom-range sales reports with per-menu breakdown
