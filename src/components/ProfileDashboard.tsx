import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  GraduationCap, 
  Wrench, 
  Plus, 
  X, 
  Check, 
  Camera, 
  ShieldAlert, 
  Sparkles, 
  Award,
  Crown
} from "lucide-react";
import { GameState, AvatarSkin, AppTheme, APP_THEMES } from "../types";

// Frame definitions for profile preview styling
export interface ProfileFrame {
  id: string;
  name: string;
  borderColorClass: string;
  bgGradientClass: string;
  textAccentClass: string;
  glowClass: string;
}

export const PROFILE_FRAMES: ProfileFrame[] = [
  {
    id: "neon_green",
    name: "Neon Green Guard",
    borderColorClass: "border-[#10b981]",
    bgGradientClass: "from-[#022c22] to-black",
    textAccentClass: "text-[#10b981]",
    glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
  },
  {
    id: "cyber_cyan",
    name: "Cyber Cyan Hacker",
    borderColorClass: "border-cyan-500",
    bgGradientClass: "from-[#083344] to-black",
    textAccentClass: "text-cyan-400",
    glowClass: "shadow-[0_0_15px_rgba(6,182,212,0.3)]"
  },
  {
    id: "cosmic_violet",
    name: "Cosmic Void Mage",
    borderColorClass: "border-fuchsia-500",
    bgGradientClass: "from-[#4a044e] to-black",
    textAccentClass: "text-fuchsia-400",
    glowClass: "shadow-[0_0_15px_rgba(217,70,239,0.3)]"
  },
  {
    id: "golden_pixel",
    name: "Gold Champion",
    borderColorClass: "border-amber-500",
    bgGradientClass: "from-[#78350f] to-black",
    textAccentClass: "text-amber-400",
    glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse"
  },
  {
    id: "zinc_heavy",
    name: "Heavy Iron Knight",
    borderColorClass: "border-zinc-500",
    bgGradientClass: "from-zinc-900 to-black",
    textAccentClass: "text-zinc-400",
    glowClass: "shadow-[0_0_10px_rgba(115,115,115,0.2)]"
  }
];

// Preset list of cute avatar emojis for customization
const AVATAR_EMOJIS = [
  "🛡️", "🧪", "🥷", "🧙‍♂️", "✨", "👾", "🤖", "🔥", "🪐", "🍕", "🎮", "📚", "🦊", "👑", "🚀", "💡", "🧠", "🍀"
];

interface ProfileDashboardProps {
  // Stats & State
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  AVATAR_SKINS: AvatarSkin[];
  
  // Custom Profile Attributes
  nickname: string;
  setNickname: (name: string) => void;
  college: string;
  setCollege: (college: string) => void;
  email: string;
  setEmail: (email: string) => void;
  knownSkills: string[];
  setKnownSkills: React.Dispatch<React.SetStateAction<string[]>>;
  desiredSkills: string[];
  setDesiredSkills: React.Dispatch<React.SetStateAction<string[]>>;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  profileFrame: string;
  setProfileFrame: (frameId: string) => void;
  
  // Custom theme control
  activeThemeId: string;
  setActiveThemeId: (themeId: string) => void;
  
  // Audio Feedback
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function ProfileDashboard({
  gameState,
  setGameState,
  AVATAR_SKINS,
  nickname,
  setNickname,
  college,
  setCollege,
  email,
  setEmail,
  knownSkills,
  setKnownSkills,
  desiredSkills,
  setDesiredSkills,
  avatarEmoji,
  setAvatarEmoji,
  profileFrame,
  setProfileFrame,
  activeThemeId,
  setActiveThemeId,
  playSound,
  showToast
}: ProfileDashboardProps) {
  
  // Local temporary edits
  const [tempNickname, setTempNickname] = useState(nickname);
  const [tempCollege, setTempCollege] = useState(college);
  const [tempEmail, setTempEmail] = useState(email);
  
  // Skills add input states
  const [newKnownSkill, setNewKnownSkill] = useState("");
  const [newDesiredSkill, setNewDesiredSkill] = useState("");

  // Select frame object
  const activeFrameObj = PROFILE_FRAMES.find(f => f.id === profileFrame) || PROFILE_FRAMES[0];
  const activeSkinObj = AVATAR_SKINS.find(s => s.id === gameState.activeSkin) || AVATAR_SKINS[0];
  const currentThemeObj = APP_THEMES.find(t => t.id === activeThemeId) || APP_THEMES[0];

  // Handler to add a known skill
  const handleAddKnownSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newKnownSkill.trim();
    if (!clean) return;
    if (knownSkills.includes(clean)) {
      showToast("Skill already listed!", "error");
      playSound("danger");
      return;
    }
    setKnownSkills(prev => [...prev, clean]);
    setNewKnownSkill("");
    playSound("coin");
  };

