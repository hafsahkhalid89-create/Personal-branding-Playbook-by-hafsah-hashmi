const supabase = require('../lib/supabase');

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const visitorId = req.headers['x-visitor-id'] || '';
  const { data, error } = await supabase.from('pins')
    .select('id, name, note, url, created_at, cheered, visitor_id')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { console.error('wall:', error.message); return res.status(500).json({ error: 'Internal server error' }); }
  const posts = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    note: p.note,
    url: p.url,
    created_at: p.created_at,
    cheered: p.cheered,
    mine: !!(visitorId && p.visitor_id === visitorId)
  }));
  return res.status(200).json(posts);
};
