const supabase = require('../lib/supabase');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('pins').update({ cheered: true }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Internal server error' });
  return res.status(200).json({ ok: true });
};
