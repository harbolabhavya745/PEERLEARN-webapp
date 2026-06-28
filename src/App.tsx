/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  BookOpen, 
  RefreshCw, 
  Trophy,
  Users,
  Zap,
  ListTodo,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Database,
  Gamepad2,
  Moon,
  Sun,
  User,
  Crown,
  Compass,
  MessageSquare
} from "lucide-react";
import { 
  Difficulty, 
  GameState, 
  NoteBlock, 
  Quest, 
  Flashcard, 
  QuizQuestion, 
  SkillProfile, 
  AvatarSkin,
  AppTheme,
  APP_THEMES
} from "./types";

import GuildHall from "./components/GuildHall";
import QuizArena from "./components/QuizArena";
import KnowledgeScrolls from "./components/KnowledgeScrolls";
import QuestBook from "./components/QuestBook";
import ScribeChamber from "./components/ScribeChamber";
import PixelSageMascot from "./components/PixelSageMascot";
import PeerChatDashboard from "./components/PeerChatDashboard";
import ProfileDashboard from "./components/ProfileDashboard";
import AuthScreen from "./components/AuthScreen";

// Premium Avatar Skins
const AVATAR_SKINS: AvatarSkin[] = [
  {
    id: "rusty_novice",
    name: "Rusty Novice",
    cost: 0,
    spriteUrl: "🛡️",
    borderColor: "border-zinc-500",
    textColor: "text-zinc-500",
    powerName: "Standard Grind (+0% Multiplier)"
  },
  {
    id: "sage_alchemist",
    name: "Sage Alchemist",
    cost: 50,
    spriteUrl: "🧪",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-400",
    powerName: "Double Brew (+15% XP Boost)"
  },
  {
    id: "code_ninja",
    name: "Cyber Code Ninja",
    cost: 100,
    spriteUrl: "🥷",
    borderColor: "border-cyan-500",
    textColor: "text-cyan-400",
    powerName: "Syntax Strike (+25% Star Spawn)"
  },
  {
    id: "starlight_paladin",
    name: "Starlight Paladin",
    cost: 180,
    spriteUrl: "✨",
    borderColor: "border-amber-500",
    textColor: "text-amber-400",
    powerName: "Sacred Focus (+50% Focus Recovery)"
  },
  {
    id: "guild_master",
    name: "Notion Assistant",
    cost: 280,
    spriteUrl: "🧙‍♂️",
    borderColor: "border-fuchsia-500",
    textColor: "text-fuchsia-400",
    powerName: "Focus Boost (+80% Note XP)",
  },
];

// Seed active peers
const INITIAL_PEERS: SkillProfile[] = [
  {
    id: "p1",
    name: "Ada_Lovelace_8bit",
    level: 7,
    avatarSkin: "🧪",
    skillsToGive: ["Recursion Theory", "Pointers"],
    skillsToLearn: ["Organic Synthesis", "Derivatives"],
    status: "Rerolling CS homework. Looking for alchemist partner!",
    isOnline: true,
    xpEarned: 1200
  },
  {
    id: "p2",
    name: "Heisenberg_RPG",
    level: 12,
    avatarSkin: "🧙‍♂️",
    skillsToGive: ["Organic Bonding", "Equilibrium"],
    skillsToLearn: ["Recursion Theory", "Big-O Analysis"],
    status: "Active study raid. Ready for chemistry boss!",
    isOnline: true,
    xpEarned: 2400
  },
  {
    id: "p3",
    name: "Newton_Limit_Break",
    level: 5,
    avatarSkin: "🛡️",
    skillsToGive: ["Limits & Tangents", "Kinematics"],
    skillsToLearn: ["Recursion Theory"],
    status: "Grinding physics vectors. AFK eating mana potions.",
    isOnline: false,
    xpEarned: 600
  }
];

// Seed initial Quests
const SEED_QUESTS: Quest[] = [
  {
    id: "q1",
    type: "daily",
    title: "Scribe First Scroll",
    description: "Write down 1 academic study note block in the Scribe Chamber.",
    xpReward: 30,
    goldReward: 15,
    difficulty: Difficulty.EASY,
    completed: false,
    dueDate: "Today"
  },
  {
    id: "q2",
    type: "weekly",
    title: "Conquer CS Quiz Boss",
    description: "Successfully summon and beat any Computer Science quiz raid.",
    xpReward: 100,
    goldReward: 50,
    difficulty: Difficulty.MEDIUM,
    completed: false,
    dueDate: "In 4 Days"
  },
  {
    id: "q3",
    type: "raid",
    title: "Full Notion Synchronicity",
    description: "Push saved study records onto the simulated Notion Webhook database pipeline.",
    xpReward: 250,
    goldReward: 120,
    difficulty: Difficulty.HARD,
    completed: false,
    dueDate: "Syllabus Deadline"
  }
];

// Seed initial Notes
const SEED_NOTES: NoteBlock[] = [
  {
    id: "n1",
    title: "Big O Time Complexity",
    content: "O(1) Constant Time: Operations take same time regardless of input size.\nO(log n) Logarithmic Time: Input decreases by half each iteration (e.g., Binary Search).\nO(n) Linear Time: Execution increases proportionally to inputs (e.g., Single loops).\nO(n²) Quadratic Time: Nested iterations.",
    author: "Rusty Squire",
    color: "green",
    date: "06/23 10:45",
    tags: ["computerscience", "big-o", "algorithms"]
  },
  {
    id: "n2",
    title: "Limits Calculus Cheat Sheet",
    content: "Definition of a Limit: The value a function approaches as its input gets closer to some specific point.\nStandard Trick (L'Hopital's Rule): If evaluating a limit yields 0/0 or ∞/∞, take the derivative of numerator and denominator independently, then evaluate again!",
    author: "Calculus Alchemist",
    color: "blue",
    date: "06/23 10:50",
    tags: ["calculus", "limits", "math"]
  }
];

