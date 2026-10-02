const supabase = require('../lib/supabase');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { visitorId, name, done, start } = req.body || {};
  if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
  const { error } = await supabase.rpc('record_visit', {
    p_visitor_id: visitorId,
    p_name: String(name || 'Someone').slice(0, 40),
    p_done: Math.max(0, Math.min(30, parseInt(done) || 0)),
    p_start_date: start ? Number(start) : null
  });
  if (error) { console.error('visit:', error.message); return res.status(500).json({ error: 'Internal server error' }); }
  return res.status(200).json({ ok: true });
};
