import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Database, Plus, Trash2, Terminal, Check } from "lucide-react";
import { NoteBlock } from "../types";

interface ScribeChamberProps {
  notes: NoteBlock[];
  addNote: (title: string, content: string, color: string, tags: string[]) => void;
  deleteNote: (id: string) => void;
  syncNotionSimulator: () => void;
  isSyncingNotion: boolean;
  notionSyncLogs: string[];
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function ScribeChamber({
  notes,
  addNote,
  deleteNote,
  syncNotionSimulator,
  isSyncingNotion,
  notionSyncLogs,
  playSound
}: ScribeChamberProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState("green");
  const [noteTags, setNoteTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim() && noteContent.trim()) {
      const parsedTags = noteTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      addNote(noteTitle.trim(), noteContent.trim(), noteColor, parsedTags);
      setNoteTitle("");
      setNoteContent("");
      setNoteTags("");
      playSound("coin");
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "pink":
        return "border-[#ec4899] bg-[#50072b]/30 text-rose-300";
      case "blue":
        return "border-[#3b82f6] bg-[#172554]/30 text-blue-300";
      case "purple":
        return "border-[#8b5cf6] bg-[#2e1065]/30 text-purple-300";
      case "green":
      default:
        return "border-[#10b981] bg-[#022c22]/30 text-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#10b981]/20 pb-4">
        <h2 className="text-2xl md:text-3xl font-press text-[#10b981] text-retro-shadow-green uppercase mt-2">
          Scribe Sync Chamber
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CREATE NOTE FORM */}
        <div className="lg:col-span-4 bg-black/40 border-2 border-[#10b981]/30 p-4 space-y-4 text-left">
          <h3 className="text-xs font-press text-[#10b981] uppercase flex items-center gap-1">
            <Plus className="w-4 h-4 text-[#10b981]" />
            <span>Scribe New Scroll</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3 font-sans">
            <div className="space-y-1">
              <label className="text-[9px] font-press text-zinc-400 uppercase block">Title</label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Krebs Cycle Steps"
                className="w-full bg-black text-white font-pixel text-base p-2 border-2 border-[#10b981]/30 focus:border-[#10b981] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-press text-zinc-400 uppercase block">Color Seal</label>
              <div className="flex gap-2">
                {["green", "pink", "blue", "purple"].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => { setNoteColor(col); playSound("click"); }}
                    className={`w-full h-7 border-2 flex items-center justify-center transition-all cursor-pointer ${
                      col === "green" ? "bg-emerald-700 border-emerald-400" :
                      col === "pink" ? "bg-pink-700 border-pink-400" :
                      col === "blue" ? "bg-blue-700 border-blue-400" : "bg-purple-700 border-purple-400"
                    }`}
                  >
                    {noteColor === col && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-press text-zinc-400 uppercase block">Keywords / Tags</label>
              <input
                type="text"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="e.g. chemistry, cycle (comma separated)"
                className="w-full bg-black text-white font-pixel text-base p-2 border-2 border-[#10b981]/30 focus:border-[#10b981] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-press text-zinc-400 uppercase block">Content</label>
              <textarea
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Draft note contents here... Supports multiple lines"
                className="w-full bg-black text-white font-sans text-xs p-2 h-28 border-2 border-[#10b981]/30 focus:border-[#10b981] outline-none resize-none leading-relaxed"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-[#10b981] text-black font-press text-[10px] py-2 border-2 border-white shadow-[0_3px_0_#047857] hover:bg-[#059669] cursor-pointer uppercase font-bold"
            >
              RECORD NOTE 🖋️
            </motion.button>
          </form>
        </div>

        {/* NOTES VIEW SECTION */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* SYNC TO NOTION ACTION HUB */}
          <div className="pixel-box-green p-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-left">
              <h4 className="text-xs font-press text-white uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#10b981]" />
                <span>Notion Synced Databases</span>
              </h4>
              <p className="text-[11px] font-pixel text-[#10b981] mt-0.5 uppercase">
                [COGNITIVE STACK SYNC MULTIPLIER: READY]
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 2 }}
              disabled={isSyncingNotion || notes.length === 0}
              onClick={syncNotionSimulator}
              className="w-full md:w-auto bg-[#10b981] text-black font-press text-[10px] py-2.5 px-6 border-2 border-white shadow-[0_3px_0_#047857] hover:bg-[#059669] disabled:opacity-40 disabled:shadow-none cursor-pointer uppercase font-bold flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isSyncingNotion ? "TRANSMITTING..." : "SYNC TO NOTION (💰 REWARD)"}</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SAVED NOTES GRID */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 pixel-scrollbar">
              <span className="text-[10px] text-[#10b981] font-press uppercase block mb-1">SAVED RECORDS</span>
              
              {notes.length === 0 ? (
                <div className="border-2 border-dashed border-[#10b981]/25 p-8 text-center text-zinc-500 font-pixel text-lg">
                  EMPTY ARCHIVE VAULT
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 border-2 flex flex-col justify-between space-y-2 rounded-xl shadow-md ${getColorClasses(note.color)}`}
                    >
                      <div className="text-left space-y-1.5 select-text">
                        <div className="flex justify-between items-start">
                          <span className="font-press text-[11px] text-white truncate max-w-[150px]">
                            {note.title}
                          </span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {/* Note text uses font-sans for supreme clarity */}
                        <p className="text-xs font-sans leading-relaxed text-zinc-200 whitespace-pre-wrap">
                          {note.content}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {note.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[8px] font-press uppercase bg-black/40 px-1 border border-[#10b981]/20 text-white"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] font-pixel text-zinc-400/80 border-t border-[#10b981]/15 pt-1 flex justify-between">
                        <span>BY: {note.author}</span>
                        <span>{note.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* SYNC DEV CONSOLE LOGS */}
            <div className="flex flex-col h-[300px]">
              <span className="text-[10px] text-[#10b981] font-press uppercase block mb-1">SYNC MONITOR CONSOLE</span>
              <div className="flex-grow bg-black border-2 border-zinc-800 p-3.5 overflow-y-auto text-left flex flex-col justify-between pixel-scrollbar select-text">
                <div className="space-y-1.5 font-mono text-[11px] text-zinc-400 leading-snug">
                  {notionSyncLogs.length === 0 ? (
                    <div className="text-zinc-600 italic">
                      [Console idle] Initiate Sync To Notion to view transmission packets.
                    </div>
                  ) : (
                    notionSyncLogs.map((log, index) => {
                      let color = "text-zinc-400";
                      if (log.includes("SUCCESS") || log.includes("GRANTED")) color = "text-emerald-400 font-bold";
                      if (log.includes("REJECTED") || log.includes("ERROR")) color = "text-rose-400";
                      if (log.includes("TRANSMITTING") || log.includes("CONNECTING")) color = "text-blue-400";
                      
                      return (
                        <div key={index} className={`${color} leading-normal`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-zinc-900 pt-2 flex justify-between items-center font-mono text-[9px] text-zinc-600">
                  <span>PACKETS: {notionSyncLogs.length}</span>
                  <span>SSL STATUS: OK</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
