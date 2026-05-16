import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * POST /api/upload/avatar
 * Accepts multipart/form-data with a 'file' field.
 * Uploads to Supabase Storage bucket 'avatars' and updates profile.
 *
 * POST /api/upload/attachment
 * Accepts multipart/form-data with a 'file' field.
 * Uploads to Supabase Storage bucket 'chat-attachments'.
 * Returns the public URL for use in a message.
 *
 * NOTE: Vercel serverless functions have a 4.5 MB body limit by default.
 * For larger files you'd need to use Supabase Storage's signed upload URLs
 * directly from the frontend (see README for client-side upload flow).
 */

// Parse raw body as Buffer (Vercel passes body as string or object)
export const config = {
  api: {
    bodyParser: false,   // disable default JSON parser so we get raw buffer
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseContentType(ct = '') {
  const [mimeType, ...params] = ct.split(';').map(s => s.trim());
  const boundary = params.find(p => p.startsWith('boundary='))?.replace('boundary=', '');
  return { mimeType, boundary };
}

function parseMultipart(buffer, boundary) {
  const sep = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;

  while (start < buffer.length) {
    const sepIdx = buffer.indexOf(sep, start);
    if (sepIdx === -1) break;
    const after = sepIdx + sep.length;
    if (buffer.slice(after, after + 2).toString() === '--') break; // end boundary

    const lineEnd = buffer.indexOf('\r\n\r\n', after);
    if (lineEnd === -1) break;

    const headers = buffer.slice(after + 2, lineEnd).toString();
    const endIdx = buffer.indexOf(`\r\n--${boundary}`, lineEnd + 4);
    const body   = buffer.slice(lineEnd + 4, endIdx === -1 ? buffer.length : endIdx);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    const ctMatch   = headers.match(/Content-Type:\s*([^\r\n]+)/i);

    if (nameMatch) {
      parts.push({
        name:     nameMatch[1],
        filename: fileMatch?.[1],
        mimeType: ctMatch?.[1]?.trim(),
        data:     body,
      });
    }
    start = endIdx === -1 ? buffer.length : endIdx;
  }
  return parts;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const route  = req.url.split('?')[0]; // /api/upload/avatar or /api/upload/attachment
  const isChat = route.includes('attachment');

  const rawBody = await getRawBody(req);
  const { boundary } = parseContentType(req.headers['content-type']);
  if (!boundary) return json(res, 400, { error: 'Expected multipart/form-data' });

  const parts = parseMultipart(rawBody, boundary);
  const file  = parts.find(p => p.filename);
  if (!file) return json(res, 400, { error: 'No file found in upload' });

  // Validate MIME type
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedChat = [...allowed, 'application/pdf', 'text/plain'];
  const accepted = isChat ? allowedChat : allowed;

  if (!accepted.includes(file.mimeType)) {
    return json(res, 400, { error: `File type not allowed. Accepted: ${accepted.join(', ')}` });
  }

  // Max 4 MB
  if (file.data.length > 4 * 1024 * 1024) {
    return json(res, 400, { error: 'File too large (max 4 MB)' });
  }

  const ext    = file.filename.split('.').pop() || 'jpg';
  const bucket = isChat ? 'chat-attachments' : 'avatars';
  const path   = isChat
    ? `${req.user.id}/${Date.now()}.${ext}`
    : `${req.user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.data, {
      contentType: file.mimeType,
      upsert: true,
    });

  if (uploadError) return json(res, 500, { error: uploadError.message });

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // For avatar uploads: update profile
  if (!isChat) {
    await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', req.user.id);
  }

  return json(res, 200, {
    url:  publicUrl,
    path,
    type: file.mimeType.startsWith('image/') ? 'image' : 'file',
  });
}
