import { supabaseAnon } from '../../lib/supabase.js';
import { handleCors, json } from '../../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) {
    return json(res, 400, { error: 'email and password are required' });
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Give a user-friendly message for unverified email
    if (error.message.includes('Email not confirmed')) {
      return json(res, 403, {
        error: 'Please verify your email first. Check your inbox for the verification link.',
      });
    }
    return json(res, 401, { error: 'Invalid email or password' });
  }

  return json(res, 200, {
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
    user: {
      id:    data.user.id,
      email: data.user.email,
    },
  });
}
