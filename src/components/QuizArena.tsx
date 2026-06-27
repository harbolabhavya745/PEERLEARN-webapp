import React, { useState } from "react";
import { motion } from "motion/react";
import { Gamepad2, CheckCircle2, XCircle } from "lucide-react";
import { QuizQuestion, Difficulty } from "../types";

const PRESET_SUBJECTS_QUIZ = [
  "Computer Science",
  "Mathematics",
  "Organic Chemistry",
  "Physics",
  "History",
  "Other (specify below)",
];

interface QuizArenaProps {
  quizSubject: string;
  setQuizSubject: (s: string) => void;
  quizTopic: string;
  setQuizTopic: (t: string) => void;
  quizDifficulty: Difficulty;
  setQuizDifficulty: (d: Difficulty) => void;
  isGeneratingQuiz: boolean;
  quizQuestions: QuizQuestion[];
  currentQuizIdx: number;
  selectedAnswerIdx: number | null;
  setSelectedAnswerIdx: (idx: number | null) => void;
  quizSubmitted: boolean;
  quizScore: number;
  quizComplete: boolean;
  quizAlert: string | null;
  fetchAIQuiz: () => void;
  resetQuiz: () => void;
  handleQuizAnswerSubmit: () => void;
  handleQuizNext: () => void;
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function QuizArena({
  quizSubject,
  setQuizSubject,
  quizTopic,
  setQuizTopic,
  quizDifficulty,
  setQuizDifficulty,
  isGeneratingQuiz,
  quizQuestions,
  currentQuizIdx,
  selectedAnswerIdx,
  setSelectedAnswerIdx,
  quizSubmitted,
  quizScore,
  quizComplete,
  quizAlert,
  fetchAIQuiz,
  resetQuiz,
  handleQuizAnswerSubmit,
  handleQuizNext,
  playSound
}: QuizArenaProps) {
  const [customSubject, setCustomSubject] = useState("");
  const isCustom = quizSubject === "Other (specify below)";
  const currentQuestion = quizQuestions[currentQuizIdx];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#3b82f6]/20 pb-4">
        <h2 className="text-2xl md:text-3xl font-press text-[#3b82f6] text-retro-shadow-blue uppercase mt-2">
          Quiz Combat Arena
        </h2>
      </div>

      {quizAlert && (
        <div className="p-3 bg-[#172554] border-2 border-[#3b82f6] text-amber-400 font-pixel text-lg">
          ⚠️ {quizAlert}
        </div>
      )}

      {/* GENERATION / CONFIG LOBBY */}
      {quizQuestions.length === 0 ? (
        <div className="pixel-box-blue p-5 space-y-5">
          <div className="text-left space-y-1">
            <h3 className="text-sm font-press text-white uppercase flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[#3b82f6] animate-pulse" />
              <span>Configure Academic Raid</span>
            </h3>
            <p className="text-sm font-pixel text-zinc-400">
              Select your battleground options to summon a custom AI-grounded multiple-choice quiz boss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#3b82f6] font-press uppercase block">Subject Class</label>
              <select
                value={quizSubject}
                onChange={(e) => {
                  setQuizSubject(e.target.value);
                  if (e.target.value !== "Other (specify below)") setCustomSubject("");
                }}
                className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#3b82f6]/50 focus:border-[#3b82f6] outline-none"
              >
                {PRESET_SUBJECTS_QUIZ.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {isCustom && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Economics, Art History..."
                  className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#3b82f6]/50 focus:border-[#3b82f6] outline-none mt-1"
                  autoFocus
                />
              )}
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#3b82f6] font-press uppercase block">Summon Topic</label>
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="e.g. Limits, Big O, Benzene"
                className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#3b82f6]/50 focus:border-[#3b82f6] outline-none"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#3b82f6] font-press uppercase block">Raid Rank</label>
              <select
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value as Difficulty)}
                className="w-full bg-black text-white font-pixel text-lg p-2.5 border-2 border-[#3b82f6]/50 focus:border-[#3b82f6] outline-none"
              >
                <option value={Difficulty.EASY}>EASY (Novice)</option>
                <option value={Difficulty.MEDIUM}>MEDIUM (Squire)</option>
                <option value={Difficulty.HARD}>HARD (Elite)</option>
                <option value={Difficulty.LEGENDARY}>LEGENDARY (God-Mode)</option>
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 3 }}
            disabled={isGeneratingQuiz || !quizTopic.trim() || (isCustom && !customSubject.trim())}
            onClick={() => {
              if (isCustom && customSubject.trim()) setQuizSubject(customSubject.trim());
              fetchAIQuiz();
            }}
            className="w-full bg-[#3b82f6] text-black font-press text-xs py-3 border-2 border-white shadow-[0_4px_0_#1d4ed8] hover:bg-[#2563eb] disabled:bg-neutral-800 disabled:text-zinc-600 disabled:shadow-none cursor-pointer uppercase flex items-center justify-center gap-2"
          >
            {isGeneratingQuiz ? "Summoning AI Raid Boss..." : "SUMMON RAID BOSS ⚡"}
          </motion.button>
        </div>
      ) : (
        /* ACTIVE BATTLE SCREEN */
        <div className="pixel-box-blue p-5 space-y-5">
          {/* Header Progress indicator */}
          <div className="flex justify-between items-center border-b border-[#3b82f6]/20 pb-3">
            <span className="text-xs font-press text-white uppercase">
              Raid Battle: {currentQuizIdx + 1} / {quizQuestions.length}
            </span>
            <span className="text-xs font-press text-amber-400">
              SCORE: {quizScore} / {quizQuestions.length}
            </span>
          </div>

          {!quizComplete ? (
            <div className="space-y-5">
              {/* Question Text block - using font-sans for ultimate readability */}
              <div className="bg-[#172554]/50 border-2 border-[#3b82f6]/30 p-4 rounded-xl">
                <span className="text-[10px] text-[#3b82f6] font-press uppercase block mb-1">THE DILEMMA:</span>
                <p className="text-base md:text-lg font-sans font-bold text-white tracking-wide leading-relaxed select-text">
                  {currentQuestion?.question}
                </p>
              </div>

              {/* Options list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion?.options.map((opt, idx) => {
                  const isSelected = selectedAnswerIdx === idx;
                  const isCorrect = idx === currentQuestion.answerIndex;
                  let cardStyle = "border-[#3b82f6]/30 bg-black/30 hover:border-[#3b82f6] text-zinc-300";
                  
                  if (quizSubmitted) {
                    if (isCorrect) {
                      cardStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-400";
                    } else if (isSelected) {
                      cardStyle = "border-rose-500 bg-rose-950/40 text-rose-400";
                    } else {
                      cardStyle = "border-zinc-800 bg-black/10 text-zinc-500 opacity-60";
                    }
                  } else if (isSelected) {
                    cardStyle = "border-[#3b82f6] bg-blue-950/40 text-white font-bold ring-2 ring-[#3b82f6]/30";
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: quizSubmitted ? 1 : 1.01 }}
                      whileTap={{ scale: quizSubmitted ? 1 : 0.99 }}
                      disabled={quizSubmitted}
                      onClick={() => { setSelectedAnswerIdx(idx); playSound("click"); }}
                      className={`p-3.5 border-2 text-left transition-all font-sans text-sm font-medium flex items-start gap-2.5 cursor-pointer rounded-xl ${cardStyle}`}
                    >
                      <span className="font-press text-[10px] text-[#3b82f6] bg-[#172554] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug select-text">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Submitted Feedback Block */}
              {quizSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border-2 flex gap-3 rounded-xl ${
                    selectedAnswerIdx === currentQuestion.answerIndex
                      ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                      : "border-rose-500 bg-rose-950/20 text-rose-400"
                  }`}
                >
                  <div className="shrink-0">
                    {selectedAnswerIdx === currentQuestion.answerIndex ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 animate-bounce" />
                    )}
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-press uppercase block font-bold">
                      {selectedAnswerIdx === currentQuestion.answerIndex ? "CRITICAL LEARNING STRIKE!" : "SPELL FAILED / MIND PENALIZED!"}
                    </span>
                    <p className="text-xs font-sans leading-relaxed text-zinc-200 select-text">
                      {currentQuestion.contextExplanation}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                {!quizSubmitted ? (
                  <motion.button
                    whileHover={{ scale: selectedAnswerIdx !== null ? 1.02 : 1 }}
                    whileTap={{ scale: selectedAnswerIdx !== null ? 0.98 : 1 }}
                    disabled={selectedAnswerIdx === null}
                    onClick={handleQuizAnswerSubmit}
                    className="bg-amber-400 text-black font-press text-[10px] py-2.5 px-6 border-2 border-white shadow-[0_3px_0_#b45309] hover:bg-amber-500 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer uppercase font-bold"
                  >
                    Submit Attack ⚔️
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleQuizNext}
                    className="bg-[#3b82f6] text-black font-press text-[10px] py-2.5 px-6 border-2 border-white shadow-[0_3px_0_#1d4ed8] hover:bg-[#2563eb] cursor-pointer uppercase font-bold"
                  >
                    {currentQuizIdx < quizQuestions.length - 1 ? "Next Opponent →" : "Claim Victory 🏆"}
                  </motion.button>
                )}
              </div>
            </div>
          ) : (
            /* CONQUERED SCREEN */
            <div className="p-8 text-center space-y-5">
              <span className="text-6xl animate-pulse inline-block">🏆</span>
              <h3 className="text-xl font-press text-amber-400 uppercase">Raid Battle Completed!</h3>
              
              <div className="max-w-md mx-auto p-4 bg-[#172554]/50 border-2 border-[#3b82f6]/30 text-left space-y-2">
                <p className="font-pixel text-xl text-zinc-300">
                  RAID TARGET: <strong className="text-white uppercase">{quizSubject} ({quizTopic})</strong>
                </p>
                <p className="font-pixel text-xl text-zinc-300">
                  FINAL HIT ACCURACY: <strong className="text-white">{quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)</strong>
                </p>
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Excellent work, Scholar! Gold and Star rewards have been transferred into your HUD database vaults.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { fetchAIQuiz(); }}
                  className="bg-[#3b82f6] text-black font-press text-xs py-2.5 px-6 border-2 border-white shadow-[0_3px_0_#1d4ed8] hover:bg-[#2563eb] cursor-pointer uppercase font-bold"
                >
                  Summon Another Raid Boss ⚡
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { resetQuiz(); playSound("click"); }}
                  className="bg-black text-[#3b82f6] font-press text-xs py-2.5 px-6 border-2 border-[#3b82f6] hover:bg-[#3b82f6]/10 cursor-pointer uppercase font-bold"
                >
                  ← Change Topic
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
