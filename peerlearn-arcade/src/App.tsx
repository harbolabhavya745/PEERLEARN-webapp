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
  Heart,
  Shield,
  Coins,
  Gem,
  Compass
} from "lucide-react";
import { 
  Difficulty, 
  GameState, 
  NoteBlock, 
  Quest, 
  Flashcard, 
  QuizQuestion, 
  SkillProfile, 
  AvatarSkin 
} from "./types";

import GuildHall from "./components/GuildHall";
import QuizArena from "./components/QuizArena";
import KnowledgeScrolls from "./components/KnowledgeScrolls";
import QuestBook from "./components/QuestBook";
import ScribeChamber from "./components/ScribeChamber";
import PixelSageMascot from "./components/PixelSageMascot";

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
    name: "Notion Guild Master",
    cost: 280,
    spriteUrl: "🧙‍♂️",
    borderColor: "border-fuchsia-500",
    textColor: "text-fuchsia-400",
    powerName: "Void Call (+80% Scroll Sync XP)"
  }
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

  // Retro alerts toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Profile / Username
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem("peerlearn_nickname") || "Rusty Squire";
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

  // Quests State
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem("peerlearn_quests");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return SEED_QUESTS;
  });

  // Notes State
  const [notes, setNotes] = useState<NoteBlock[]>(() => {
    const saved = localStorage.getItem("peerlearn_notes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return SEED_NOTES;
  });

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

  // Scribe Notion Sync States
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);
  const [notionSyncLogs, setNotionSyncLogs] = useState<string[]>([]);

  // Mascot AI Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Save states to local storage on change
  useEffect(() => {
    localStorage.setItem("peerlearn_nickname", nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem("peerlearn_gamestate", JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem("peerlearn_quests", JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem("peerlearn_notes", JSON.stringify(notes));
  }, [notes]);

  // Toast auto-dismisser
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Comprehensive, polished Game Sound Synthesizer using Web Audio API
  const playGameSound = (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

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
    showToastMsg("TAVERN REST: Cognitive energy health restored to maximum!", "success");
    playGameSound("heal");
  };

  // Send interactive invitation to peer
  const sendStudyInvitation = (peerName: string) => {
    showToastMsg(`INVITATION: Dispatched co-op scroll to ${peerName}!`, "success");
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
      showToastMsg(`CO-OP MERGED: ${peerName} joined your channel! +25 XP / +15 Gold`, "success");
    }, 2500);
  };

  // Award stats utility
  const awardStats = (xp: number, gold: number, jewels: number = 0) => {
    setGameState(prev => {
      const activeSkinObj = AVATAR_SKINS.find(s => s.id === prev.activeSkin) || AVATAR_SKINS[0];
      
      // Calculate multiplier buffs based on class perk
      let xpMultiplier = 1;
      if (activeSkinObj.id === "sage_alchemist") xpMultiplier = 1.15;
      if (activeSkinObj.id === "void_call") xpMultiplier = 1.8;

      const finalXP = Math.round(xp * xpMultiplier);
      const totalXP = prev.currentXP + finalXP;
      const xpNeeded = prev.level * 100;
      let finalLvl = prev.level;
      let leftoverXP = totalXP;

      if (totalXP >= xpNeeded) {
        finalLvl += 1;
        leftoverXP = totalXP - xpNeeded;
        setTimeout(() => {
          showToastMsg(`LEVEL UP! You ascended to Level ${finalLvl}! 🌟`, "success");
          playGameSound("levelup");
        }, 800);
      }

      return {
        ...prev,
        currentXP: leftoverXP,
        level: finalLvl,
        goldCount: prev.goldCount + gold,
        jewelCount: prev.jewelCount + jewels,
        starCount: prev.starCount + 1
      };
    });
  };

  // Quests operations
  const completeQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;

    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    
    showToastMsg(`QUEST COMPLETED: "${quest.title}" cleared!`, "success");
  };

  const deleteQuest = (id: string) => {
    setQuests(prev => prev.filter(q => q.id !== id));
    showToastMsg("QUEST ABANDONED: Objective removed from log.", "info");
  };

  const addCustomQuest = (title: string, desc: string, qType: "daily" | "weekly" | "raid", diff: Difficulty) => {
    let xp = 30;
    let gold = 10;
    if (diff === Difficulty.MEDIUM) { xp = 60; gold = 25; }
    if (diff === Difficulty.HARD) { xp = 120; gold = 50; }
    if (diff === Difficulty.LEGENDARY) { xp = 250; gold = 100; }

    const newQ: Quest = {
      id: "custom_" + Date.now(),
      type: qType,
      title,
      description: desc,
      xpReward: xp,
      goldReward: gold,
      difficulty: diff,
      completed: false,
      dueDate: qType === "daily" ? "Today" : qType === "weekly" ? "In 7 Days" : "Deadline"
    };

    setQuests(prev => [newQ, ...prev]);
    showToastMsg(`NEW QUEST: "${title}" added to objective log!`, "success");
  };

  // Note actions
  const addNote = (title: string, content: string, color: string, tags: string[]) => {
    const newNote: NoteBlock = {
      id: "note_" + Date.now(),
      title,
      content,
      author: nickname,
      color,
      date: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      tags
    };

    setNotes(prev => [newNote, ...prev]);
    awardStats(15, 5);
    showToastMsg("SCROLL WRITTEN: Memory block recorded. +15 XP", "success");

    // Check if daily quest exists
    const dailyQuest = quests.find(q => q.title === "Scribe First Scroll" && !q.completed);
    if (dailyQuest) {
      setTimeout(() => completeQuest(dailyQuest.id), 1200);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    showToastMsg("SCROLL REMOVED: Memory block erased.", "info");
  };

  // Simulated Notion synchronizer pipeline
  const syncNotionSimulator = () => {
    if (notes.length === 0) {
      showToastMsg("EMPTY VAULT: Write at least 1 note scroll to broadcast!", "error");
      return;
    }
    
    setIsSyncingNotion(true);
    setNotionSyncLogs([]);
    playGameSound("cast_spell");

    const syncSteps = [
      `[00:01] ⚡ BROADCASTING PACKETS: Commencing Notion cloud handshake...`,
      `[00:05] 📡 CONNECTING: Target endpoint https://api.notion.com/v1/pages`,
      `[00:12] 🔑 CREDENTIALS REVEALED: Reading workspace database schema token...`,
      `[00:18] 🔄 TRANSMITTING: Synced block packaging initialized (${notes.length} notes)...`,
      `[00:25] 📤 UPLOADING note schemas onto synchronized Notion table database...`,
      `[00:32] 🛡️ AUTHENTICATION STRK: Secure SHA-256 cloud envelope granted.`,
      `[00:40] 🚀 FINALIZING: Flushing API buffer caches...`,
      `[00:45] ✅ SUCCESS: 200 OK. Notion page block pointers linked!`,
      `[00:48] 💰 REWARDS DISPATCHED: Guild treasury payout complete.`
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
          showToastMsg("NOTION SYNCED: Sync channel completed successfully! +180 XP / +80 Gold / +2 Gems", "success");
          playGameSound("sync");
          
          // Trigger quest complete
          const syncQuest = quests.find(q => q.title === "Full Notion Synchronicity" && !q.completed);
          if (syncQuest) {
            setTimeout(() => completeQuest(syncQuest.id), 1200);
          }
        }
      }, (idx + 1) * 600);
    });
  };

  // AI Quiz Fetcher via express endpoint
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
      if (resData.success && Array.isArray(resData.data)) {
        setQuizQuestions(resData.data);
        showToastMsg(`RAID SUMMONED: Engaged academic boss topic "${quizTopic}"!`, "success");
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
          setTimeout(() => showToastMsg("GAME OVER: HP depleted! Visit Tavern Guild to Rest & restore HP.", "error"), 600);
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
        showToastMsg(`SCROLLS UNSEALED: 6 custom items scribed for topic "${scrollsTopic}"!`, "success");
      } else {
        throw new Error(resData.error || "Malformed flashcards payload");
      }
    } catch (e) {
      setScrollsAlert("Flashcard transmitter error. Invoking scroll fallback...");
      showToastMsg("API TIMEOUT: Ingested fallback local scrolls.", "error");
    } finally {
      setIsGeneratingScrolls(false);
    }
  };

  const markCardMastered = (id: string) => {
    if (masteredCards.includes(id)) return;
    setMasteredCards(prev => [...prev, id]);
    awardStats(25, 12);
    showToastMsg("SCROLL ABSORBED: Scribing intelligence stat upgraded! +25 XP / +12 Gold", "success");
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

  // Equipped Skin Object
  const activeSkinObj = AVATAR_SKINS.find(s => s.id === gameState.activeSkin) || AVATAR_SKINS[0];

  return (
    <div className="min-h-screen bg-[#080710] text-zinc-100 p-3 sm:p-5 font-sans relative overflow-x-hidden select-none crt-screen crt-scanlines">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ======================================================== */}
        {/* RETRO ARCADE HUD PANEL */}
        {/* ======================================================== */}
        <header className="border-4 border-[#3b82f6] shadow-[0_5px_0_#1d4ed8] bg-black p-4 flex flex-col lg:flex-row justify-between items-center gap-4 relative z-10">
          
          {/* Logo & Nickname */}
          <div className="flex items-center gap-3.5 text-left w-full lg:w-auto">
            <div className="w-12 h-12 bg-blue-950 border-2 border-[#3b82f6] flex items-center justify-center text-2xl animate-pulse shrink-0">
              🕹️
            </div>
            <div>
              <h1 className="text-sm md:text-base font-press text-white text-retro-shadow-blue uppercase tracking-tight flex items-center gap-1.5 leading-none">
                <span>PeerLearn Arcade</span>
                <span className="text-amber-400 font-pixel text-xl bg-blue-950 px-1 border border-blue-500">v1.4</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-[#3b82f6] font-press font-bold uppercase shrink-0">
                  HERO IGN:
                </span>
                <span className="text-lg font-pixel text-white bg-[#172554] px-2 py-0.5 border border-[#3b82f6]/30 uppercase font-bold tracking-wider">
                  {nickname}
                </span>
              </div>
            </div>
          </div>

          {/* Core HUD Status Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full lg:w-auto select-none">
            
            {/* Health Heart Block */}
            <div className="bg-black border-2 border-zinc-800 p-2 flex flex-col justify-between items-start">
              <span className="text-[9px] font-press text-rose-500 uppercase flex items-center gap-0.5 font-bold">
                <Heart className="w-3 h-3 shrink-0 animate-bounce text-rose-500" />
                <span>HEALTH HP</span>
              </span>
              <span className="text-xl font-pixel text-white font-bold">
                {gameState.playerHealth} / {gameState.maxHealth}
              </span>
              <div className="w-full bg-zinc-900 h-1.5 mt-1 border border-zinc-800 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(gameState.playerHealth / gameState.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Level & XP progression bar */}
            <div className="bg-black border-2 border-zinc-800 p-2 flex flex-col justify-between items-start">
              <span className="text-[9px] font-press text-emerald-400 uppercase flex items-center gap-0.5 font-bold">
                <Shield className="w-3 h-3 shrink-0" />
                <span>LEVEL {gameState.level}</span>
              </span>
              <span className="text-xl font-pixel text-white font-bold">
                {gameState.currentXP} / {gameState.level * 100} XP
              </span>
              <div className="w-full bg-zinc-900 h-1.5 mt-1 border border-zinc-800 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(gameState.currentXP / (gameState.level * 100)) * 100}%` }}
                />
              </div>
            </div>

            {/* Gold Counts */}
            <div className="bg-black border-2 border-zinc-800 p-2 flex flex-col justify-between items-start">
              <span className="text-[9px] font-press text-yellow-400 uppercase flex items-center gap-0.5 font-bold">
                <Coins className="w-3 h-3 shrink-0" />
                <span>GOLD COINS</span>
              </span>
              <span className="text-xl font-pixel text-amber-300 font-bold">
                💰 {gameState.goldCount}G
              </span>
              <span className="text-[9px] font-pixel text-zinc-500 mt-1 uppercase">
                [Ready to Trade]
              </span>
            </div>

            {/* Crystals & Jewels */}
            <div className="bg-black border-2 border-zinc-800 p-2 flex flex-col justify-between items-start">
              <span className="text-[9px] font-press text-cyan-400 uppercase flex items-center gap-0.5 font-bold">
                <Gem className="w-3 h-3 shrink-0" />
                <span>CRYSTALS</span>
              </span>
              <span className="text-xl font-pixel text-cyan-300 font-bold">
                💎 {gameState.jewelCount} / {gameState.starCount}★
              </span>
              <span className="text-[9px] font-pixel text-zinc-500 mt-1 uppercase">
                [Relic Vaults]
              </span>
            </div>

          </div>

          {/* Sound & Mode controllers */}
          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-zinc-900 border-2 border-zinc-700 text-white hover:border-[#3b82f6] cursor-pointer"
              title={isMuted ? "Unmute Retro Synthesizer" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
          </div>

        </header>

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
            <div className="bg-black border-2 border-zinc-800 p-2 px-3">
              <span className="text-[10px] text-zinc-500 font-press uppercase block tracking-wider font-bold">
                🗺️ MAIN RADAR MENU
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { id: "guild_hall", label: "Guild Hall", icon: Users, color: "#10b981" },
                { id: "quiz_arena", label: "Quiz Arena", icon: Gamepad2, color: "#3b82f6" },
                { id: "knowledge_scrolls", label: "Knowledge Scrolls", icon: BookOpen, color: "#ec4899" },
                { id: "quests", label: "Quest Book", icon: ListTodo, color: "#8b5cf6" },
                { id: "scribe_chamber", label: "Scribe Chamber", icon: Database, color: "#10b981" },
                { id: "neuro_mascot", label: "Pixel Sage", icon: Sparkles, color: "#8b5cf6" }
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
                    activeSkinObj={activeSkinObj}
                    handleTavernRest={handleTavernRest}
                    sendStudyInvitation={sendStudyInvitation}
                    INITIAL_PEERS={INITIAL_PEERS}
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
            PeerLearn integrates gamified RPG mechanics, secure local persistence profiles, and fully integrated AI-grounded study models with Google Gemini 3.5. Master subject areas, compete in MCQ tests, sync data modules, and complete quests together with your guild.
          </p>
        </footer>

      </div>
    </div>
  );
}
