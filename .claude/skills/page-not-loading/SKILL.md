---
name: page-not-loading
description: Use when the owner reports a page of this app will not open, is stuck on a loading or "connection slow" screen, shows a blank or frozen screen, or "ເຂົ້າບໍ່ໄດ້ / ບໍ່ຕິດ / ไม่ติด / เปิดไม่ได้ / ค้าง". Open the live page in a headless browser and read the console error FIRST, before looking at Supabase, Vercel, the network, the cache or the service worker.
---

# A page will not open

## The rule

**Open the live page in a browser and read the console before touching anything else.**

A stuck page is a JavaScript exception until a browser proves otherwise. It is
almost never the cache, the network, the service worker, Supabase or Vercel —
and the owner has said so directly: *"ไม่เกี่ยวกับการโหลดอะไรทั้งนั้น"*.

Do **not** open by asking them to clear the cache, delete the home-screen icon,
reinstall, switch wifi or hard-reload. That wastes their evening, and every one
of those steps also destroys the evidence.

## Do this first

The container's proxy breaks TLS for Playwright, so both flags are required.

```bash
cd /tmp/claude-*/*/scratchpad && timeout 150 node -e "
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--ignore-certificate-errors']});
 const p=await (await b.newContext({ignoreHTTPSErrors:true})).newPage();
 p.on('pageerror',e=>console.log('PAGE ERROR:',e.message));
 p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE:',m.text().slice(0,200)) });
 p.on('response',r=>{ if(r.url().includes('supabase')) console.log(r.status(), r.url().split('?')[0].slice(-40)) });
 await p.goto('https://basicchinesebun.com/staff',{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForTimeout(15000);
 console.log('SCREEN:', (await p.innerText('body')).slice(0,250).replace(/\n+/g,' | '));
 await b.close();
})().catch(e=>console.log('ERR',e.message))
"
```

If `playwright` is not installed: `cd` to the scratchpad and `npm install playwright`
(do not run `npx playwright install` — Chromium is already at the path above).

## Reading the result

| What you see | What it means |
|---|---|
| `PAGE ERROR: <something> is not defined` | **This is the bug.** A JS exception stopped the page mid-load. Fix it. |
| Supabase requests return `200` but the screen still says loading | The fetch worked. Something threw after it. Look for the exception. |
| Supabase requests `failed` / never appear | Now, and only now, look at the network, the key and the project status. |
| Page navigates over and over | A service worker is reloading it. Check `PwaHelper.js`. |

## Why this app hides exceptions as "loading"

Pages gate themselves on a flag that is set at the **end** of a long config
function. Anything that throws partway through leaves the flag false forever,
and the page reports a connection problem it never had.

`src/app/staff/page.js` is the worst case: `loadConfig()` applies ~20 config
keys in a row, then sets `configLoadedRef.current = true`. The PIN gate cannot
render without it, so one bad line anywhere above locks the whole till out on
every device, on every network, while `shop_config` returns 200 in a second.

This has happened. Removing the ລວມ stock box dropped `stockTotal` but left
`setStockTotal(loadedStockTotal)` in `loadConfig`. The till showed
"ການເຊື່ອມຕໍ່ຊ້າ ບໍ່ສາມາດກວດສອບລະຫັດ Staff ໄດ້" for hours while Supabase,
Vercel, the anon key and the deployments all checked out green.

**So: after deleting any state, grep the whole file for its setter.**
`npm run build` will not catch it — the reference is valid JavaScript.

```bash
grep -rn "setThing\|thingState" src/   # must return nothing
```

## Order of investigation

1. Browser console on the live page ← almost always ends here
2. Service worker / navigation loop (`PwaHelper.js`, `public/sw-*.js`)
3. Supabase request status in that same browser run
4. Only then: project status, advisors, Vercel deployments, the anon key

## Telling them what happened

Say plainly which of the two it was: a bug in our code, or something outside it.
If it was ours, say so — they have spent real service time on this and deserve
to know it was not their wifi.
