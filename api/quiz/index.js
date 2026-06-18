import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth, addXP, XP_REWARDS } from '../../lib/middleware.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/quiz/generate
 * body: { topic, difficulty?: 'easy'|'medium'|'hard', count?: 5|10 }
 * → Generates quiz questions via Gemini AI
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const ok = await requireAuth(req, res);
    if (!ok) return;

    const action = (req.method === 'POST' ? req.body?.action : req.query.action) || (req.method === 'GET' ? 'history' : '');

    // ── GET: quiz history ─────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('quiz_attempts')
        .select('id, topic, score, total, xp_earned, created_at')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { attempts: data });
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    // ── POST /api/quiz/generate ───────────────────────────────────────
    if (action === 'generate') {
      const { topic, difficulty = 'medium', count = 5 } = req.body;
      if (!topic) return json(res, 400, { error: 'topic is required' });

      const safeCount = Math.min(10, Math.max(3, Number(count)));

      const prompt = `Generate exactly ${safeCount} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level for college students.

Return ONLY a valid JSON array with no extra text or markdown formatting. The output must be parseable by JSON.parse().
Example format:
[
  {
    "q": "question text",
    "opts": ["option A", "option B", "option C", "option D"],
    "ans": 0,
    "exp": "brief explanation"
  }
]

Rules:
- "ans" is the 0-based index of the correct option.
- Explanations should be 1-2 sentences.`;

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite'
      ];
      let success = false;
      let lastError;
      let questions;
      let isQuotaExceeded = false;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting quiz generation with model: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const raw = response.text().trim();

          const clean = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
          questions = JSON.parse(clean);

          if (Array.isArray(questions) && questions.length > 0) {
            success = true;
            console.log(`Successfully generated quiz using ${modelName}`);
            break;
          }
        } catch (err) {
          console.warn(`Model ${modelName} failed:`, err.message);
          lastError = err;
          if (err.message.includes('429') || err.message.toLowerCase().includes('quota')) {
            isQuotaExceeded = true;
          }
        }
      }

      if (!success) {
        const statusCode = isQuotaExceeded ? 429 : 500;
        return json(res, statusCode, { 
          error: isQuotaExceeded ? 'Gemini API quota exceeded. Please try again later.' : 'Failed to generate quiz.',
          details: lastError?.message 
        });
      }

      return json(res, 200, { questions, topic, difficulty });
    }

    // ── POST /api/quiz/submit ─────────────────────────────────────────
    if (action === 'submit') {
      const { topic, questions, answers, score, total } = req.body;

      if (!topic || !Array.isArray(answers) || score === undefined || !total) {
        return json(res, 400, { error: 'topic, answers, score and total are required' });
      }

      // Calculate XP: base + bonus for perfect score
      const isPerfect = score === total;
      const xpEarned  = XP_REWARDS.quiz_complete + (isPerfect ? XP_REWARDS.quiz_perfect - XP_REWARDS.quiz_complete : 0);
      // Proportional for partial scores
      const finalXp   = Math.round((score / total) * xpEarned);

      const { data: attempt, error } = await supabaseAdmin
        .from('quiz_attempts')
        .insert({
          user_id:   req.user.id,
          topic,
          questions: questions || [],
          answers,
          score,
          total,
          xp_earned: finalXp,
        })
        .select()
        .single();

      if (error) return json(res, 500, { error: error.message });

      // Award XP and update profile
      const xpResult = await addXP(req.user.id, finalXp, 'quiz_complete');

      // Record activity
      await supabaseAdmin.from('activities').insert({
        user_id:  req.user.id,
        actor_id: req.user.id,
        type:     'quiz_complete',
        meta:     { topic, score, total, perfect: isPerfect },
      });

      return json(res, 201, {
        attempt_id: attempt.id,
        xp_earned:  finalXp,
        new_xp:     xpResult?.xp,
        new_level:  xpResult?.level,
        new_streak: xpResult?.streak,
        perfect:    isPerfect,
      });
    }

    return json(res, 400, { error: 'action must be generate or submit' });

  } catch (err) {
    console.error('CRITICAL QUIZ API ERROR:', err);
    return json(res, 500, { error: 'Internal Server Error', details: err.message });
  }
}
