import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface PixelSageMascotProps {
  nickname: string;
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  isChatLoading: boolean;
  handleMascotChat: (e: React.FormEvent) => void;
  triggerStudySpell: (prompt: string) => void;
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function PixelSageMascot({
  nickname,
  chatHistory,
  chatMessage,
  setChatMessage,
  isChatLoading,
  handleMascotChat,
  triggerStudySpell,
  playSound
}: PixelSageMascotProps) {
  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#8b5cf6]/20 pb-4">
        <span className="text-xs text-[#8b5cf6] font-press tracking-wider uppercase block">
          MODULE 06: COGNITIVE ASSISTANT
        </span>
        <h2 className="text-2xl md:text-3xl font-press text-[#8b5cf6] text-retro-shadow-purple uppercase mt-2">
          Pixel Sage Mascot
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MASCOT GRAPHIC & STATS */}
        <div className="lg:col-span-4 bg-black/40 border-2 border-[#8b5cf6]/30 p-4 space-y-4 text-center flex flex-col justify-between">
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-press text-[#8b5cf6] uppercase">Channel: Sage v3.5</h3>
            <p className="text-[11px] font-pixel text-zinc-400 leading-normal">
              Pixel Sage is your personal AI study partner. Connected directly to Google Gemini nodes.
            </p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-black/50 border border-[#8b5cf6]/15 rounded-xl">
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut"
              }}
              className="text-7xl select-none"
            >
              🤖
            </motion.div>
            <div className="text-center">
              <span className="font-press text-[10px] text-emerald-400 uppercase tracking-widest block animate-pulse">
                • ONLINE CO-OP •
              </span>
              <span className="font-pixel text-lg text-zinc-300">Level 4 Alchemist AI</span>
            </div>
          </div>

          {/* Quick cognitive spells */}
          <div className="space-y-2 text-left pt-2 border-t border-[#8b5cf6]/15">
            <span className="text-[9px] font-press text-zinc-400 uppercase block">Cast Quick Cognitive Spells:</span>
            <div className="flex flex-col gap-1.5 font-sans">
              <button
                disabled={isChatLoading}
                onClick={() => { triggerStudySpell("Explain recursion using an analogy of nested Russian dolls in 3 short bullet points."); playSound("cast_spell"); }}
                className="w-full text-left p-2 bg-[#2e1065]/40 hover:bg-[#2e1065] border border-[#8b5cf6]/20 hover:border-[#8b5cf6] text-[#c084fc] font-pixel text-base transition-all cursor-pointer truncate"
              >
                🔮 Spell: Recursion Guide
              </button>
              <button
                disabled={isChatLoading}
                onClick={() => { triggerStudySpell("Give me a cheat code Calculus limit formula trick."); playSound("cast_spell"); }}
                className="w-full text-left p-2 bg-[#2e1065]/40 hover:bg-[#2e1065] border border-[#8b5cf6]/20 hover:border-[#8b5cf6] text-[#c084fc] font-pixel text-base transition-all cursor-pointer truncate"
              >
                🔮 Spell: Calculus Tip
              </button>
              <button
                disabled={isChatLoading}
                onClick={() => { triggerStudySpell("Formulate an extremely funny, 8-bit retro gaming joke about organic chemistry carbon bonding."); playSound("cast_spell"); }}
                className="w-full text-left p-2 bg-[#2e1065]/40 hover:bg-[#2e1065] border border-[#8b5cf6]/20 hover:border-[#8b5cf6] text-[#c084fc] font-pixel text-base transition-all cursor-pointer truncate"
              >
                🔮 Spell: Chemistry Joke
              </button>
            </div>
          </div>
        </div>

        {/* CHAT LOG ENGINE */}
        <div className="lg:col-span-8 flex flex-col h-[460px] pixel-box-purple p-5 justify-between">
          
          <div className="flex justify-between items-center border-b border-[#8b5cf6]/20 pb-2">
            <span className="text-xs font-press text-white uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
              <span>COGNITIVE LOG</span>
            </span>
            <span className="text-[10px] font-press text-[#8b5cf6]">SSL SIGNALS</span>
          </div>

          {/* Messages list */}
          <div className="flex-grow my-4 bg-black/40 border border-[#8b5cf6]/15 p-4 overflow-y-auto space-y-4 text-left select-text rounded-xl pixel-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="text-zinc-600 font-pixel text-lg italic text-center py-20">
                [No study signals logged] Send a prompt or tap a spell to begin counseling.
              </div>
            ) : (
              chatHistory.map((chat, idx) => {
                const isMascot = chat.role === "model";
                return (
                  <div
                    key={idx}
                    className={`flex ${isMascot ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`p-3.5 max-w-[85%] border-2 rounded-xl ${
                      isMascot
                        ? "bg-[#2e1065]/20 border-[#8b5cf6]/30 text-zinc-100"
                        : "bg-black/40 border-amber-400/50 text-amber-200"
                    }`}>
                      <span className="text-[8px] font-press text-[#a78bfa] uppercase tracking-wider block mb-1">
                        {isMascot ? "🤖 SAGE MASTER" : `👤 HERO: ${nickname}`}
                      </span>
                      {/* Chat text uses font-sans with extremely clean legibility */}
                      <p className="text-xs md:text-sm font-sans leading-relaxed whitespace-pre-wrap select-text">
                        {chat.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="p-3 bg-[#2e1065]/20 border border-dashed border-[#8b5cf6]/30 rounded-xl text-zinc-400 font-sans text-xs flex items-center gap-2 animate-pulse">
                  <span>🤖 Pixel Sage is channeling Gemini 3.5 node nodes...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleMascotChat} className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question or request a study guide..."
              className="w-full bg-black text-white font-pixel text-lg p-2.5 px-4 border-2 border-[#8b5cf6]/30 focus:border-[#8b5cf6] outline-none"
              required
            />
            <button
              type="submit"
              disabled={isChatLoading}
              className="p-2.5 px-6 bg-[#8b5cf6] text-black font-press text-[10px] uppercase cursor-pointer border-2 border-white shadow-[0_3px_0_#6d28d9] hover:bg-[#7c3aed] flex items-center justify-center gap-1 font-bold shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>CAST</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
