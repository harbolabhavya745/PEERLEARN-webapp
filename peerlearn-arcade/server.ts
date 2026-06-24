/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client helper
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not defined or is placeholder. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Robust fallback wrapper to handle 503 high-demand spikes
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getAI();
  try {
    return await ai.models.generateContent({
      model: "gemini-3.5-flash",
      ...params,
    });
  } catch (error: any) {
    const errorMsg = error?.message || "";
    console.warn(`[Gemini API] Primary model (gemini-3.5-flash) failed (possibly 503), trying fallback model (gemini-3.1-flash-lite). Error: ${errorMsg}`);
    try {
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        ...params,
      });
    } catch (fallbackError: any) {
      console.error("[Gemini API] Fallback model (gemini-3.1-flash-lite) also failed:", fallbackError?.message);
      throw error; // Re-throw the original error to activate the app's standard fallback system
    }
  }
}

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// AI Quiz Endpoint (Gemini-grounded adaptive quiz game)
app.post("/api/gemini/quiz", async (req, res) => {
  const { subject, topic, difficulty } = req.body;
  if (!subject || !topic) {
    res.status(400).json({ error: "Missing subject or topic parameters." });
    return;
  }

  const cleanDifficulty = difficulty || "MEDIUM";

  try {
    const ai = getAI();
    const prompt = `Generate an engaging 5-question multiple choice test in ${subject} about the topic: "${topic}". The difficulty level should be ${cleanDifficulty}. Provide distinct options (4 options per question). Mark the correct answer using 0-based index. Include a short, funny 8-bit retro gaming explanation for the correct answer. Make the questions exciting and academic!`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are a gamified retro study master teaching peer study groups inside an 8-bit RPG gaming academy. Give rigorous questions but stay in character.",
        topP: 0.95,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A simple unique string ID like q1, q2" },
              question: { type: Type.STRING, description: "The quiz question itself." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Four distinct options. Maximum length 100 chars each."
              },
              answerIndex: { type: Type.INTEGER, description: "0-based index of the correct answer (0, 1, 2, or 3)." },
              contextExplanation: { type: Type.STRING, description: "Retro game style feedback explanation on why this is correct." }
            },
            required: ["id", "question", "options", "answerIndex", "contextExplanation"]
          }
        }
      }
    });

    const text = response.text?.trim() || "[]";
    const parsedQuiz = JSON.parse(text);
    res.json({ success: true, code: "LIVE_AI", data: parsedQuiz });

  } catch (error: any) {
    console.warn("AI Quiz error (using mock fallback):", error?.message);
    
    // Provide a smart local fallback quiz when API key is missing or invalid
    const mockQuizzes: any[] = [
      {
        id: "mock1",
        question: `When building on ${subject} - "${topic}", what is the most critical first step?`,
        options: [
          "Running straight to the high-score boards with no practice",
          "Understanding the fundamental rules of the level/concept",
          "Paying 50 Gold to a wandering AI tutor for random answers",
          "Deleting your entire local save state to start fresh"
        ],
        answerIndex: 1,
        contextExplanation: "Level Completed! Mastering fundamental mechanics is essential to surviving complex academic raids!"
      },
      {
        id: "mock2",
        question: `Which approach is optimal for recursive problem solving in "${topic}"?`,
        options: [
          "Looping endlessly until your computer overheats and triggers a game over",
          "Setting up concrete base cases and scaling the call stack progressively",
          "Using a level-skip cheat code that misses the actual core learning path",
          "Hoping player 2 carries you through the dynamic encounter"
        ],
        answerIndex: 1,
        contextExplanation: "XP Gained! Base cases act as checkpoints. Without checkpoints, recursive stacks descend into bottomless pits!"
      },
      {
        id: "mock3",
        question: `Why do studying peers often score higher together in ${subject}?`,
        options: [
          "They share inventory and exchange cognitive items/notes to bridge custom gaps",
          "One person does all the grinding while others go AFK",
          "They trigger a graphical glitch allowing them to bypass tests",
          "They possess identical skill trees which double their health bar"
        ],
        answerIndex: 0,
        contextExplanation: "Double Guild Bond Activated! Combining complementary skill-based profiles is the absolute ultimate meta cheat!"
      }
    ];
    
    res.json({
      success: true,
      code: "FALLBACK_MOCK",
      warning: "Running with fallback mock questions. To unlock real AI generated quizzes, configure your GEMINI_API_KEY in Secrets.",
      data: mockQuizzes
    });
  }
});

