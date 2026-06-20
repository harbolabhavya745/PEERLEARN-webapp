import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan prices in paise (₹1 = 100 paise)
const PLANS = {
  pro:   { amount: 19900,  label: 'Pro Plan – ₹199/month' },
  elite: { amount: 49900,  label: 'Elite Plan – ₹499/month' },
};

/**
 * POST /api/premium/order
 * body: { plan: 'pro' | 'elite' }
 * → Creates a Razorpay order, returns order_id and amount to frontend
 *
 * POST /api/premium/verify
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 * → Verifies HMAC signature, upgrades user plan
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const action = req.query.action;

  // ── Create Razorpay order ─────────────────────────────────────────
  if (action === 'order') {
    const { plan } = req.body;
    if (!PLANS[plan]) return json(res, 400, { error: 'plan must be pro or elite' });

    const order = await razorpay.orders.create({
      amount:   PLANS[plan].amount,
      currency: 'INR',
      notes: {
        user_id: req.user.id,
        plan,
      },
    });

    // Save pending order
    await supabaseAdmin.from('premium_orders').insert({
      user_id:           req.user.id,
      razorpay_order_id: order.id,
      plan,
      amount:            PLANS[plan].amount,
      status:            'pending',
    });

    return json(res, 200, {
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
      label:    PLANS[plan].label,
      user: {
        name:  req.profile?.full_name,
        email: req.user.email,
      },
    });
  }

  // ── Verify payment ────────────────────────────────────────────────
  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return json(res, 400, { error: 'All payment fields are required' });
    }

    // HMAC verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark order as failed
      await supabaseAdmin
        .from('premium_orders')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);

      return json(res, 400, { error: 'Payment verification failed. Contact support.' });
    }

    // Update order status
    await supabaseAdmin
      .from('premium_orders')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('razorpay_order_id', razorpay_order_id);

    // Upgrade user plan
    await supabaseAdmin
      .from('profiles')
      .update({ plan })
      .eq('id', req.user.id);

    // Unlock plan-specific skins that don't require XP
    const { data: planSkins } = await supabaseAdmin
      .from('skins')
      .select('key')
      .eq('required_plan', plan)
      .eq('xp_required', 0);

    if (planSkins?.length) {
      await supabaseAdmin.from('user_skins').insert(
        planSkins.map(s => ({ user_id: req.user.id, skin_key: s.key }))
      ).onConflict(['user_id', 'skin_key']).ignore();
    }

    return json(res, 200, {
      message: `🎉 You're now on the ${plan.toUpperCase()} plan!`,
      plan,
    });
  }

  return json(res, 400, { error: 'action must be order or verify' });
}
