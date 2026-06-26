/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  LEGENDARY = "LEGENDARY"
}

export interface GameState {
  currentXP: number;
  level: number;
  goldCount: number;
  jewelCount: number;
  starCount: number;
  swordPower: number;
  playerHealth: number;
  maxHealth: number;
  unlockedSkins: string[];
  activeSkin: string;
}

export interface NoteBlock {
  id: string;
  title: string;
  content: string;
  author: string;
  color: string; // 'green' | 'pink' | 'blue' | 'purple'
  date: string;
  tags: string[];
}

export interface Quest {
  id: string;
  type: "daily" | "weekly" | "raid";
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: Difficulty;
  completed: boolean;
  dueDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "exam" | "study_group" | "project_milestone";
  date: string;
  rewardXP: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  contextExplanation: string;
}

export interface SkillProfile {
  id: string;
  name: string;
  level: number;
  avatarSkin: string;
  skillsToGive: string[];
  skillsToLearn: string[];
  status: string;
  isOnline: boolean;
  xpEarned: number;
}

export interface AvatarSkin {
  id: string;
  name: string;
  cost: number;
  spriteUrl: string; // for display
  borderColor: string;
  textColor: string;
  powerName: string;
}

export interface AppTheme {
  id: string;
  name: string;
  primaryColor: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  bgHoverClass: string;
  pixelBoxClass: string;
  textShadowClass: string;
  accentTextClass: string;
  primaryBgLightClass: string;
  accentColor: string;
  glowColor: string;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "green",
    name: "Neon Emerald (Green)",
    primaryColor: "#10b981",
    textClass: "text-[#10b981]",
    borderClass: "border-[#10b981]",
    bgClass: "bg-[#022c22]",
    bgHoverClass: "hover:bg-[#059669]",
    pixelBoxClass: "pixel-box-green",
    textShadowClass: "text-retro-shadow-green",
    accentTextClass: "text-emerald-400",
    primaryBgLightClass: "bg-[#022c22]/50",
    accentColor: "emerald-400",
    glowColor: "rgba(16,185,129,0.4)"
  },
  {
    id: "pink",
    name: "Cyber Punk (Pink)",
    primaryColor: "#ec4899",
    textClass: "text-[#ec4899]",
    borderClass: "border-[#ec4899]",
    bgClass: "bg-[#50072b]",
    bgHoverClass: "hover:bg-[#db2777]",
    pixelBoxClass: "pixel-box-pink",
    textShadowClass: "text-retro-shadow-pink",
    accentTextClass: "text-pink-400",
    primaryBgLightClass: "bg-[#50072b]/50",
    accentColor: "pink-400",
    glowColor: "rgba(236,72,153,0.4)"
  },
  {
    id: "blue",
    name: "Ocean Sorcerer (Blue)",
    primaryColor: "#3b82f6",
    textClass: "text-[#3b82f6]",
    borderClass: "border-[#3b82f6]",
    bgClass: "bg-[#172554]",
    bgHoverClass: "hover:bg-[#2563eb]",
    pixelBoxClass: "pixel-box-blue",
    textShadowClass: "text-retro-shadow-blue",
    accentTextClass: "text-blue-400",
    primaryBgLightClass: "bg-[#172554]/50",
    accentColor: "blue-400",
    glowColor: "rgba(59,130,246,0.4)"
  },
  {
    id: "purple",
    name: "Cosmic Void (Purple)",
    primaryColor: "#8b5cf6",
    textClass: "text-[#8b5cf6]",
    borderClass: "border-[#8b5cf6]",
    bgClass: "bg-[#2e1065]",
    bgHoverClass: "hover:bg-[#7c3aed]",
    pixelBoxClass: "pixel-box-purple",
    textShadowClass: "text-retro-shadow-purple",
    accentTextClass: "text-purple-400",
    primaryBgLightClass: "bg-[#2e1065]/50",
    accentColor: "purple-400",
    glowColor: "rgba(139,92,246,0.4)"
  },
  {
    id: "amber",
    name: "Golden Relic (Amber)",
    primaryColor: "#f59e0b",
    textClass: "text-[#f59e0b]",
    borderClass: "border-[#f59e0b]",
    bgClass: "bg-[#451a03]",
    bgHoverClass: "hover:bg-[#d97706]",
    pixelBoxClass: "pixel-box-amber",
    textShadowClass: "text-retro-shadow-amber",
    accentTextClass: "text-amber-400",
    primaryBgLightClass: "bg-[#451a03]/50",
    accentColor: "amber-400",
    glowColor: "rgba(245,158,11,0.4)"
  }
];
