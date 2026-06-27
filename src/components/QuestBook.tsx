import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ListTodo, Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { Quest, Difficulty } from "../types";

interface QuestBookProps {
  quests: Quest[];
  completeQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  addCustomQuest: (title: string, desc: string, qType: "daily" | "weekly" | "raid", diff: Difficulty) => void;
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function QuestBook({
  quests,
  completeQuest,
  deleteQuest,
  addCustomQuest,
  playSound
}: QuestBookProps) {
  const [activeCategory, setActiveCategory] = useState<"daily" | "weekly" | "raid">("daily");
  
  // Custom Quest Creator State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"daily" | "weekly" | "raid">("daily");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [showCreator, setShowCreator] = useState(false);

  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      addCustomQuest(newTitle.trim(), newDesc.trim(), newType, newDifficulty);
      setNewTitle("");
      setNewDesc("");
      setShowCreator(false);
      playSound("coin");
    }
  };

  const filteredQuests = quests.filter((q) => q.type === activeCategory);

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#8b5cf6]/20 pb-4">
        <h2 className="text-2xl md:text-3xl font-press text-[#8b5cf6] text-retro-shadow-purple uppercase mt-2">
          Quest Book
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QUEST LIST SECTION */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex gap-1 bg-black/40 border-2 border-[#8b5cf6]/30 p-1">
            {(["daily", "weekly", "raid"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); playSound("click"); }}
                className={`w-full font-press text-[9px] py-2 transition-all uppercase cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#8b5cf6] text-black font-bold border border-white"
                    : "text-[#8b5cf6]/70 hover:text-white"
                }`}
              >
                {cat === "raid" ? "one-time" : cat}
              </button>
            ))}
          </div>

          {/* Quests Container */}
          <div className="pixel-box-purple p-5 space-y-4 min-h-[360px]">
            <div className="flex justify-between items-center border-b border-[#8b5cf6]/20 pb-2">
              <span className="text-xs font-press text-white uppercase">ACTIVE JOURNAL</span>
              <span className="text-xs font-press text-[#8b5cf6]">COUNT: {filteredQuests.length}</span>
            </div>

            {filteredQuests.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <span className="text-5xl opacity-40 inline-block">📭</span>
                <p className="font-press text-xs text-zinc-500">NO ACTIVE TASKS</p>
                <p className="font-pixel text-lg text-zinc-400">All objectives cleared in this tier! Level Up your stat logs.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 pixel-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredQuests.map((q) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`p-3.5 border-2 text-left flex justify-between items-start gap-4 transition-all ${
                        q.completed
                          ? "border-zinc-800 bg-neutral-900/40 opacity-50"
                          : "border-[#8b5cf6]/30 bg-black/40 hover:border-[#8b5cf6]"
                      }`}
                    >
                      <div className="space-y-1 select-text">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-press uppercase font-bold ${
                            q.completed ? "text-zinc-500 line-through" : "text-white"
                          }`}>
                            {q.title}
                          </span>
                          <span className="text-[8px] font-press bg-[#2e1065] px-1 border border-[#8b5cf6]/30 text-[#8b5cf6] uppercase">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className={`text-xs font-sans leading-relaxed ${
                          q.completed ? "text-zinc-500 line-through" : "text-zinc-300"
                        }`}>
                          {q.description}
                        </p>
                        
                        {/* Reward indicators */}
                        <div className="flex items-center gap-3 pt-1 text-[11px] font-pixel text-zinc-400">
                          <span className="flex items-center gap-0.5 text-yellow-400">💰 {q.goldReward} Gold</span>
                          <span className="flex items-center gap-0.5 text-emerald-400">🛡️ {q.xpReward} XP</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!q.completed && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => completeQuest(q.id)}
                            className="p-1.5 bg-emerald-500 text-black border border-white shadow-[0_2px_0_#047857] hover:bg-emerald-600 cursor-pointer"
                            title="Complete Task"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteQuest(q.id)}
                          className="p-1.5 bg-zinc-850 border border-zinc-700 text-rose-500 hover:text-rose-400 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* TASK CREATOR */}
        <div className="space-y-4">
          <div className="bg-black/40 border-2 border-[#8b5cf6]/30 p-4 space-y-4">
            <h3 className="text-xs font-press text-[#8b5cf6] uppercase flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-[#8b5cf6]" />
              <span>Create Task</span>
            </h3>

            <p className="text-[11px] font-pixel text-zinc-400 leading-normal">
              Authorize custom academic modules. Write down homework tasks or syllabus goals to log real-time stats.
            </p>

            <form onSubmit={handleCreateQuest} className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-press text-zinc-400 uppercase block">Task Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Finish Calculus Homework"
                  className="w-full bg-black text-white font-pixel text-base p-2 border-2 border-[#8b5cf6]/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-press text-zinc-400 uppercase block">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Write clear goals or outline pages to read..."
                  className="w-full bg-black text-white font-pixel text-base p-2 h-16 border-2 border-[#8b5cf6]/30 focus:border-[#8b5cf6] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-press text-zinc-400 uppercase block">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "daily" | "weekly" | "raid")}
                    className="w-full bg-black text-white font-pixel text-base p-2 border-2 border-[#8b5cf6]/30 focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="raid">One-Time</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-press text-zinc-400 uppercase block">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-black text-white font-pixel text-base p-2 border-2 border-[#8b5cf6]/30 focus:border-[#8b5cf6] outline-none"
                  >
                    <option value={Difficulty.EASY}>EASY</option>
                    <option value={Difficulty.MEDIUM}>MEDIUM</option>
                    <option value={Difficulty.HARD}>HARD</option>
                    <option value={Difficulty.LEGENDARY}>LEGENDARY</option>
                  </select>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-[#8b5cf6] text-black font-press text-[10px] py-2 border-2 border-white shadow-[0_3px_0_#6d28d9] hover:bg-[#7c3aed] cursor-pointer uppercase font-bold"
              >
                ADD TASK ⚡
              </motion.button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