export default function App() {
  // Sound states
  const [isMuted, setIsMuted] = useState(false);

  // Active Tab / View
  const [activeTab, setActiveTab] = useState<string>("guild_hall");

  // ── Auth state ──────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [realPeers, setRealPeers] = useState<SkillProfile[]>([]);

  const authFetch = (url: string, opts: RequestInit = {}) => {
    const token = localStorage.getItem("pl_access_token");
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  };

  const handleLoginSuccess = (user: { id: string; email: string; full_name?: string }, token?: string) => {
    if (token) localStorage.setItem("pl_access_token", token);
    setAuthUser(user);
    setAuthLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("pl_access_token");
    if (!token) { setAuthLoading(false); return; }
    authFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data?.id) setAuthUser(data); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // ── Nickname (from profile or localStorage) ───────────────────────────────
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem("peerlearn_nickname") || "Rusty Squire";
  });
  // College / University
  const [college, setCollege] = useState<string>(() => {
    return localStorage.getItem("peerlearn_college") || "Pixel Academy of Technology";
  });

  // Linked Email Address
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem("peerlearn_email") || "squire@pixelguild.edu";
  });

  // Skills one knows
  const [knownSkills, setKnownSkills] = useState<string[]>(() => {
    const saved = localStorage.getItem("peerlearn_known_skills");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ["Python", "Algorithms", "React"];
  });

  // Skills one wants to learn
  const [desiredSkills, setDesiredSkills] = useState<string[]>(() => {
    const saved = localStorage.getItem("peerlearn_desired_skills");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ["Organic Chemistry", "Physics Limits"];
  });

  // Custom Avatar Emoji
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => {
    return localStorage.getItem("peerlearn_avatar_emoji") || "🛡️";
  });

  // Profile Border Frame Aura
  const [profileFrame, setProfileFrame] = useState<string>(() => {
    return localStorage.getItem("peerlearn_profile_frame") || "neon_green";
  });

  // Active App-wide Color Theme
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem("peerlearn_theme_id") || "green";
  });

  // Main game state
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("peerlearn_gamestate");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      currentXP: 45,
      level: 4,
      goldCount: 120,
      jewelCount: 5,
      starCount: 15,
      swordPower: 12,
      playerHealth: 80,
      maxHealth: 100,
      unlockedSkins: ["rusty_novice"],
      activeSkin: "rusty_novice"
    };
  });

  // ── Quests ───────────────────────────────────────────────────────────────
  const [quests, setQuests] = useState<Quest[]>([]);

  // ── Auto-Refresh Quests Logic ──
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Calculate current week string (Year + Week Number)
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const weekStr = `${now.getFullYear()}-W${weekNum}`;

    const lastDaily = localStorage.getItem("peerlearn_lastDailyRefresh");
    const lastWeekly = localStorage.getItem("peerlearn_lastWeeklyRefresh");

    if (lastDaily !== todayStr || lastWeekly !== weekStr) {
      // Logic runs locally for optimistic updates; API handles DB
      setQuests(prev => {
        let updated = [...prev];
        if (lastDaily !== todayStr) {
          updated = updated.map(q => q.type === "daily" ? { ...q, completed: false } : q);
          localStorage.setItem("peerlearn_lastDailyRefresh", todayStr);
        }
        if (lastWeekly !== weekStr) {
          updated = updated.map(q => q.type === "weekly" ? { ...q, completed: false } : q);
          localStorage.setItem("peerlearn_lastWeeklyRefresh", weekStr);
        }
        return updated;
      });
    }
  }, []);

  // ── Fetch Quests & Notes from Supabase ──
  useEffect(() => {
    if (authUser) {
      authFetch("/api/users/quests")
        .then(res => res.json())
        .then(data => { if (data.quests) setQuests(data.quests); })
        .catch(console.error);
        
      authFetch("/api/notion/notes")
        .then(res => res.json())
        .then(data => { if (data.notes) setNotes(data.notes); })
        .catch(console.error);
        
      authFetch("/api/notion/status")
        .then(res => res.json())
        .then(data => setNotionStatus(data))
        .catch(console.error);
    } else {
      setQuests(SEED_QUESTS);
      setNotes(SEED_NOTES);
    }
  }, [authUser]);

  // ── Notes ────────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<NoteBlock[]>([]);

  // Quiz Arena States
  const [quizSubject, setQuizSubject] = useState("Computer Science");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizAlert, setQuizAlert] = useState<string | null>(null);

  // Knowledge Scrolls States
  const [scrollsSubject, setScrollsSubject] = useState("Computer Science");
  const [scrollsTopic, setScrollsTopic] = useState("");
  const [isGeneratingScrolls, setIsGeneratingScrolls] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [scrollsAlert, setScrollsAlert] = useState<string | null>(null);

  // ── Notion Sync ──────────────────────────────────────────────────────────
  const [notionStatus, setNotionStatus] = useState<any>(null);
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);
  const [notionSyncLogs, setNotionSyncLogs] = useState<string[]>([]);

  // Mascot AI Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Peer Connections Chat States
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [peerChatHistories, setPeerChatHistories] = useState<Record<string, { role: "user" | "model"; text: string }[]>>(() => {
    const saved = localStorage.getItem("peerlearn_peer_chats");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      "p1": [
        { role: "model", text: "BEEP BOOP! Hey there! I'm Ada_Lovelace_8bit. I'm currently hacking away at some recursion theory. Want to join my study party?" }
      ],
      "p2": [
        { role: "model", text: "Yo! Heisenberg_RPG here. I'm cooking up some organic chemistry bonding formulas. Let's merge cognitive stacks!" }
      ],
      "p3": [
        { role: "model", text: "Greetings, traveler. Newton_Limit_Break here. I am grinding physics vectors, but my physical avatar is currently AFK eating mana potions." }
      ]
    };
  });
  const [peerChatLoading, setPeerChatLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authUser) return;
    async function loadConv() {
      try {
        const [convRes, suggRes] = await Promise.all([
          authFetch("/api/chat/conversations"),
          authFetch("/api/users/suggestions")
        ]);

        let mappedPeers: SkillProfile[] = [];
        
        if (convRes.ok) {
          const data = await convRes.json();
          mappedPeers = data.conversations.map((c: any) => ({
            id: c.id, 
            name: c.display_name || "Unknown",
            level: c.other_user?.level || 1, 
            avatarSkin: c.display_avatar || "🧑‍💻",
            skillsToGive: c.other_user?.skills || [],
            skillsToLearn: [],
            status: c.other_user?.bio || "Online", 
            isOnline: true,
            xpEarned: c.other_user?.xp || 0
          }));
        }

        if (suggRes.ok) {
          const suggData = await suggRes.json();
          const suggPeers: SkillProfile[] = suggData.suggestions.map((u: any) => ({
            id: "sugg_" + u.id,
            name: u.full_name || u.username,
            level: u.level || 1,
            avatarSkin: u.avatar_skin || "🧑‍💻",
            skillsToGive: u.skills || [],
            skillsToLearn: [],
            status: u.course ? `Studying ${u.course}` : "Available",
            isOnline: true,
            xpEarned: u.xp || 0,
            isSuggestion: true,
            targetUserId: u.id
          }));
          mappedPeers = [...mappedPeers, ...suggPeers];
        }

        if (mappedPeers.length > 0) {
          setRealPeers(mappedPeers);
          if (!activePeerId) setActivePeerId(mappedPeers[0].id);
        }
      } catch (e) {
        console.error("Failed to load conversations or suggestions", e);
      }
    }
    loadConv();
  }, [authUser]);

  // ── Fetch Messages for Active Chat ──
  useEffect(() => {
    if (!authUser || !activePeerId) return;
    
    // Ignore dummy mock profiles (p1, p2, p3)
    if (activePeerId.startsWith("p")) return;

    async function loadMsgs() {
      setPeerChatLoading(prev => ({ ...prev, [activePeerId as string]: true }));
      try {
        const res = await authFetch(`/api/chat/messages?conversation_id=${activePeerId}`);
        if (res.ok) {
          const data = await res.json();
          const mappedMsgs = data.messages.map((m: any) => ({
            role: m.sender?.id === authUser.id ? "user" : "model",
            text: m.content
          }));
          setPeerChatHistories(prev => ({ ...prev, [activePeerId as string]: mappedMsgs }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPeerChatLoading(prev => ({ ...prev, [activePeerId as string]: false }));
      }
    }
    loadMsgs();
  }, [authUser, activePeerId]);

  const sendPeerMessage = async (peerId: string, text: string) => {
    const newMsg = { role: "user" as const, text };
    setPeerChatHistories(prev => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), newMsg]
    }));
    setPeerChatLoading(prev => ({ ...prev, [peerId]: true }));
    
    if (authUser && !peerId.startsWith("p") && !peerId.startsWith("sugg_")) {
      try {
        await authFetch("/api/chat/messages", {
          method: "POST",
          body: JSON.stringify({
            conversation_id: peerId,
            content: text
          })
        });
        setPeerChatLoading(prev => ({ ...prev, [peerId]: false }));
        if (typeof window !== 'undefined' && (window as any).playGameSound) {
          (window as any).playGameSound("chat_send");
        }
      } catch (e) {
        console.error(e);
        setPeerChatLoading(prev => ({ ...prev, [peerId]: false }));
      }
    } else if (authUser && peerId.startsWith("sugg_")) {
      try {
        const targetUserId = peerId.replace("sugg_", "");
        // 1. Create DM
        const convRes = await authFetch("/api/chat/conversations", {
          method: "POST",
          body: JSON.stringify({ type: 'dm', user_id: targetUserId })
        });
        const convData = await convRes.json();
        const newConvId = convData.conversation_id;
        
        // 2. Send Message to new Conv
        await authFetch("/api/chat/messages", {
          method: "POST",
          body: JSON.stringify({ conversation_id: newConvId, content: text })
        });
        
        // 3. Migrate history & loading state
        setPeerChatHistories(prev => {
          const updated = { ...prev, [newConvId]: prev[peerId] || [] };
          delete updated[peerId];
          return updated;
        });
        setPeerChatLoading(prev => {
          const updated = { ...prev, [newConvId]: false };
          delete updated[peerId];
          return updated;
        });
        
        // 4. Update peers to replace suggestion with actual conversation ID
        setRealPeers(prev => prev.map(p => p.id === peerId ? { ...p, id: newConvId, isSuggestion: false } : p));
        setActivePeerId(newConvId);
        
        if (typeof window !== 'undefined' && (window as any).playGameSound) {
          (window as any).playGameSound("chat_send");
        }
      } catch (e) {
        console.error(e);
        setPeerChatLoading(prev => ({ ...prev, [peerId]: false }));
      }
    } else {
      // Simulate AI peer typing for dummy profiles
      setTimeout(() => {
        const reply = { role: "model" as const, text: "Got it! Let's study." };
        setPeerChatHistories(prev => ({
          ...prev,
          [peerId]: [...(prev[peerId] || []), reply]
        }));
        setPeerChatLoading(prev => ({ ...prev, [peerId]: false }));
        if (typeof window !== 'undefined' && (window as any).playGameSound) {
          (window as any).playGameSound("chat_reply");
        }
      }, 1000);
    }
  };


  // Save states to local storage on change
  useEffect(() => {
    localStorage.setItem("peerlearn_nickname", nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem("peerlearn_college", college);
  }, [college]);

  useEffect(() => {
    localStorage.setItem("peerlearn_email", email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem("peerlearn_known_skills", JSON.stringify(knownSkills));
  }, [knownSkills]);

  useEffect(() => {
    localStorage.setItem("peerlearn_desired_skills", JSON.stringify(desiredSkills));
  }, [desiredSkills]);

  useEffect(() => {
    localStorage.setItem("peerlearn_avatar_emoji", avatarEmoji);
  }, [avatarEmoji]);

  useEffect(() => {
    localStorage.setItem("peerlearn_profile_frame", profileFrame);
  }, [profileFrame]);

  useEffect(() => {
    localStorage.setItem("peerlearn_theme_id", activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    localStorage.setItem("peerlearn_gamestate", JSON.stringify(gameState));
  }, [gameState]);

  // Removed localStorage sync for quests and notes

  useEffect(() => {
    localStorage.setItem("peerlearn_peer_chats", JSON.stringify(peerChatHistories));
  }, [peerChatHistories]);

  // Toast auto-dismisser
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Notion OAuth URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#notion')) {
      const params = new URLSearchParams(hash.replace('#notion?', ''));
      const error = params.get('error');
      const connected = params.get('connected');
      const details = params.get('details');
      
      if (error) {
        let msg = "Notion Connection Failed!";
        if (details) msg += ` Details: ${decodeURIComponent(details)}`;
        else if (error === 'missing_params') msg = "Notion Connection Failed: Missing parameters";
        
        console.error("[Notion OAuth Error]", msg); // <-- ADDED LOG
        showToastMsg(msg, "error");
      } else if (connected === 'true') {
        showToastMsg("Successfully connected to Notion! 📝", "success");
      }
      
      // Clear the hash without reloading
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setActiveTab('scribe_chamber'); // Switch to the Notion tab
    }
  }, []);

