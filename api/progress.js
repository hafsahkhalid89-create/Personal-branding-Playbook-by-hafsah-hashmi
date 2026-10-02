const supabase = require('../lib/supabase');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { visitorId, name, done } = req.body || {};
  if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
  const { error } = await supabase.from('visits')
    .update({
      name: String(name || 'Someone').slice(0, 40),
      done: Math.max(0, Math.min(30, parseInt(done) || 0)),
      last_seen: new Date().toISOString()
    })
    .eq('visitor_id', visitorId);
  if (error) { console.error('progress:', error.message); return res.status(500).json({ error: 'Internal server error' }); }
  return res.status(200).json({ ok: true });
};
