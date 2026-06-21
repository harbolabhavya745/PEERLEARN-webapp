import { handleCors, json, requireAuth } from '../lib/middleware.js';
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ── POST /api/livekit/token ───────────────────────────────────────
  if (req.url.startsWith('/api/livekit/token') && req.method === 'POST') {
    const authed = await requireAuth(req, res);
    if (!authed) return;

    const { roomName } = req.body;
    if (!roomName) {
      return json(res, 400, { error: 'roomName is required' });
    }

    const apiKey    = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl     = process.env.LIVEKIT_WS_URL; // e.g. wss://your-app.livekit.cloud

    if (!apiKey || !apiSecret || !wsUrl) {
      return json(res, 500, { error: 'LiveKit environment variables not configured' });
    }

    // Embed user_id and full name in identity so frontend can link to profile
    const namePart = req.profile?.full_name || req.user.email.split('@')[0];
    const identity = `${req.user.id}|${namePart}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '2h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return json(res, 200, { token, wsUrl, identity });
  }

  return json(res, 404, { error: 'Not found' });
}
