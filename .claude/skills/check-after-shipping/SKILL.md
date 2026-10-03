---
name: check-after-shipping
description: Use after adding or changing any feature in this app, before telling the owner it is done. Re-check the screens for layout damage, broken arithmetic, wrong text and features the change quietly stood on. The owner has asked for this every time — "ตรวจสอบใหม่ทุกครั้งว่ามันจะไปทับหรือว่ามีปัญหาตรงไหนไหม".
---

# Check the change did not break something else

This is a till. A bug here is a queue of customers and a shop that cannot
take money. "It builds" is not the same as "it works", and the bugs that
have actually hurt this shop were never in the thing being built — they were
in what the change happened to stand on.

Run this before saying a feature is done.

## The rule that matters most

**Drive the real screen, do not reason about the code.**

Every serious bug in this app was found by opening it and looking, and missed
by reading the diff. A till frozen mid-payment, a shelf wiped by a sync that
should not have run, stock leased for one menu out of eighteen — all of them
built cleanly and read correctly.

## 1. Build, then look

```bash
npm run build          # a clean build is the floor, not the test
```

If the build fails with `next/font/google queries have exactly one entry`,
that is a stale cache: `rm -rf .next` and build again. It is not your change.

## 2. Open the screens

```bash
cd /tmp/claude-*/*/*/scratchpad && timeout 300 node -e "
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--ignore-certificate-errors']});
 for (const [page,size] of [['staff',{width:430,height:900}],['staff',{width:1280,height:800}],['kitchen',{width:1280,height:800}],['display',{width:1280,height:800}],['queue',{width:1280,height:800}]]) {
  const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:size});
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  p.on('console',m=>{const t=m.text(); if(m.type()==='error'&&!/WebSocket|Failed to load resource/.test(t))errs.push(t.slice(0,120))});
  await p.goto('https://test.basicchinesebun.com/'+page,{waitUntil:'networkidle',timeout:60000});
  await p.waitForTimeout(12000);
  if (page==='staff') for (const d of '888888') await p.getByText(d,{exact:true}).first().click().catch(()=>{});
  await p.waitForTimeout(6000);
  const r=await p.evaluate(()=>{
    const out={overflowX:document.documentElement.scrollWidth>innerWidth+1,clipped:[],tiny:[]};
    document.querySelectorAll('button,.tag,span,div').forEach(el=>{
      const cs=getComputedStyle(el),bb=el.getBoundingClientRect();
      if(cs.display==='none'||cs.visibility==='hidden'||!bb.width||!bb.height)return;
      if(el.children.length===0&&el.scrollWidth>el.clientWidth+2&&cs.overflow==='visible'&&cs.textOverflow!=='ellipsis'){
        const t=(el.textContent||'').trim().slice(0,32); if(t)out.clipped.push(t)}
      if(el.tagName==='BUTTON'&&(bb.height<32||bb.width<32)){const t=(el.textContent||'').trim().slice(0,20); if(t)out.tiny.push(t+' '+Math.round(bb.width)+'x'+Math.round(bb.height))}
    });
    out.clipped=[...new Set(out.clipped)].slice(0,10); out.tiny=[...new Set(out.tiny)].slice(0,10); return out});
  console.log('\n'+page,size.width+'px');
  console.log('  overflow-x:',r.overflowX?'YES':'no');
  if(r.clipped.length)console.log('  clipped   :',JSON.stringify(r.clipped));
  if(r.tiny.length)  console.log('  too small :',JSON.stringify(r.tiny));
  if(errs.length)    console.log('  ERRORS    :',[...new Set(errs)].slice(0,5).join(' ;; '));
  await ctx.close();
 } await b.close();
})().catch(e=>console.log('ERR',e.message))"
```

Anything under 32px is a mis-tap on a touch till. Anything clipped is text
staff cannot read. Any page error is a feature that has stopped working.

Then **take a screenshot and look at it**. The automated checks miss things
that are plainly wrong to a person.

## 3. Check what the change stood on

Work out what else touches what you changed, and open those too. Grep is
faster than remembering:

```bash
grep -rn "theThingYouChanged" src/      # every caller, not just the one you edited
```

After deleting any state, grep for its setter — `npm run build` will not
catch a leftover `setThing(...)`, because it is valid JavaScript, and that is
exactly what locked the till out of every device for hours once.

## 4. Money and dates

The figures must agree with each other. When touching anything that counts:

- Does the total on screen use the same expression as the total that gets
  saved? They are separate code and have drifted before.
- Are cancelled, rejected and blocked orders excluded? Every figure excludes
  them except the one you just wrote, which is how the sales report ended up
  able to overstate the takings.
- Is the day bucketed by local time? Vientiane is UTC+7, so
  `toISOString().split('T')[0]` puts a late sale on the wrong day. Use
  `localDayStr`.
- Is the clock 24-hour? The shop writes 18:30. `hour12: false` everywhere.

## 5. Lao text

```bash
python3 -c "
import re,pathlib
for f in pathlib.Path('src').rglob('*.js'):
    for i,l in enumerate(f.read_text().split('\n'),1):
        if re.search(r'[຀-໿][ก-๛]|[ก-๛][຀-໿]', l):
            print(f'{f}:{i}  {l.strip()[:100]}')"
```

A Thai character inside a Lao word renders as a word the owner's staff cannot
read. `ເຊັ່ນ` shipped with a Thai ນ in it this way.

## 6. The offline paths, every time

The shop loses its internet for whole days. Any change to selling, stock,
queue numbers or syncing has to be checked with the line down — and the case
that matters is not "no network", it is **router up, internet down**, because
that is what a storm here actually looks like and `navigator.onLine` reads
true through all of it.

```bash
# in the packaged app: DNS blackholed, interfaces still up
app.commandLine.appendSwitch('host-resolver-rules', 'MAP * 0.0.0.0')
```

That exact case is what froze the till mid-payment: the sale took the online
path, hung, and ended in a blocking `alert()` with the whole offline system
sitting unused. **Never put `alert()` or `confirm()` in a selling path** —
a modal nobody dismisses is a till that has stopped.

Check after an offline change:
- stock held went down by what was sold, and only that
- the queue number came from the lease and advanced by one
- the sale is in the outbox with the right total
- nothing wiped the seeded stock or the lease

## 7. Then say what you did not check

Say plainly what is still untested — Windows, the printer, the drawer, real
hardware, two tills at once. The owner is going to run this in front of
customers, and a list of what was verified is worth more than a claim that
everything works.
