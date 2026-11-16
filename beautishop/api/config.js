import { getConfig } from '../lib/store.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  try {
    const c = await getConfig();
    const menu = c.menu.filter(m => m.active && m.price > 0);
    const branches = (c.branches || []).filter(b => b.active);
    send(res, 200, { menu, settings: c.settings, branches }, { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' });
  } catch (e) { send(res, 500, { error: 'ໂຫຼດບໍ່ໄດ້' }); }
}