let globalAudioCtx: any = null;

  // ═══════════════════════════════════════════════════════════════════════
  //  SOUND SYNTHESIZER (Web Audio API)
  // ═══════════════════════════════════════════════════════════════════════

  const playGameSound = (
    type:
      | "click"
      | "coin"
      | "levelup"
      | "correct"
      | "wrong"
      | "quest_complete"
      | "heal"
      | "sync"
      | "cast_spell"
      | "danger"
      | "chat_send"
      | "chat_reply"
  ) => {
    if (isMuted) return;
    try {
      if (!globalAudioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        globalAudioCtx = new AudioCtx();
      }
      if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().catch(() => {});
      }
      if (globalAudioCtx.state !== 'running') return;
      
      const ctx = globalAudioCtx;

      const playTone = (freq: number, duration: number, oscType: OscillatorType = "sine", delay = 0, startVol = 0.08, endVol = 0.001) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(startVol, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(endVol, ctx.currentTime + delay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      const playFrequencySweep = (startFreq: number, endFreq: number, duration: number, oscType: OscillatorType = "sine", delay = 0, startVol = 0.08) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
        
        gainNode.gain.setValueAtTime(startVol, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      switch (type) {
        case "click":
          playTone(1500, 0.05, "sine", 0, 0.1);
          break;
        case "coin":
          playTone(987.77, 0.08, "square", 0, 0.05);
          playTone(1318.51, 0.25, "square", 0.08, 0.05);
          break;
        case "levelup":
          playTone(523.25, 0.1, "square", 0.0, 0.05);
          playTone(659.25, 0.1, "square", 0.08, 0.05);
          playTone(783.99, 0.1, "square", 0.16, 0.05);
          playTone(1046.50, 0.1, "square", 0.24, 0.05);
          playTone(1318.51, 0.1, "square", 0.32, 0.05);
          playTone(1567.98, 0.15, "square", 0.40, 0.05);
          playTone(2093.00, 0.4, "square", 0.48, 0.05);
          break;
        case "correct":
          playTone(523.25, 0.15, "triangle", 0, 0.05);
          playTone(659.25, 0.15, "triangle", 0.04, 0.05);
          playTone(783.99, 0.25, "triangle", 0.08, 0.05);
          break;
        case "wrong":
          playFrequencySweep(350, 120, 0.35, "sawtooth", 0, 0.08);
          playFrequencySweep(250, 80, 0.4, "sawtooth", 0.2, 0.06);
          break;
        case "quest_complete":
          playTone(523.25, 0.12, "square", 0, 0.05);
          playTone(523.25, 0.12, "square", 0.15, 0.05);
          playTone(783.99, 0.15, "square", 0.30, 0.05);
          playTone(1046.50, 0.4, "square", 0.45, 0.05);
          break;
        case "heal":
          playTone(261.63, 0.25, "sine", 0.0, 0.08);
          playTone(329.63, 0.25, "sine", 0.06, 0.08);
          playTone(392.00, 0.25, "sine", 0.12, 0.08);
          playTone(523.25, 0.25, "sine", 0.18, 0.08);
          playTone(659.25, 0.25, "sine", 0.24, 0.08);
          playTone(783.99, 0.4, "sine", 0.30, 0.08);
          break;
        case "sync":
          playFrequencySweep(300, 1800, 0.6, "sine", 0, 0.06);
          break;
        case "cast_spell":
          playFrequencySweep(600, 1200, 0.15, "triangle", 0, 0.06);
          playFrequencySweep(1200, 800, 0.15, "triangle", 0.15, 0.06);
          break;
        case "danger":
          playTone(220, 0.15, "sawtooth", 0, 0.08);
          playTone(180, 0.15, "sawtooth", 0.18, 0.08);
          break;
        case "chat_send":
          playFrequencySweep(400, 1000, 0.15, "sine", 0, 0.05);
          break;
        case "chat_reply":
          playTone(659.25, 0.12, "triangle", 0, 0.05);
          playTone(987.77, 0.2, "triangle", 0.1, 0.05);
          break;
      }
    } catch (e) {}
  };

  const showToastMsg = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message: msg, type });
    if (type === "success") playGameSound("correct");
    else if (type === "error") playGameSound("wrong");
    else playGameSound("click");
  };

  const awardStats = (xpGain: number, goldGain: number, levelGain: number = 0) => {
    setGameState(prev => ({
      ...prev,
      currentXP: prev.currentXP + xpGain,
      goldCount: prev.goldCount + goldGain,
      level: prev.level + levelGain,
    }));
  };

  // Rest state helper
  const handleTavernRest = () => {
    if (gameState.goldCount < 10) {
      showToastMsg("GOLD DEFICIT: Rest requires 10 Gold Coins!", "error");
      return;
    }
    setGameState(prev => ({
      ...prev,
      goldCount: prev.goldCount - 10,
      playerHealth: prev.maxHealth
    }));
    showToastMsg(
      "REST AREA: Health restored to maximum!",
      "success"
    );
    playGameSound("heal");
  };

  // Send interactive invitation to peer
  const sendStudyInvitation = (peerName: string) => {
    showToastMsg(
      `INVITATION: Sent study invite to ${peerName}!`,
      "success"
    );
    playGameSound("cast_spell");
    
    // Simulate peer accepting after 2.5 seconds
    setTimeout(() => {
      setGameState(prev => {
        const bonusXP = 25;
        const newXP = prev.currentXP + bonusXP;
        const xpNeeded = prev.level * 100;
        let finalLvl = prev.level;
        let finalXP = newXP;
        
        if (newXP >= xpNeeded) {
          finalLvl += 1;
          finalXP = newXP - xpNeeded;
          setTimeout(() => showToastMsg(`LEVEL UP! You ascended to Level ${finalLvl}! 🌟`, "success"), 500);
        }
        
        playGameSound("coin");
        return {
          ...prev,
          currentXP: finalXP,
          level: finalLvl,
          goldCount: prev.goldCount + 15,
          starCount: prev.starCount + 1
        };
      });
      showToastMsg(
        `NETWORKED: ${peerName} joined your chat! +25 XP / +15 Gold`,
        "success"
      );
    }, 2500);
  };

  const completeQuest = async (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest) return;

    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    awardStats(quest.xpReward, quest.goldReward);
    showToastMsg(`QUEST COMPLETED: "${quest.title}" cleared!`, "success");
    playGameSound("quest_complete");
    
    if (authUser && !id.startsWith('custom_')) {
      try {
        await authFetch('/api/users/quests', {
          method: 'PATCH',
          body: JSON.stringify({ id, completed: true })
        });
      } catch (e) {
        console.error('Failed to complete quest in DB', e);
      }
    }
  };

  const deleteQuest = async (id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    showToastMsg("QUEST ABANDONED: Objective removed from log.", "info");
    
    if (authUser && !id.startsWith('custom_')) {
      try {
        await authFetch(`/api/users/quests?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete quest in DB', e);
      }
    }
  };

  const addCustomQuest = async (
    title: string,
    desc: string,
    qType: "daily" | "weekly" | "raid",
    diff: Difficulty
  ) => {
    const xpMap = {
      [Difficulty.EASY]: 30,
      [Difficulty.MEDIUM]: 60,
      [Difficulty.HARD]: 120,
      [Difficulty.LEGENDARY]: 250,
    };
    const goldMap = {
      [Difficulty.EASY]: 10,
      [Difficulty.MEDIUM]: 25,
      [Difficulty.HARD]: 50,
      [Difficulty.LEGENDARY]: 100,
    };
    
    const dueDate = qType === "daily" ? "Today" : qType === "weekly" ? "In 7 Days" : "Deadline";
    const optimisticId = "custom_" + Date.now();
    
    const newQ: Quest = {
      id: optimisticId,
      type: qType,
      title,
      description: desc,
      xpReward: xpMap[diff],
      goldReward: goldMap[diff],
      difficulty: diff,
      completed: false,
      dueDate,
    };

    setQuests(prev => [newQ, ...prev]);
    showToastMsg(`NEW QUEST: "${title}" added to objective log!`, "success");

    if (authUser) {
      try {
        const res = await authFetch('/api/users/quests', {
          method: 'POST',
          body: JSON.stringify({
            type: qType,
            title,
            description: desc,
            xpReward: xpMap[diff],
            goldReward: goldMap[diff],
            difficulty: diff,
            dueDate
          })
        });
        const data = await res.json();
        if (data.quest) {
          setQuests((prev) => prev.map(q => q.id === optimisticId ? data.quest : q));
        }
      } catch (e) {
        console.error('Failed to save quest to DB', e);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  NOTES (saves to Supabase if authenticated)
  // ═══════════════════════════════════════════════════════════════════════

  const addNote = async (
    title: string,
    subject: string,
    isPublic: boolean
  ) => {
    // Save to Supabase if logged in
    if (authUser) {
      if (isPublic) {
        // 1. Save to social feed
        try {
          await authFetch("/api/notes", {
            method: "POST",
            body: JSON.stringify({
              content: `**${title}**\n\n_(Note available in Notion)_`,
              type: "general",
              subject: subject,
              is_anonymous: false,
            }),
          });
        } catch {}
      }
      
      // 2. Save to user's private notes
      try {
        const res = await authFetch('/api/notion/notes', {
          method: 'POST',
          body: JSON.stringify({
            title,
            subject,
            isPublic
          })
        });
        const data = await res.json();
        if (data.note) {
          setNotes((prev) => [data.note, ...prev]);
          awardStats(15, 5);
          showToastMsg("NOTE WRITTEN: Study note recorded. +15 XP", "success");
          
          if (data.note.url) {
            window.open(data.note.url, '_blank');
          }
        }
      } catch (e) {
        console.error('Failed to save private note', e);
      }
    } else {
      showToastMsg("ERROR: Must be signed in and connected to Notion to create notes.", "error");
    }

    // Check daily quest
    const dailyQuest = quests.find(
      (q) => q.title === "Write First Note" && !q.completed
    );
    if (dailyQuest) {
      setTimeout(() => completeQuest(dailyQuest.id), 1200);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToastMsg("NOTE REMOVED: Study note erased.", "info");
    
    if (authUser && !id.startsWith('note_')) {
      try {
        await authFetch(`/api/notion/notes?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete note in DB', e);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  NOTION SYNC
  // ═══════════════════════════════════════════════════════════════════════
  const connectNotion = async () => {
    try {
      const res = await authFetch("/api/notion/oauth");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response. Is the backend server running?");
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("[connectNotion Error]", e);
      showToastMsg(`Failed to connect Notion: ${e.message}`, "error");
    }
  };

  const disconnectNotion = async () => {
    try {
      await authFetch("/api/notion/disconnect", { method: "POST" });
      setNotionStatus({ connected: false });
      showToastMsg("Notion Disconnected", "info");
    } catch (e) {
      console.error(e);
      showToastMsg("ERROR: Could not disconnect from Notion", "error");
    }
  };

  const syncNotionSimulator = async () => {
    if (notes.length === 0) {
      showToastMsg("EMPTY NOTES: Write at least 1 note to broadcast!", "error");
      return;
    }
    
    setIsSyncingNotion(true);
    setNotionSyncLogs([]);
    playGameSound("cast_spell");

    let useRealSync = false;
    if (authUser && notionStatus?.connected) {
      try {
        const res = await authFetch("/api/notion/sync", { method: "POST" });
        if (res.ok) useRealSync = true;
      } catch {}
    }

    const syncSteps = [
      `[00:01] ⚡ BROADCASTING PACKETS: Commencing Notion cloud handshake...`,
      `[00:05] 📡 CONNECTING: Target endpoint https://api.notion.com/v1/pages`,
      `[00:12] 🔑 CREDENTIALS REVEALED: Reading workspace database schema token...`,
      `[00:18] 🔄 TRANSMITTING: Synced block packaging initialized (${notes.length} notes)...`,
      `[00:25] 📤 UPLOADING note schemas onto synchronized Notion database...`,
      `[00:32] 🛡️ AUTHENTICATION STRIKE: Secure SHA-256 cloud envelope granted.`,
      `[00:40] 🚀 FINALIZING: Flushing API buffer caches...`,
      useRealSync
        ? `[00:45] ✅ SUCCESS: 200 OK. Notion page block pointers linked! (Live Sync)`
        : `[00:45] ✅ SUCCESS: 200 OK. Notion page block pointers linked!`,
      `[00:48] 💰 REWARDS DISPATCHED: Daily tasks payout complete.`,
    ];

    syncSteps.forEach((step, idx) => {
      setTimeout(() => {
        setNotionSyncLogs(prev => [...prev, step]);
        
        // Custom rapid retro handshake sweep
        if (!isMuted) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(400 + idx * 60, ctx.currentTime);
              gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.08);
            }
          } catch (e) {}
        }
        
        if (idx === syncSteps.length - 1) {
          setIsSyncingNotion(false);
          awardStats(180, 80, 2);
          showToastMsg("NOTION SYNCED: Sync channel completed! +180 XP / +80 Gold / +2 Gems", "success");
          playGameSound("sync");
        }
      }, (idx + 1) * 600);
    });
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  QUIZ ARENA (wired to /api/quiz or /api/gemini/quiz)
  // ═══════════════════════════════════════════════════════════════════════

  const resetQuiz = () => {
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setSelectedAnswerIdx(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
    setQuizAnswers([]);
    setQuizAlert(null);
  };

  const fetchAIQuiz = async () => {
    if (!quizTopic.trim()) {
      setQuizAlert("Input a target topic first!");
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizAlert(null);
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setSelectedAnswerIdx(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
    playGameSound("cast_spell");

    try {
      const response = await fetch("/api/gemini/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: quizSubject,
          topic: quizTopic,
          difficulty: quizDifficulty
        })
      });

      const resData = await response.json();

      // Handle both response formats
      let questions: QuizQuestion[] = [];
      if (authUser && resData.questions) {
        // Backend format: { q, opts, ans, exp }
        questions = resData.questions.map((q: any, i: number) => ({
          id: `q${i}`,
          question: q.q,
          options: q.opts,
          answerIndex: q.ans,
          contextExplanation: q.exp,
        }));
      } else if (resData.success && Array.isArray(resData.data)) {
        // Arcade Gemini format
        questions = resData.data;
      }

      if (questions.length > 0) {
        setQuizQuestions(questions);
        showToastMsg(
          `CHALLENGE STARTED: Engaged topic "${quizTopic}"!`,
          "success"
        );
      } else {
        throw new Error(resData.error || "Malformed quiz payload");
      }
    } catch (e: any) {
      console.error(e);
      setQuizAlert("API transmission issue. Reloading backup local mock quest...");
      showToastMsg("API FAILED: Running fallback local quiz.", "error");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizAnswerSubmit = () => {
    if (selectedAnswerIdx === null || !quizQuestions[currentQuizIdx]) return;
    
    setQuizSubmitted(true);
    const currentQ = quizQuestions[currentQuizIdx];
    
    if (selectedAnswerIdx === currentQ.answerIndex) {
      setQuizScore(prev => prev + 1);
      showToastMsg("CRITICAL LEARNING STRIKE! Correct answer.", "success");
      playGameSound("correct");
    } else {
      // Penalize health
      setGameState(prev => {
        const damage = quizDifficulty === Difficulty.LEGENDARY ? 25 : 15;
        const nextHealth = Math.max(0, prev.playerHealth - damage);
        if (nextHealth === 0) {
          setTimeout(
            () =>
              showToastMsg(
                "GAME OVER: HP depleted! Visit the Rest Area to restore HP.",
                "error"
              ),
            600
          );
          setTimeout(() => playGameSound("danger"), 100);
        } else if (nextHealth <= 25) {
          setTimeout(() => playGameSound("danger"), 100);
        }
        return { ...prev, playerHealth: nextHealth };
      });
      showToastMsg("SPELL FAILED: Incorrect answer. Health depleted!", "error");
      playGameSound("wrong");
    }
  };

  const handleQuizNext = () => {
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedAnswerIdx(null);
      setQuizSubmitted(false);
      playGameSound("click");
    } else {
      setQuizComplete(true);
      // Award grand statistics
      let goldBonus = 25;
      let xpBonus = 60;
      if (quizDifficulty === Difficulty.HARD) { goldBonus = 50; xpBonus = 120; }
      if (quizDifficulty === Difficulty.LEGENDARY) { goldBonus = 100; xpBonus = 250; }
      
      awardStats(xpBonus, goldBonus, 1);
      
      // Auto-complete quest
      const qQuest = quests.find(q => q.title === "Conquer CS Quiz Boss" && !q.completed);
      if (qQuest && quizSubject === "Computer Science") {
        setTimeout(() => completeQuest(qQuest.id), 1200);
      }
    }
  };

  // AI Flashcards via express endpoint
  const fetchAIFlashcards = async () => {
    if (!scrollsTopic.trim()) {
      setScrollsAlert("Input a target theme first!");
      return;
    }

    setIsGeneratingScrolls(true);
    setScrollsAlert(null);
    setFlashcards([]);
    setActiveCardIdx(0);
    setIsFlipped(false);
    playGameSound("cast_spell");

    try {
      const response = await fetch("/api/gemini/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: scrollsSubject,
          topic: scrollsTopic
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        setFlashcards(resData.data);
        showToastMsg(
          `FLASHCARDS GENERATED: ${resData.data.length} custom flashcards created for "${scrollsTopic}"!`,
          "success"
        );
      } else {
        throw new Error(resData.error || "Malformed flashcards payload");
      }
    } catch {
      setScrollsAlert(
        "Flashcard generator error. Using offline fallback..."
      );
      showToastMsg("API TIMEOUT: Used offline flashcards.", "error");
    } finally {
      setIsGeneratingScrolls(false);
    }
  };

  const markCardMastered = (id: string) => {
    if (masteredCards.includes(id)) return;
    setMasteredCards(prev => [...prev, id]);
    awardStats(25, 12);
    showToastMsg(
      "FLASHCARD MASTERED: Study intelligence upgraded! +25 XP / +12 Gold",
      "success"
    );
  };

  // AI Mascot Chat via express endpoint
  const handleMascotChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userText = chatMessage.trim();
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: userText }]);
    setIsChatLoading(true);
    playGameSound("chat_send");

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatHistory
        })
      });

      const resData = await response.json();
      if (resData.success && resData.reply) {
        setChatHistory(prev => [...prev, { role: "model", text: resData.reply }]);
        playGameSound("chat_reply");
      } else {
        throw new Error(resData.error || "Malformed chat payload");
      }
    } catch (e) {
      showToastMsg("CHAT NODES DISCONNECTED: Running fallback mascot.", "error");
      setChatHistory(prev => [
        ...prev,
        {
          role: "model",
          text: "[RECOVERY SIGNAL]: BEEP BOOP! Pixel Sage core buffer timeout! To activate deep dynamic conversations with me, please verify your process.env.GEMINI_API_KEY is configured."
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const triggerStudySpell = (prompt: string) => {
    if (isChatLoading) return;
    setChatMessage(prompt);
    // Submit programmatically in next microtask
    setTimeout(() => {
      const form = document.getElementById("mascot-form") as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  DERIVED VALUES
  // ═══════════════════════════════════════════════════════════════════════

  const activeSkinObj =
    AVATAR_SKINS.find((s) => s.id === gameState.activeSkin) || AVATAR_SKINS[0];

  // ═══════════════════════════════════════════════════════════════════════
  //  AUTH LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════════════

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080710] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl float-anim">🕹️</div>
          <div className="font-press text-blue-400 text-xs animate-pulse uppercase">
            Loading Network...
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  AUTH GATE
  // ═══════════════════════════════════════════════════════════════════════

  if (!authUser) {
    return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MAIN ARCADE UI
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#080710] text-zinc-100 p-1.5 sm:p-2.5 font-sans relative overflow-x-hidden select-none crt-screen crt-scanlines">
      <div className="w-full max-w-full space-y-4">
        


        {/* ======================================================== */}
        {/* RETRO TOAST ALERTS OVERLAY */}
        {/* ======================================================== */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 max-w-sm font-press text-[11px] p-4 border-4 bg-black select-text shadow-xl"
              style={{
                borderColor: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6",
                color: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6"
              }}
            >
              <div className="flex gap-2">
                <span>{toast.type === "success" ? "📢" : toast.type === "error" ? "❌" : "🔔"}</span>
                <p className="leading-normal">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* RETRO ARCADE BODY CABINET LAYOUT */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          
          {/* RETRO SIDEBAR NAVIGATION PANEL */}
          <nav className="col-span-1 md:col-span-3 space-y-3.5 select-none text-left">
            <div className="bg-black border-2 border-zinc-800 p-2 px-3 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-press uppercase tracking-wider font-bold">
                🗺️ MAIN RADAR MENU
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 bg-zinc-900 border border-zinc-700 text-white hover:border-[#3b82f6] cursor-pointer"
                title={isMuted ? "Unmute Retro Synthesizer" : "Mute Sound"}
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </motion.button>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { id: "guild_hall", label: "Dashboard", icon: Users, color: "#10b981" },
                { id: "hero_profile", label: "Hero Profile", icon: User, color: "#f59e0b" },
                { id: "peer_chat", label: "Peer Chat", icon: MessageSquare, color: "#10b981" },
                { id: "quiz_arena", label: "Quiz Arena", icon: Gamepad2, color: "#3b82f6" },
                { id: "knowledge_scrolls", label: "Study Flashcards", icon: BookOpen, color: "#ec4899" },
                { id: "quests", label: "Quest Book", icon: ListTodo, color: "#8b5cf6" },
                { id: "scribe_chamber", label: "Study Notes", icon: Database, color: "#10b981" },
                { id: "neuro_mascot", label: "Pixel Sage", icon: Sparkles, color: "#8b5cf6" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      playGameSound("click");
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96, y: 3 }}
                    className={`p-3 border-2 flex items-center gap-3.5 transition-all text-left uppercase font-press text-[11px] cursor-pointer font-bold relative ${
                      isActive 
                        ? `bg-black border-[${tab.color}] shadow-[0_4px_0_#000] text-white ring-2 ring-[${tab.color}]/40`
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                    style={{
                      borderColor: isActive ? tab.color : undefined,
                    }}
                  >
                    <TabIcon className="w-4 h-4 shrink-0" style={{ color: isActive ? tab.color : undefined }} />
                    <span className="truncate">{tab.label}</span>
                    {isActive && (
                      <span className="absolute right-3.5 text-xs animate-ping" style={{ color: tab.color }}>●</span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* MINI RETRO AVATAR SHOP */}
            <div className="bg-black border-2 border-zinc-800 p-4 space-y-3.5">
              <span className="text-[9px] font-press text-amber-400 uppercase tracking-widest block font-bold">
                🛡️ AVATAR SKIN LOCKER
              </span>

              <div className="space-y-2">
                {AVATAR_SKINS.map((skin) => {
                  const isUnlocked = gameState.unlockedSkins.includes(skin.id);
                  const isActive = gameState.activeSkin === skin.id;

                  const handleSkinAction = () => {
                    if (isActive) return;
                    if (isUnlocked) {
                      setGameState(prev => ({ ...prev, activeSkin: skin.id }));
                      showToastMsg(`EQUIPPED SKIN: Equipped "${skin.name}"!`, "success");
                      playGameSound("click");
                    } else {
                      // Purchase
                      if (gameState.goldCount < skin.cost) {
                        showToastMsg(`GOLD COIN SHORTAGE: Purchase needs ${skin.cost} Gold!`, "error");
                        return;
                      }
                      setGameState(prev => ({
                        ...prev,
                        goldCount: prev.goldCount - skin.cost,
                        unlockedSkins: [...prev.unlockedSkins, skin.id],
                        activeSkin: skin.id
                      }));
                      showToastMsg(`ACQUIRED SKIN: Bought and equipped "${skin.name}"!`, "success");
                      playGameSound("coin");
                    }
                  };

                  return (
                    <div 
                      key={skin.id}
                      className={`p-2 bg-zinc-950 border flex items-center justify-between text-left ${
                        isActive ? "border-amber-400" : "border-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xl shrink-0">{skin.spriteUrl}</span>
                        <div className="truncate">
                          <span className="text-[10px] font-press text-white block truncate leading-tight">{skin.name}</span>
                          <span className="text-[9px] font-pixel text-zinc-400 uppercase block truncate">{skin.powerName}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleSkinAction}
                        className={`font-press text-[8px] p-1.5 px-2 border uppercase cursor-pointer shrink-0 font-bold ${
                          isActive 
                            ? "bg-amber-400 text-black border-white"
                            : isUnlocked
                              ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                              : "bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500"
                        }`}
                      >
                        {isActive ? "ACTIVE" : isUnlocked ? "EQUIP" : `💰${skin.cost}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </nav>

          {/* MAIN MODULE WORKSPACE CONTAINER */}
          <main className="col-span-1 md:col-span-9 border-4 border-zinc-800 bg-black/90 p-4 sm:p-5 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === "guild_hall" && (
                  <GuildHall
                    gameState={gameState}
                    nickname={nickname}
                    setNickname={setNickname}
                    avatarEmoji={avatarEmoji}
                    activeSkinObj={activeSkinObj}
                    handleTavernRest={handleTavernRest}
                    sendStudyInvitation={sendStudyInvitation}
                    INITIAL_PEERS={realPeers}
                    playSound={playGameSound}
                    onOpenChat={(peerId) => {
                      setActivePeerId(peerId);
                      setActiveTab("peer_chat");
                      playGameSound("click");
                    }}
                  />
                )}

                {activeTab === "hero_profile" && (
                  <ProfileDashboard
                    gameState={gameState}
                    setGameState={setGameState}
                    AVATAR_SKINS={AVATAR_SKINS}
                    nickname={nickname}
                    setNickname={setNickname}
                    college={college}
                    setCollege={setCollege}
                    email={email}
                    setEmail={setEmail}
                    knownSkills={knownSkills}
                    setKnownSkills={setKnownSkills}
                    desiredSkills={desiredSkills}
                    setDesiredSkills={setDesiredSkills}
                    avatarEmoji={avatarEmoji}
                    setAvatarEmoji={setAvatarEmoji}
                    profileFrame={profileFrame}
                    setProfileFrame={setProfileFrame}
                    activeThemeId={activeThemeId}
                    setActiveThemeId={setActiveThemeId}
                    playSound={playGameSound}
                    showToast={showToastMsg}
                  />
                )}

                {activeTab === "peer_chat" && (
                  <PeerChatDashboard
                    nickname={nickname}
                    INITIAL_PEERS={INITIAL_PEERS}
                    activePeerId={activePeerId}
                    setActivePeerId={setActivePeerId}
                    peerChatHistories={peerChatHistories}
                    sendPeerMessage={sendPeerMessage}
                    peerChatLoading={peerChatLoading}
                    playSound={playGameSound}
                  />
                )}

                {activeTab === "quiz_arena" && (
                  <QuizArena
                    quizSubject={quizSubject}
                    setQuizSubject={setQuizSubject}
                    quizTopic={quizTopic}
                    setQuizTopic={setQuizTopic}
                    quizDifficulty={quizDifficulty}
                    setQuizDifficulty={setQuizDifficulty}
                    isGeneratingQuiz={isGeneratingQuiz}
                    quizQuestions={quizQuestions}
                    currentQuizIdx={currentQuizIdx}
                    selectedAnswerIdx={selectedAnswerIdx}
                    setSelectedAnswerIdx={setSelectedAnswerIdx}
                    quizSubmitted={quizSubmitted}
                    quizScore={quizScore}
                    quizComplete={quizComplete}
                    quizAlert={quizAlert}
                    fetchAIQuiz={fetchAIQuiz}
                    resetQuiz={resetQuiz}
                    handleQuizAnswerSubmit={handleQuizAnswerSubmit}
                    handleQuizNext={handleQuizNext}
                    playSound={playGameSound}
                  />
                )}

                {activeTab === "knowledge_scrolls" && (
                  <KnowledgeScrolls
                    scrollsSubject={scrollsSubject}
                    setScrollsSubject={setScrollsSubject}
                    scrollsTopic={scrollsTopic}
                    setScrollsTopic={setScrollsTopic}
                    isGeneratingScrolls={isGeneratingScrolls}
                    flashcards={flashcards}
                    activeCardIdx={activeCardIdx}
                    setActiveCardIdx={setActiveCardIdx}
                    isFlipped={isFlipped}
                    setIsFlipped={setIsFlipped}
                    masteredCards={masteredCards}
                    markCardMastered={markCardMastered}
                    scrollsAlert={scrollsAlert}
                    fetchAIFlashcards={fetchAIFlashcards}
                    playSound={playGameSound}
                  />
                )}

                {activeTab === "quests" && (
                  <QuestBook
                    quests={quests}
                    completeQuest={completeQuest}
                    deleteQuest={deleteQuest}
                    addCustomQuest={addCustomQuest}
                    playSound={playGameSound}
                  />
                )}

                {activeTab === "scribe_chamber" && (
                  <ScribeChamber
                    notes={notes}
                    addNote={addNote}
                    deleteNote={deleteNote}
                    notionStatus={notionStatus}
                    connectNotion={connectNotion}
                    disconnectNotion={disconnectNotion}
                    syncNotionSimulator={syncNotionSimulator}
                    isSyncingNotion={isSyncingNotion}
                    notionSyncLogs={notionSyncLogs}
                    playSound={playGameSound}
                  />
                )}

                {activeTab === "neuro_mascot" && (
                  <PixelSageMascot
                    nickname={nickname}
                    chatHistory={chatHistory}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    isChatLoading={isChatLoading}
                    handleMascotChat={handleMascotChat}
                    triggerStudySpell={triggerStudySpell}
                    playSound={playGameSound}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          </main>

        </div>

        {/* ======================================================== */}
        {/* RETRO CABINET FOOTER BAR */}
        {/* ======================================================== */}
        <footer className="border-4 border-zinc-800 bg-black p-4 text-center select-none text-xs space-y-1.5 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 font-press text-[9px] text-[#3b82f6] font-bold">
            <span className="uppercase">
              🕹️ SYSTEM ARCHITECTURE STATUS: CORE POWER ENVELOPE STABLE
            </span>
            <span className="uppercase">
              [CHANNEL PORT: 3000] • [SECURE SHARED CONNECTION]
            </span>
          </div>
          <p className="text-[10px] font-pixel text-zinc-500 max-w-3xl mx-auto leading-normal">
            PeerLearn Arcade v2.0 integrates gamified RPG mechanics, real-time
            Supabase persistence, and AI-grounded study models with Google Gemini.
            Master subject areas, compete in MCQ tests, sync data to Notion, and
            complete challenges with your study network.
          </p>
        </footer>

      </div>
    </div>
  );
}
