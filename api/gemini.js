import { GoogleGenerativeAI } from "@google/generative-ai";
import { handleCors, json } from "../lib/middleware.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Unified Gemini AI endpoint – routes by URL path:
 *   POST /api/gemini/quiz       → generate quiz
 *   POST /api/gemini/flashcards → generate flashcards
 *   POST /api/gemini/chat       → AI mascot chat
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed" });

  const url = req.url.split("?")[0];

  // ── Shared helper: try multiple models with fallback ──────────────
  async function tryModels(promptOrOpts, systemInstruction, useChat = false) {
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-8b",
      "gemini-1.5-flash",
    ];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        if (useChat) {
          // Chat mode: multi-turn conversation
          const chat = model.startChat({
            history: promptOrOpts.history || [],
            generationConfig: { temperature: 0.8, topP: 0.95 },
          });
          const result = await chat.sendMessage(promptOrOpts.message);
          return { text: result.response.text(), type: "chat" };
        } else {
          // Single-turn content generation
          const result = await model.generateContent(promptOrOpts);
          const raw = result.response.text().trim();
          const clean = raw
            .replace(/^```(?:json)?/i, "")
            .replace(/```$/i, "")
            .trim();
          return { data: JSON.parse(clean), type: "json" };
        }
      } catch (err) {
        console.warn(`[Gemini] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }
    throw lastError || new Error("All models failed");
  }

  // ══════════════════════════════════════════════════════════════════
  //  POST /api/gemini/quiz
  // ══════════════════════════════════════════════════════════════════
  if (url === "/api/gemini/quiz") {
    const { subject, topic, difficulty } = req.body;
    if (!subject || !topic)
      return json(res, 400, { error: "Missing subject or topic parameters." });

    const cleanDifficulty = difficulty || "MEDIUM";

    try {
      const prompt = `Generate an engaging 5-question multiple choice test in ${subject} about the topic: "${topic}". The difficulty level should be ${cleanDifficulty}. Provide distinct options (4 options per question). Mark the correct answer using 0-based index. Include a short, funny 8-bit retro gaming explanation for the correct answer. Make the questions exciting and academic!

Return ONLY a valid JSON array with no extra text or markdown formatting.
Example format:
[
  {
    "id": "q1",
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "answerIndex": 0,
    "contextExplanation": "brief retro game explanation"
  }
]`;

      const result = await tryModels(
        prompt,
        "You are a gamified retro study master teaching peer study groups inside an 8-bit RPG gaming academy. Give rigorous questions but stay in character. Always return valid JSON."
      );

      if (Array.isArray(result.data) && result.data.length > 0) {
        return json(res, 200, {
          success: true,
          code: "LIVE_AI",
          data: result.data,
        });
      }
      throw new Error("Empty quiz data");
    } catch (error) {
      console.warn("[GeminiQuiz] Fallback:", error?.message);

      return json(res, 200, {
        success: true,
        code: "FALLBACK_MOCK",
        warning:
          "Running with fallback mock questions. Configure GEMINI_API_KEY for real AI quizzes.",
        data: [
          {
            id: "mock1",
            question: `When building on ${subject} - "${topic}", what is the most critical first step?`,
            options: [
              "Running straight to the high-score boards with no practice",
              "Understanding the fundamental rules of the level/concept",
              "Paying 50 Gold to a wandering AI tutor for random answers",
              "Deleting your entire local save state to start fresh",
            ],
            answerIndex: 1,
            contextExplanation:
              "Level Completed! Mastering fundamental mechanics is essential to surviving complex academic raids!",
          },
          {
            id: "mock2",
            question: `Which approach is optimal for recursive problem solving in "${topic}"?`,
            options: [
              "Looping endlessly until your computer overheats",
              "Setting up concrete base cases and scaling the call stack progressively",
              "Using a level-skip cheat code that misses the core learning path",
              "Hoping player 2 carries you through the dynamic encounter",
            ],
            answerIndex: 1,
            contextExplanation:
              "XP Gained! Base cases act as checkpoints. Without checkpoints, recursive stacks descend into bottomless pits!",
          },
          {
            id: "mock3",
            question: `Why do studying peers often score higher together in ${subject}?`,
            options: [
              "They share inventory and exchange cognitive items/notes to bridge custom gaps",
              "One person does all the grinding while others go AFK",
              "They trigger a graphical glitch allowing them to bypass tests",
              "They possess identical skill trees which double their health bar",
            ],
            answerIndex: 0,
            contextExplanation:
              "Double Guild Bond Activated! Combining complementary skill-based profiles is the ultimate meta cheat!",
          },
        ],
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  POST /api/gemini/flashcards
  // ══════════════════════════════════════════════════════════════════
  if (url === "/api/gemini/flashcards") {
    const { subject, topic } = req.body;
    if (!subject || !topic)
      return json(res, 400, { error: "Missing subject or topic parameters." });

    try {
      const prompt = `Generate 6 critical academic study flashcards for ${subject} on the topic: "${topic}". For each flashcard, define a challenging term/question/concept for the "front" of the card, and a detailed, clear summary/explanation for the "back". Keep text concise yet rich in detail. Avoid dry, boring definitions; make it highly educational.

Return ONLY a valid JSON array with no extra text or markdown formatting.
Example format:
[
  {
    "id": "fc1",
    "front": "brief terminology or problem prompt",
    "back": "educational key summary or concept explanation"
  }
]`;

      const result = await tryModels(
        prompt,
        "You are a retro game scrollmaster preparing study guides (cards of knowledge) for students in an academy. State the core facts clearly on the card back. Always return valid JSON."
      );

      if (Array.isArray(result.data) && result.data.length > 0) {
        return json(res, 200, {
          success: true,
          code: "LIVE_AI",
          data: result.data,
        });
      }
      throw new Error("Empty flashcard data");
    } catch (error) {
      console.warn("[GeminiFlashcards] Fallback:", error?.message);

      return json(res, 200, {
        success: true,
        code: "FALLBACK_MOCK",
        warning:
          "Using local mock flashcards. Configure GEMINI_API_KEY for live AI flashcard generation.",
        data: [
          {
            id: "fc1",
            front: `Core Mechanic in ${topic}`,
            back: "To unlock maximum comprehension, relate each concept to an actionable game quest or daily mission in your routine.",
          },
          {
            id: "fc2",
            front: `Theoretical Base of ${subject}`,
            back: "This area provides the foundational mechanics of the subject. Skipping theory leads to brittle code and fragile builds.",
          },
          {
            id: "fc3",
            front: "Collaborative Study Power",
            back: "Active peer tutoring allows students to retain 80% or more of complex materials. Explaining it to others upgrades your own cognitive intelligence stat!",
          },
          {
            id: "fc4",
            front: `Practical Application of "${topic}"`,
            back: "Construct tiny, fully sandboxed projects or exercises. This earns physical XP better than any textbook speedrun.",
          },
          {
            id: "fc5",
            front: "Dynamic Scheduling Benefit",
            back: "Spacing out study encounters in your journal triggers memory retention. It prevents your player memory buffer from overflowing before testing!",
          },
          {
            id: "fc6",
            front: "Notion Sync Principle",
            back: "By using synced blocks & webhooks, change propagates instantly, enabling the entire guild to stay coordinated during major academic quests.",
          },
        ],
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  POST /api/gemini/chat
  // ══════════════════════════════════════════════════════════════════
  if (url === "/api/gemini/chat") {
    const { message, history } = req.body;
    if (!message)
      return json(res, 400, { error: "Missing message parameter." });

    try {
      const chatHistory = Array.isArray(history)
        ? history.map((turn) => ({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }],
          }))
        : [];

      const result = await tryModels(
        { message, history: chatHistory },
        "You are 'Pixel Sage', a friendly pixelated peer study mascot and elite study partner inside PeerLearn Arcade. You wear cool glasses, speak with retro enthusiasm (adding subtle game analogies like 'Level Up!', 'Quest Completed!', 'Upgrade your brain stats!'), but are genuinely helpful, sharp, and provide accurate academic tutor assistance on any topic. Keep answers reasonably brief, clear, and extremely encouraging!",
        true // useChat mode
      );

      return json(res, 200, {
        success: true,
        code: "LIVE_AI",
        reply: result.text,
      });
    } catch (error) {
      console.warn("[GeminiChat] Fallback:", error?.message);

      const replies = [
        "BEEP BOOP! Systems normal! Pixel Sage has initialized default backup processors! As your 8-bit study guide, I suggest breaking down your learning path into tiny quests. Tell me some key details about what study level you are targeting!",
        "Critical learning strike! That concept is vital for leveling up. Explaining concepts with bullet points is the absolute optimal way to configure your brain buffer. Let's conquer it together!",
        "Inventory synced! Dual-player cognitive multiplier activated. To bypass difficult academic portals, let's craft a clear flashcard or quiz yourself about it!",
        "Level Complete! Your cognitive capacity metrics are soaring! What other study raids are you planning for the upcoming exam calendar?",
      ];

      return json(res, 200, {
        success: true,
        code: "FALLBACK_MOCK",
        reply: `[MASCOT RECOVERY MODE]: ${
          replies[Math.floor(Math.random() * replies.length)]
        }\n\nConfigure GEMINI_API_KEY for actual dynamic AI coaching dialogue!`,
      });
    }
  }

  return json(res, 404, { error: "Gemini route not found" });
}
