import { getConfig, getStock } from '../lib/store.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  try {
    const [c, stock] = await Promise.all([getConfig(), getStock()]);
    // stock: how many are left (never below 0), or null when the item isn't counted.
    const menu = c.menu.filter(m => m.active && m.price > 0)
      .map(m => ({ ...m, stock: typeof stock[m.id] === 'number' ? Math.max(0, stock[m.id]) : null }));
    const branches = (c.branches || []).filter(b => b.active);
    send(res, 200, { menu, settings: c.settings, branches }, { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' });
  } catch (e) { send(res, 500, { error: 'ໂຫຼດບໍ່ໄດ້' }); }
}
