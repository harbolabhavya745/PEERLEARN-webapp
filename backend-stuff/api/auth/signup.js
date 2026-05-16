import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json } from '../../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { email, password, full_name, college, course } = req.body;

  if (!email || !password || !full_name) {
    return json(res, 400, { error: 'email, password and full_name are required' });
  }

  // Create auth user with Supabase (sends verification email automatically)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,          // user must verify email
    user_metadata: { full_name, college, course },
  });

  if (error) {
    return json(res, 400, { error: error.message });
  }

  // Profile row is auto-created by DB trigger (handle_new_user)
  // but we can fill in extra fields right away
  await supabaseAdmin
    .from('profiles')
    .update({ full_name, college, course })
    .eq('id', data.user.id);

  // Grant default skin
  await supabaseAdmin
    .from('user_skins')
    .insert({ user_id: data.user.id, skin_key: 'default' })
    .onConflict(['user_id', 'skin_key']).ignore();

  return json(res, 201, {
    message: 'Account created! Please verify your email before signing in.',
    user_id: data.user.id,
  });
}
