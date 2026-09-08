# BCB POS — ໂປຣແກຣມສຳຮອງ (offline POS)

ໂປຣແກຣມຂາຍໜ້າຮ້ານແບບຕິດຕັ້ງລົງເຄື່ອງ ສຳລັບ Basic Chinese Bun.
ຂໍ້ມູນທັງໝົດຢູ່ໃນເຄື່ອງ — **ບໍ່ໃຊ້ອິນເຕີເນັດເລີຍ**. ເປີດແລ້ວຂາຍໄດ້ທັນທີ.

An installed, offline point-of-sale for when the network, the main system, or
Supabase is down. The website at basicchinesebun.com stays the main system;
this is the spare wheel — open it and sell, with no setup and no connection.

The one exception is the kitchen screen, which is a separate device and talks
to the till over the shop's Wi-Fi (a working router, no internet). If the
router is down too, the kitchen screen stops updating and **the till carries on
selling, printing and opening the drawer as normal**.

---

## Running it

```bash
npm install          # rebuilds better-sqlite3 for Electron automatically
npm start            # build the UI and open the program
npm run dev          # UI dev server + Electron with hot reload
npm test             # 93 checks across database, bags, receipt and kitchen
npm run dist         # Windows installer into release/
```

`npm install` compiles two native modules against Electron. On Windows —
the target — both ship prebuilt binaries and nothing is compiled. On Linux,
building `usb` needs the udev headers first (`apt install libudev-dev`);
without them the install step fails there, though the program itself treats a
missing `usb` module the same as a missing printer and still sells and saves.

The first time Windows runs the installer it shows **"Windows protected your
PC"**, because the program is not signed with a paid certificate. Click **More
info → Run anyway**. This happens once, at install.

## Works with no hardware at all

Nothing here assumes a printer, a drawer, a second screen or a network. On a
plain laptop the program installs and sells normally:

| Missing | What happens |
|---|---|
| No printer | Sells and saves as usual; the receipt says `ບໍ່ພົບເຄື່ອງພິມ`, no crash |
| No drawer | The kick command goes nowhere; no repeated nagging |
| One screen | No customer window is opened — there is a button for it in Settings |
| No Wi-Fi | The kitchen section is simply off; everything else is unaffected |

So menus, prices and photos can be set up at home and the database file copied
onto the till — and if the till itself dies, a laptop takes over the same day.

## Hardware

Built for the shop's YJ-F8 (Windows 10, ICOD 80mm thermal printer on USB, cash
drawer on the printer's RJ11 port), but not tied to it. Printers are found by
their USB printer class, not by a hardcoded model or vendor id, so any ESC/POS
printer works. Paper width is switchable between 58mm and 80mm.

```
computer ──USB──> receipt printer ──RJ11──> cash drawer
```

The drawer is not connected to the computer at all — it hangs off the `DK` /
`Cash Drawer` socket on the back of the printer, which powers it and sends the
open pulse. If you buy a new pair, tell the shop which printer the drawer is
for: a 12V drawer on a 24V printer (or the reverse) will not open.

## What is inside

```
electron/
  main.js            windows, screens, IPC, image import, quit-time backup
  preload.js         the only bridge the UI gets — a fixed list of calls
  db.js              SQLite schema and every query, all errors surfaced
  printer.js         ESC/POS over libusb: discovery, printing, drawer pulses
  kitchen-server.js  express + WebSocket on :8080 for the kitchen screen
  backup.js          daily snapshots, 30 kept, copied to USB when present
kitchen/index.html   the kitchen screen, plain HTML, no build step
src/                 React UI: sell, orders, reports, settings, customer display
test/                the suites behind `npm test`
```

### Printing

The receipt is drawn to a canvas and sent as an ESC/POS raster image, because a
thermal head cannot render Lao from its own code pages. The rendering, the
Otsu logo binarisation, and the four drawer pulses are carried over from the
web build, where they were proven against the shop's actual printer — the same
bytes, over a different transport.

The printer is reached through libusb (`usb`). The shop's printer currently has
the WinUSB driver bound to it, so anything going through the Windows spooler
would need that unbound first — the riskiest step of the original install, and
one worth not repeating. libusb talks to the device as it stands today.

### Backups

Every time the program closes it copies the database to
`Documents\BCB-POS-Backup\`, named by date, keeping the last 30 — and onto any
USB stick plugged in at the time. It never blocks or delays shutdown; a failure
is recorded and reported the next time the program opens, and after seven days
without a successful backup the login screen says so.

> **Before handing the machine to a repair shop, copy
> `Documents\BCB-POS-Backup\` off it first.** Reinstalling Windows is the most
> common way a shop loses its sales history.

### Staff codes

Each person has their own numeric code and every bill records who sold it.
Codes live in the `staff` table and are editable in Settings — none are
compiled into the program. The owner's default is `888888`; owners can reach
Settings, profit figures and staff management, and staff cannot.

## Bringing menus over from the website

Settings → ຂໍ້ມູນ & ສຳຮອງ → ນຳເຂົ້າເມນູຈາກເວັບ takes the JSON the website's
**Export JSON** button produces and sets up menus, prices, costs, photos, the
logo and the payment QR in one go. Stock is left alone — the till knows its own
stock and the website cannot while the network is down.

Sales made offline are not pushed back up. Export CSV (UTF-8 BOM, so Excel
reads Lao correctly) and adjust the main system by hand.

## Not included, on purpose

Customer QR self-ordering, online preorders and slip checking, AI slip
verification, multi-branch, customer chat, audit logs, low-stock alerts, and
editing a bill with balance tracking — cancel and re-sell instead. Also gone is
the web build's second "pack bags first" mode: two modes confused staff, so
there is one.

Two things here that the website does not have: splitting an order evenly into
N bags, and a warning when the bags do not add up to what was sold — the web
build let items quietly disappear off the printed breakdown.

## Later

A separate queue board on a third screen (`current_queue` is already written to
settings on every call, so only the screen itself is left to build), and pushing
offline sales back to the website once the network returns (`synced_at` is
already on the `orders` table).
