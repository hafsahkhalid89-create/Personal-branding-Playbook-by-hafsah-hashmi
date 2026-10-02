const supabase = require('../lib/supabase');

module.exports = async function (req, res) {
  if (req.method === 'POST') {
    const { visitorId, name, url, note } = req.body || {};
    if (!visitorId) return res.status(400).json({ error: 'visitorId required' });
    if (!url || !String(url).startsWith('https://')) return res.status(400).json({ error: 'url must start with https://' });
    if (String(url).length > 400) return res.status(400).json({ error: 'url too long' });
    if (note && String(note).length > 120) return res.status(400).json({ error: 'note too long (max 120 chars)' });

    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentCount, error: rcErr } = await supabase.from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', visitorId)
      .gte('created_at', hourAgo);
    if (rcErr) return res.status(500).json({ error: 'Internal server error' });
    if (recentCount >= 5) return res.status(429).json({ error: 'Too many pins. Try again in an hour.' });

    const { count: totalCount, error: tcErr } = await supabase.from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', visitorId);
    if (tcErr) return res.status(500).json({ error: 'Internal server error' });
    if (totalCount >= 10) return res.status(400).json({ error: 'Maximum 10 posts per person.' });

    const { error } = await supabase.from('pins').insert({
      visitor_id: visitorId,
      name: String(name || 'Someone').slice(0, 40),
      url: String(url).slice(0, 400),
      note: note ? String(note).slice(0, 120) : null
    });
    if (error) { console.error('pin insert:', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(201).json({ ok: true });

  } else if (req.method === 'DELETE') {
    const id = req.query.id;
    const visitorId = req.headers['x-visitor-id'];
    if (!id) return res.status(400).json({ error: 'id required' });
    if (!visitorId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: existing } = await supabase.from('pins')
      .select('id').eq('id', id).eq('visitor_id', visitorId).maybeSingle();
    if (!existing) return res.status(403).json({ error: 'Not your post or not found' });

    const { error } = await supabase.from('pins').delete().eq('id', id).eq('visitor_id', visitorId);
    if (error) return res.status(500).json({ error: 'Internal server error' });
    return res.status(200).json({ ok: true });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