  // Handler to remove a known skill
  const handleRemoveKnownSkill = (skillToRemove: string) => {
    setKnownSkills(prev => prev.filter(s => s !== skillToRemove));
    playSound("click");
  };

  // Handler to add a desired skill
  const handleAddDesiredSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDesiredSkill.trim();
    if (!clean) return;
    if (desiredSkills.includes(clean)) {
      showToast("Skill already listed!", "error");
      playSound("danger");
      return;
    }
    setDesiredSkills(prev => [...prev, clean]);
    setNewDesiredSkill("");
    playSound("coin");
  };

  // Handler to remove a desired skill
  const handleRemoveDesiredSkill = (skillToRemove: string) => {
    setDesiredSkills(prev => prev.filter(s => s !== skillToRemove));
    playSound("click");
  };

  // Save profile changes
  const saveCoreProfile = () => {
    if (!tempNickname.trim()) {
      showToast("Nickname cannot be empty!", "error");
      playSound("danger");
      return;
    }
    setNickname(tempNickname.trim());
    setCollege(tempCollege.trim());
    setEmail(tempEmail.trim());
    showToast("Profile settings synced to local storage!", "success");
    playSound("levelup");
  };

  // Equip unlocked skin
  const equipSkin = (skinId: string) => {
    setGameState(prev => ({
      ...prev,
      activeSkin: skinId
    }));
    // Sync custom avatar emoji with skin sprite for consistency if desired
    const skin = AVATAR_SKINS.find(s => s.id === skinId);
    if (skin) {
      setAvatarEmoji(skin.spriteUrl);
    }
    showToast(`Equipped class: ${AVATAR_SKINS.find(s => s.id === skinId)?.name}!`, "success");
    playSound("sync");
  };

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div 
        className="border-b-4 border-dashed pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ borderColor: currentThemeObj.primaryColor + "33" }}
      >
        <div>
          <span className={`text-xs ${currentThemeObj.textClass} font-press tracking-wider uppercase block`}>
            MODULE 08: CHARACTER PROFILE ENGINE
          </span>
          <h2 className={`text-2xl md:text-3xl font-press ${currentThemeObj.textClass} ${currentThemeObj.textShadowClass} uppercase mt-2`}>
            Hero Profile Dashboard
          </h2>
        </div>
        <div 
          className={`flex items-center gap-2 ${currentThemeObj.bgClass} border p-2 font-pixel text-xs ${currentThemeObj.textClass}`}
          style={{ borderColor: currentThemeObj.primaryColor + "4d" }}
        >
          <Award className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="font-press text-[9px] uppercase">LEVEL {gameState.level} WARRIOR</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: HERO AVATAR CARD & PREVIEW (COL-SPAN 5) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
          
          {/* PROFILE LIVE PREVIEW */}
          <div className={`pixel-box-green p-5 relative overflow-hidden transition-all flex flex-col items-center justify-center text-center bg-gradient-to-b ${activeFrameObj.bgGradientClass} border-4 ${activeFrameObj.borderColorClass} ${activeFrameObj.glowClass}`}>
            
            {/* Class Badge */}
            <span className={`absolute top-3 right-3 text-[9px] font-press bg-black/60 px-2.5 py-1 border border-zinc-700 rounded text-zinc-300 flex items-center gap-1`}>
              <Crown className="w-3 h-3 text-amber-400" /> {activeSkinObj.name}
            </span>

            {/* Glowing Avatar circle */}
            <div className="relative mt-4 mb-4">
              <div className={`w-28 h-28 rounded-full border-4 ${activeFrameObj.borderColorClass} bg-black/80 flex items-center justify-center text-5xl select-none`}>
                <span>{avatarEmoji}</span>
              </div>
              <div 
                className="absolute -bottom-1 -right-1 bg-black border-2 p-1.5 rounded-full text-white cursor-pointer transition-colors" 
                style={{ borderColor: currentThemeObj.primaryColor }}
                title="Quick change emoji"
              >
                <Camera className={`w-4 h-4 ${currentThemeObj.textClass}`} />
              </div>
            </div>

            {/* Ign & Level */}
            <h3 className="font-press text-lg text-white uppercase tracking-tight flex items-center gap-2 justify-center">
              {nickname}
              <span className={`text-[10px] font-pixel px-1.5 py-0.5 border bg-black ${activeFrameObj.textAccentClass} ${activeFrameObj.borderColorClass}`}>
                LV {gameState.level}
              </span>
            </h3>

            {/* Core details */}
            <div className="mt-2 space-y-1 max-w-full">
              <span className="text-xs font-pixel text-zinc-400 block truncate">
                📧 {email || "No email linked"}
              </span>
              <span className="text-xs font-pixel text-zinc-400 block truncate">
                🏛️ {college || "No academy linked"}
              </span>
            </div>

            {/* Stats list */}
            <div className="w-full mt-5 grid grid-cols-3 gap-2 border-t border-dashed border-zinc-700 pt-4 font-pixel text-xs text-zinc-400 uppercase">
              <div className="p-1 bg-black/40 border border-zinc-800 rounded">
                <p className="text-emerald-400 font-bold font-press text-[9px]">{gameState.goldCount}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">GOLD</p>
              </div>
              <div className="p-1 bg-black/40 border border-zinc-800 rounded">
                <p className="text-cyan-400 font-bold font-press text-[9px]">{gameState.jewelCount}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">JEWELS</p>
              </div>
              <div className="p-1 bg-black/40 border border-zinc-800 rounded">
                <p className="text-amber-400 font-bold font-press text-[9px]">{gameState.starCount}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">STARS</p>
              </div>
            </div>

            {/* Custom buff information */}
            <div className="w-full mt-3 p-2.5 bg-black/70 border border-zinc-800 rounded text-left">
              <span className={`text-[9px] font-press ${currentThemeObj.textClass} uppercase block mb-1`}>
                Active Perk Buff:
              </span>
              <p className="text-xs font-pixel text-white leading-normal">
                ⚔️ {activeSkinObj.powerName}
              </p>
            </div>
          </div>

          {/* AVATAR CLASS RECRUITMENT */}
          <div className={`${currentThemeObj.pixelBoxClass} p-5 space-y-4`}>
            <div className="border-b border-zinc-800 pb-2 flex justify-between items-center">
              <span className="text-[10px] font-press text-white uppercase flex items-center gap-1.5 font-bold">
                <Award className={`w-4 h-4 ${currentThemeObj.textClass}`} /> Class Skin Wardrobe
              </span>
              <span className="text-[9px] font-pixel text-zinc-500">
                UNLOCKED: {gameState.unlockedSkins.length} / {AVATAR_SKINS.length}
              </span>
            </div>

            <p className="text-xs font-pixel text-zinc-400 uppercase">
              Equip an unlocked character skin class (Syncs preview emojis & stats multipliers):
            </p>

            <div className="space-y-2.5">
              {AVATAR_SKINS.map((skin) => {
                const isUnlocked = gameState.unlockedSkins.includes(skin.id);
                const isActive = gameState.activeSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className="p-2.5 border-2 flex items-center justify-between gap-3 transition-all"
                    style={{
                      backgroundColor: isActive ? currentThemeObj.primaryColor + "1a" : "rgba(0, 0, 0, 0.5)",
                      borderColor: isActive ? currentThemeObj.primaryColor : "#27272a"
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{skin.spriteUrl}</span>
                      <div className="truncate">
                        <p className="font-press text-[10px] text-white truncate">{skin.name}</p>
                        <p className="text-[11px] font-pixel text-zinc-400 truncate mt-0.5">{skin.powerName}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isActive ? (
                        <span 
                          className="font-press text-[9px] uppercase flex items-center gap-1 border px-2 py-1"
                          style={{ 
                            borderColor: currentThemeObj.primaryColor + "4d", 
                            backgroundColor: currentThemeObj.primaryColor + "1a",
                            color: currentThemeObj.primaryColor
                          }}
                        >
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => equipSkin(skin.id)}
                          className="font-press text-[9px] text-black px-2.5 py-1 border border-white cursor-pointer transition-colors uppercase font-bold"
                          style={{ backgroundColor: currentThemeObj.primaryColor }}
                        >
                          EQUIP
                        </button>
                      ) : (
                        <span className="text-zinc-600 font-press text-[9px] uppercase border border-zinc-800 px-2 py-1">
                          🔒 {skin.cost}g
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CORE VALUES, FRAME SELECTION, AND SKILL TAGS (COL-SPAN 7) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col space-y-6">
          
          {/* THEME COLOR SELECTOR */}
          <div className={`${currentThemeObj.pixelBoxClass} p-5 space-y-4`}>
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-press text-white uppercase flex items-center gap-1.5 font-bold">
                🎨 INTERFACE COLOR CUSTOMIZATION
              </span>
            </div>

            <p className="text-xs font-pixel text-zinc-400 uppercase">
              Choose an 8-bit interface color theme preset to transform the visual terminal aesthetic:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {APP_THEMES.map((theme) => {
                const isSelected = theme.id === activeThemeId;

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setActiveThemeId(theme.id);
                      playSound("levelup");
                      showToast(`Visual Theme set to ${theme.name}!`, "success");
                    }}
                    className={`p-2.5 border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isSelected 
                        ? `${theme.bgClass} ${theme.borderClass} ring-1 ring-white/20` 
                        : "bg-black/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded border-2 border-white/55 mb-2 shadow"
                      style={{ 
                        backgroundColor: theme.primaryColor,
                        boxShadow: `0 0 10px ${theme.primaryColor}`
                      }}
                    />
                    <span className="text-[9px] font-press text-white uppercase tracking-tight block max-w-full leading-tight truncate">
                      {theme.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORM 1: ACCOUNT DETAILS */}
          <div className={`${currentThemeObj.pixelBoxClass} p-5 space-y-4`}>
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-press text-white uppercase flex items-center gap-1.5 font-bold">
                <User className={`w-4 h-4 ${currentThemeObj.textClass}`} /> Academy Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label 
                  className="text-xs font-press uppercase block"
                  style={{ color: currentThemeObj.primaryColor + "cc" }}
                >
                  Character Nickname
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    className="w-full bg-black font-pixel text-sm pl-10 p-2.5 border-2 focus:outline-none"
                    style={{ 
                      color: currentThemeObj.primaryColor,
                      borderColor: currentThemeObj.primaryColor + "4d"
                    }}
                    maxLength={16}
                    placeholder="Enter nickname..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label 
                  className="text-xs font-press uppercase block"
                  style={{ color: currentThemeObj.primaryColor + "cc" }}
                >
                  Linked Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="w-full bg-black font-pixel text-sm pl-10 p-2.5 border-2 focus:outline-none"
                    style={{ 
                      color: currentThemeObj.primaryColor,
                      borderColor: currentThemeObj.primaryColor + "4d"
                    }}
                    placeholder="squire@pixelguild.edu"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label 
                  className="text-xs font-press uppercase block"
                  style={{ color: currentThemeObj.primaryColor + "cc" }}
                >
                  Academy / University
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={tempCollege}
                    onChange={(e) => setTempCollege(e.target.value)}
                    className="w-full bg-black font-pixel text-sm pl-10 p-2.5 border-2 focus:outline-none"
                    style={{ 
                      color: currentThemeObj.primaryColor,
                      borderColor: currentThemeObj.primaryColor + "4d"
                    }}
                    placeholder="E.g. Pixel Academy of Technology"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveCoreProfile}
                className="font-press text-xs text-black px-5 py-2.5 border-2 border-white cursor-pointer uppercase font-bold"
                style={{ 
                  backgroundColor: currentThemeObj.primaryColor,
                  boxShadow: `0 4px 0 ${currentThemeObj.primaryColor}80`
                }}
              >
                Save Credentials
              </motion.button>
            </div>
          </div>

          {/* FRAME SELECTION */}
          <div className={`${currentThemeObj.pixelBoxClass} p-5 space-y-4`}>
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-press text-white uppercase flex items-center gap-1.5 font-bold">
                <Sparkles className={`w-4 h-4 ${currentThemeObj.textClass}`} /> Profile Border Frame Glamour
              </span>
            </div>

            <p className="text-xs font-pixel text-zinc-400 uppercase">
              Select a specialized border glow aura to encapsulate your character card:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PROFILE_FRAMES.map((f) => {
                const isSelected = f.id === profileFrame;

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setProfileFrame(f.id);
                      playSound("click");
                      showToast(`Equipped frame aura: ${f.name}!`, "info");
                    }}
                    className="p-2.5 border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? currentThemeObj.primaryColor + "1a" : "rgba(0, 0, 0, 0.5)",
                      borderColor: isSelected ? currentThemeObj.primaryColor : "#27272a"
                    }}
                  >
                    <div className={`w-8 h-8 rounded border-2 ${f.borderColorClass} bg-black flex items-center justify-center text-xs text-white mb-2 shadow`}>
                      ✨
                    </div>
                    <span className="text-[9px] font-press text-white uppercase tracking-tight block max-w-full leading-tight truncate">
                      {f.name.split(" ")[1] || f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AVATAR EMOJI PALETTE */}
          <div className={`${currentThemeObj.pixelBoxClass} p-5 space-y-4`}>
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-press text-white uppercase flex items-center gap-1.5 font-bold">
                <Camera className={`w-4 h-4 ${currentThemeObj.textClass}`} /> Custom Avatar Picture Sprite
              </span>
            </div>

            <p className="text-xs font-pixel text-zinc-400 uppercase">
              Select an 8-bit visual emoji representational image as your profile photo:
            </p>

            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {AVATAR_EMOJIS.map((emoji) => {
                const isSelected = avatarEmoji === emoji;

                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatarEmoji(emoji);
                      playSound("click");
                    }}
                    className="aspect-square text-2xl flex items-center justify-center border-2 rounded transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? currentThemeObj.primaryColor + "1b" : "rgba(0,0,0,0.4)",
                      borderColor: isSelected ? currentThemeObj.primaryColor : "#27272a"
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SKILLS SECTION: KNOWLEDGE WEAPONS (KNOWN & DESIRED) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KNOWN SKILLS */}
            <div className={`${currentThemeObj.pixelBoxClass} p-4 flex flex-col space-y-3`}>
              <div className="border-b border-zinc-800 pb-1.5 flex justify-between items-center">
                <span className="text-[9px] font-press text-white uppercase flex items-center gap-1 font-bold">
                  ⚔️ SKILLS I KNOW
                </span>
                <span className="text-[9px] font-pixel text-zinc-500 font-bold">{knownSkills.length} SKILLS</span>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddKnownSkill} className="flex gap-1.5">
                <input
                  type="text"
                  value={newKnownSkill}
                  onChange={(e) => setNewKnownSkill(e.target.value)}
                  placeholder="E.g. React, C++"
                  maxLength={15}
                  className="w-full bg-black font-pixel text-xs p-1.5 border-2 focus:outline-none placeholder-zinc-700"
                  style={{
                    color: currentThemeObj.primaryColor,
                    borderColor: currentThemeObj.primaryColor + "4d"
                  }}
                />
                <button
                  type="submit"
                  className="text-black font-press text-[9px] px-3 border border-white hover:opacity-90 cursor-pointer flex items-center uppercase font-bold shrink-0"
                  style={{ backgroundColor: currentThemeObj.primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Tag box */}
              <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[140px] pr-1 pixel-scrollbar flex-grow min-h-[80px]">
                {knownSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 border font-pixel text-xs px-2.5 py-1 rounded"
                    style={{
                      backgroundColor: currentThemeObj.primaryColor + "1a",
                      borderColor: currentThemeObj.primaryColor + "33",
                      color: currentThemeObj.primaryColor
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveKnownSkill(skill)}
                      className="hover:text-red-400 focus:outline-none ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {knownSkills.length === 0 && (
                  <span className="text-zinc-600 font-pixel text-xs uppercase italic py-4 block">
                    No skills registered yet.
                  </span>
                )}
              </div>
            </div>

            {/* DESIRED SKILLS */}
            <div className={`${currentThemeObj.pixelBoxClass} p-4 flex flex-col space-y-3`}>
              <div className="border-b border-zinc-800 pb-1.5 flex justify-between items-center">
                <span className="text-[9px] font-press text-white uppercase flex items-center gap-1 font-bold">
                  🎯 SKILLS I WANT TO LEARN
                </span>
                <span className="text-[9px] font-pixel text-zinc-500 font-bold">{desiredSkills.length} TARGETS</span>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddDesiredSkill} className="flex gap-1.5">
                <input
                  type="text"
                  value={newDesiredSkill}
                  onChange={(e) => setNewDesiredSkill(e.target.value)}
                  placeholder="E.g. Physics, Rust"
                  maxLength={15}
                  className="w-full bg-black font-pixel text-xs p-1.5 border-2 focus:outline-none placeholder-zinc-700"
                  style={{
                    color: currentThemeObj.primaryColor,
                    borderColor: currentThemeObj.primaryColor + "4d"
                  }}
                />
                <button
                  type="submit"
                  className="text-black font-press text-[9px] px-3 border border-white hover:opacity-90 cursor-pointer flex items-center uppercase font-bold shrink-0"
                  style={{ backgroundColor: currentThemeObj.primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Tag box */}
              <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[140px] pr-1 pixel-scrollbar flex-grow min-h-[80px]">
                {desiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-black border border-amber-500/30 text-amber-400 font-pixel text-xs px-2.5 py-1 rounded"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveDesiredSkill(skill)}
                      className="hover:text-red-400 focus:outline-none ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {desiredSkills.length === 0 && (
                  <span className="text-zinc-600 font-pixel text-xs uppercase italic py-4 block">
                    No desires registered yet.
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
