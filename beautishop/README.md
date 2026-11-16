# 玉灵膏 order site (beautishop)

เว็บสั่ง 玉灵膏 แยกจากระบบร้านซาลาเปาทั้งหมด แอป Next.js ของร้านไม่ได้ใช้ไฟล์ในโฟลเดอร์นี้เลย

- Customers: https://www.basicchinesebun.com/beautishop
- Owner: https://www.basicchinesebun.com/beautishop/admin
- `/beautyshop` redirects to `/beautishop`.

## How it runs

- Its own Vercel project, `beautishop` (static HTML + Node functions in `api/`, region sin1).
- Menu, orders, slips and images live in that project's Vercel Blob store.
  It never uses the shop's Supabase.
- Env vars on the `beautishop` project: `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`.
- The shop domain reaches it through the `rewrites()` in the repo-root
  `next.config.js`: `/beautishop/*` → `https://beautishop-kohl.vercel.app/beautishop/*`.
  `vercel.json` here maps `/beautishop/*` back onto this site's own files,
  so the site also works directly on beautishop-kohl.vercel.app.
- Every path the pages call, and every image URL the admin saves, starts with
  `/beautishop/`. Keep it that way: a bare `/api/...` on the shop domain goes to
  the bun shop app instead.

## Stock

- `stock.json` in the Blob store holds `{ menuId: count }`. A menu item with no
  entry has no limit.
- Admin → เมนู: − / + change the number at once and save when you stop tapping;
  typing a number sets it; an empty box means no limit. Stock saves on its own,
  separately from "บันทึกเมนู".
- An order takes its counted items out of stock when it is placed. The write is
  conditional on the file's ETag, so two orders can't both take the last one.
  Orders remember which items were counted (`stocked: true`); cancelling an order
  puts those back, un-cancelling takes them out again.
- The customer page shows "ເຫຼືອ N" / "ໝົດແລ້ວ" and won't let the cart go past
  what is left.

## Deploying

Git does not deploy this folder. Pushing the repo only rebuilds the bun shop app.
Deploy from this folder to the `beautishop` project, e.g. `vercel deploy --prod`
after `vercel link` to `basicchinesebuns-projects/beautishop`.
