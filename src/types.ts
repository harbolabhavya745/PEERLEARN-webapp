/**
 * PeerLearn Arcade – Shared TypeScript types
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
  spriteUrl: string; // emoji for display
  borderColor: string;
  textColor: string;
  powerName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  xp?: number;
  level?: number;
  avatar_skin?: string;
  avatar_url?: string;
  streak?: number;
}
