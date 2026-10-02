const supabase = require('../lib/supabase');

function todayKarachi() {
  const d = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  return new Date(d + 'T00:00:00+05:00').toISOString();
}

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized' });

  const [vRes, pRes] = await Promise.all([
    supabase.from('visits').select('*').order('last_seen', { ascending: false }),
    supabase.from('pins').select('*').order('created_at', { ascending: false })
  ]);
  if (vRes.error || pRes.error)
    return res.status(500).json({ error: 'Internal server error' });

  const visits = vRes.data || [];
  const pins   = pRes.data || [];
  const todayStart = todayKarachi();

  return res.status(200).json({
    totals: {
      people: visits.length,
      openedToday: visits.filter(v => v.last_seen >= todayStart).length,
      totalOpens: visits.reduce((s, v) => s + (v.opens || 0), 0),
      avgDone: visits.length ? (visits.reduce((s, v) => s + (v.done || 0), 0) / visits.length).toFixed(1) : '0',
      postsPinned: pins.length
    },
    visits: visits.map(v => ({
      name: v.name, first_seen: v.first_seen, last_seen: v.last_seen,
      opens: v.opens, done: v.done
    })),
    pins: pins.map(p => ({
      id: p.id, name: p.name, note: p.note, url: p.url,
      created_at: p.created_at, cheered: p.cheered
    }))
  });
};