// AI Flashcards Endpoint
app.post("/api/gemini/flashcards", async (req, res) => {
  const { subject, topic } = req.body;
  if (!subject || !topic) {
    res.status(400).json({ error: "Missing subject or topic parameters." });
    return;
  }

  try {
    const ai = getAI();
    const prompt = `Generate 6 critical academic study flashcards for ${subject} on the topic: "${topic}". For each flashcard, define a challenging term/question/concept for the "front" of the card, and a detailed, clear summary/explanation for the "back". Keep text concise yet rich in detail. Avoid dry, boring definitions; make it highly educational.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are a retro game scrollmaster preparing study guides (cards of knowledge) for students in an academy. State the core facts clearly on card back.",
        topP: 0.95,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              front: { type: Type.STRING, description: "Brief terminology or problem prompt (front of card)." },
              back: { type: Type.STRING, description: "Educational key summary or concept explanation (back of card)." }
            },
            required: ["id", "front", "back"]
          }
        }
      }
    });

    const text = response.text?.trim() || "[]";
    const parsedCards = JSON.parse(text);
    res.json({ success: true, code: "LIVE_AI", data: parsedCards });

  } catch (error: any) {
    console.warn("AI Flashcards error (using mock fallback):", error?.message);
    
    // Fallback Mock dynamic flashcards
    const mockCards = [
      { id: "fc1", front: `Core Mechanic in ${topic}`, back: "To unlock maximum comprehension, relate each concept to an actionable game quest or daily mission in your routine." },
      { id: "fc2", front: `Theoretical Base of ${subject}`, back: "This area provides the foundational mechanics of the subject. Skipping theory leads to brittle code and fragile builds." },
      { id: "fc3", front: "Collaborative Study Power", back: "Active peer tutoring allows students to retain 80% or more of complex materials. Explaining it to others upgrades your own cognitive intelligence stat!" },
      { id: "fc4", front: `Practical Application of "${topic}"`, back: "Construct tiny, fully sandboxed projects or exercises. This earns physical XP better than any textbook speedrun." },
      { id: "fc5", front: "Dynamic Scheduling Benefit", back: "Spacing out study encounters in your journal triggers memory retention. It prevents your player memory buffer from buffer overflowing before testing!" },
      { id: "fc6", front: "Notion Sync Principle", back: "By using synced blocks & webhooks, change propagates instantly, enabling the entire guild to stay coordinated during major academic quests." }
    ];

    res.json({
      success: true,
      code: "FALLBACK_MOCK",
      warning: "Using local mock flashcards. Configure GEMINI_API_KEY in Secrets for live customizable AI flashcard generation.",
      data: mockCards
    });
  }
});

// AI Study Partner Chat endpoint
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Missing message parameter." });
    return;
  }

  try {
    const ai = getAI();
    const systemPrompt = "You are 'Pixel Sage', a friendly pixelated peer study mascot and elite study partner inside PeerLearn Arcade. You wear cool glasses, speak with retro enthusiasm (adding subtle game analogies like 'Level Up!', 'Quest Completed!', 'Upgrade your brain stats!'), but are genuinely helpful, sharp, and provide accurate academic tutor assistance on any topic. Keep answers reasonably brief, clear, and extremely encouraging!";

    // Format chat history for Gemni SDK if supplied
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await generateContentWithFallback({
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    res.json({ success: true, code: "LIVE_AI", reply: response.text });
  } catch (error: any) {
    console.warn("AI Chat error (using mock fallback):", error?.message);
    
    // Retro Mascot humorous local chat response
    const replies = [
      "BEEP BOOP! Systems normal! Pixel Sage has initialized default backup processors! As your 8-bit study guide, I suggest breaking down your learning path into tiny quests. Tell me some key details about what study level you are targeting!",
      "Critical learning strike! That concept is vital for leveling up. Explaining concepts with bullet points is the absolute optimal way to configure your brain buffer. Let's conquer it together!",
      "Inventory synced! Dual-player cognitive multiplier activated. To bypass difficult academic portals, let's craft a clear flashcard or quiz yourself about it!",
      "Level Complete! Your cognitive capacity metrics are soaring! What other study raids are you planning for the upcoming exam calendar?"
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    res.json({
      success: true,
      code: "FALLBACK_MOCK",
      reply: `[MASCOT RECOVERY MODE]: ${randomReply}\n\nType again or configure process.env.GEMINI_API_KEY in Secrets for actual dynamic AI coaching dialogue!`
    });
  }
});


// Configure serve-static behavior
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode using Vite dev server as Express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PeerLearn Arcade Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
