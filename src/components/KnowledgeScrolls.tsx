import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, RefreshCw, CheckCircle2 } from "lucide-react";
import { Flashcard } from "../types";

interface KnowledgeScrollsProps {
  scrollsSubject: string;
  setScrollsSubject: (s: string) => void;
  scrollsTopic: string;
  setScrollsTopic: (t: string) => void;
  isGeneratingScrolls: boolean;
  flashcards: Flashcard[];
  activeCardIdx: number;
  setActiveCardIdx: (idx: number) => void;
  isFlipped: boolean;
  setIsFlipped: (b: boolean) => void;
  masteredCards: string[];
  markCardMastered: (id: string) => void;
  scrollsAlert: string | null;
  fetchAIFlashcards: () => void;
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function KnowledgeScrolls({
  scrollsSubject,
  setScrollsSubject,
  scrollsTopic,
  setScrollsTopic,
  isGeneratingScrolls,
  flashcards,
  activeCardIdx,
  setActiveCardIdx,
  isFlipped,
  setIsFlipped,
  masteredCards,
  markCardMastered,
  scrollsAlert,
  fetchAIFlashcards,
  playSound
}: KnowledgeScrollsProps) {
  const currentCard = flashcards[activeCardIdx];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#ec4899]/20 pb-4">
        <span className="text-xs text-[#ec4899] font-press tracking-wider uppercase block">
          MODULE 03: FLASHCARD GENERATOR
        </span>
        <h2 className="text-2xl md:text-3xl font-press text-[#ec4899] text-retro-shadow-pink uppercase mt-2">
          Study Flashcards
        </h2>
      </div>

      {scrollsAlert && (
        <div className="p-3 bg-[#50072b] border-2 border-[#ec4899] text-amber-400 font-pixel text-lg">
          ⚠️ {scrollsAlert}
        </div>
      )}

      {/* GENERATION / CONFIG LOBBY */}
      {flashcards.length === 0 ? (
        <div className="pixel-box-pink p-5 space-y-5">
          <div className="text-left space-y-1">
            <h3 className="text-sm font-press text-white uppercase flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ec4899] animate-pulse" />
              <span>Generate Flashcards</span>
            </h3>
            <p className="text-sm font-pixel text-zinc-400">
              Provide your topic to summon 6 unique academic memory flashcards powered by Gemini 3.5.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#ec4899] font-press uppercase block">Subject Field</label>
              <select
                value={scrollsSubject}
                onChange={(e) => setScrollsSubject(e.target.value)}
                className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#ec4899]/50 focus:border-[#ec4899] outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Organic Chemistry">Organic Chemistry</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#ec4899] font-press uppercase block">Flashcard Topic</label>
              <input
                type="text"
                value={scrollsTopic}
                onChange={(e) => setScrollsTopic(e.target.value)}
                placeholder="e.g. Mitochondria, Derivatives"
                className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#ec4899]/50 focus:border-[#ec4899] outline-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 3 }}
            disabled={isGeneratingScrolls || !scrollsTopic.trim()}
            onClick={fetchAIFlashcards}
            className="w-full bg-[#ec4899] text-black font-press text-xs py-3 border-2 border-white shadow-[0_4px_0_#be185d] hover:bg-[#db2777] disabled:bg-neutral-800 disabled:text-zinc-600 disabled:shadow-none cursor-pointer uppercase flex items-center justify-center gap-2"
          >
            {isGeneratingScrolls ? "Generating Flashcards..." : "GENERATE FLASHCARDS 📖"}
          </motion.button>
        </div>
      ) : (
        /* ACTIVE FLASHCARD DECK */
        <div className="space-y-5">
          {/* Deck statistics */}
          <div className="flex justify-between items-center text-xs font-press text-zinc-300 bg-black/40 p-3 border border-[#ec4899]/20">
            <span>FLASHCARDS: {activeCardIdx + 1} / {flashcards.length}</span>
            <span className="text-emerald-400">MASTERED: {masteredCards.length} / {flashcards.length}</span>
          </div>

          {/* THE FLIP CARD CONTAINER */}
          <div className="flex justify-center py-4">
            <div className="w-full max-w-lg perspective-1000">
              <motion.div
                onClick={() => { setIsFlipped(!isFlipped); playSound("cast_spell"); }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-80 relative cursor-pointer transform-style-3d shadow-xl"
              >
                
                {/* FRONT OF CARD (Unflipped) */}
                <div 
                  className={`absolute inset-0 w-full h-full p-6 pixel-box-pink flex flex-col justify-between backface-hidden ${
                    isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-[#ec4899]/20 pb-2">
                    <span className="text-[10px] text-zinc-400 font-press uppercase">Front Side</span>
                    <span className="text-xs text-[#ec4899] font-press uppercase">[CLICK TO FLIP]</span>
                  </div>

                  <div className="text-center py-6 select-text">
                    <p className="text-lg md:text-xl font-sans font-bold text-white leading-relaxed">
                      {currentCard?.front}
                    </p>
                  </div>

                  <div className="text-[10px] font-pixel text-zinc-500 text-center uppercase tracking-wider">
                    {scrollsSubject} • CARD #{activeCardIdx + 1}
                  </div>
                </div>

                {/* BACK OF CARD (Flipped) */}
                <div 
                  style={{ transform: "rotateY(180deg)" }}
                  className={`absolute inset-0 w-full h-full p-6 bg-[#2d0015] border-4 border-[#ec4899] shadow-[0_4px_0_#be185d] flex flex-col justify-between backface-hidden ${
                    isFlipped ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-[#ec4899]/20 pb-2">
                    <span className="text-[10px] text-zinc-400 font-press uppercase">Back Side (Concept)</span>
                    <span className="text-xs text-emerald-400 font-press uppercase">[REVEALED]</span>
                  </div>

                  <div className="py-2 overflow-y-auto select-text max-h-[160px] pixel-scrollbar">
                    <p className="text-sm md:text-base font-sans text-amber-200 leading-relaxed text-left font-medium">
                      {currentCard?.back}
                    </p>
                  </div>

                  <div className="text-[10px] font-pixel text-zinc-500 text-center uppercase tracking-wider">
                    {scrollsSubject} • REWARD READY
                  </div>
                </div>

              </motion.div>
            </div>
          </div>

          {/* Action controls below card */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/40 p-4 border border-[#ec4899]/20">
            <span className="text-xs font-pixel text-zinc-400 text-center sm:text-left">
              Flipped the flashcard to study the definition? Hit Master to absorb its power!
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setIsFlipped(!isFlipped); playSound("cast_spell"); }}
                className="bg-black text-[#ec4899] font-press text-[9px] py-2 px-3 border-2 border-[#ec4899] hover:bg-[#ec4899]/10 cursor-pointer uppercase font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>FLIP</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={masteredCards.includes(currentCard?.id)}
                onClick={() => markCardMastered(currentCard?.id)}
                className="bg-emerald-500 text-black font-press text-[9px] py-2 px-3 border-2 border-white shadow-[0_2px_0_#047857] hover:bg-emerald-600 disabled:opacity-40 disabled:shadow-none cursor-pointer uppercase font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{masteredCards.includes(currentCard?.id) ? "MASTERED" : "MASTER (💰12)"}</span>
              </motion.button>
            </div>
          </div>

          {/* Deck Navigator */}
          <div className="flex justify-between items-center pt-2">
            <motion.button
              whileHover={{ scale: activeCardIdx > 0 ? 1.05 : 1 }}
              whileTap={{ scale: activeCardIdx > 0 ? 0.95 : 1 }}
              disabled={activeCardIdx === 0}
              onClick={() => { setActiveCardIdx(activeCardIdx - 1); setIsFlipped(false); playSound("click"); }}
              className="bg-[#ec4899] text-black font-press text-[9px] py-2 px-4 border-2 border-white shadow-[0_3px_0_#be185d] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer uppercase font-bold"
            >
              ← Prev Flashcard
            </motion.button>

            <button
              onClick={() => { flashcards.splice(0, flashcards.length); setActiveCardIdx(0); setIsFlipped(false); playSound("wrong"); }}
              className="font-press text-[9px] text-[#ec4899] hover:underline cursor-pointer uppercase"
            >
              [SCRAP DECK]
            </button>

            <motion.button
              whileHover={{ scale: activeCardIdx < flashcards.length - 1 ? 1.05 : 1 }}
              whileTap={{ scale: activeCardIdx < flashcards.length - 1 ? 0.95 : 1 }}
              disabled={activeCardIdx === flashcards.length - 1}
              onClick={() => { setActiveCardIdx(activeCardIdx + 1); setIsFlipped(false); playSound("click"); }}
              className="bg-[#ec4899] text-black font-press text-[9px] py-2 px-4 border-2 border-white shadow-[0_3px_0_#be185d] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer uppercase font-bold"
            >
              Next Flashcard →
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
