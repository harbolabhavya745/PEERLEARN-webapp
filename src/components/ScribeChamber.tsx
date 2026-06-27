import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ExternalLink, Database, Terminal, Unplug, Plug } from "lucide-react";
import { NoteBlock } from "../types";

interface ScribeChamberProps {
  notes: NoteBlock[];
  addNote: (title: string, subject: string, isPublic: boolean) => void;
  deleteNote: (id: string) => void;
  notionStatus?: any;
  connectNotion?: () => void;
  disconnectNotion?: () => void;
  syncNotionSimulator?: () => void;
  isSyncingNotion?: boolean;
  notionSyncLogs?: string[];
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function ScribeChamber({
  notes,
  addNote,
  deleteNote,
  notionStatus,
  connectNotion,
  disconnectNotion,
  syncNotionSimulator,
  isSyncingNotion = false,
  notionSyncLogs = [],
  playSound
}: ScribeChamberProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("Mathematics");
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim()) {
      addNote(noteTitle.trim(), noteSubject, isPublic);
      setNoteTitle("");
      setIsPublic(false);
      playSound("coin");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#10b981]/20 pb-4">
        <span className="text-xs text-[#10b981] font-press tracking-wider uppercase block">
          MODULE 05: SYNC ARCHIVE
        </span>
        <h2 className="text-2xl md:text-3xl font-press text-[#10b981] text-retro-shadow-green uppercase mt-2">
          My Study Notes
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CREATE NOTE FORM */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-black/40 border-2 border-[#10b981]/30 p-4 space-y-4 text-left">
            <h3 className="text-xs font-press text-[#10b981] uppercase flex items-center gap-1">
              <Plus className="w-4 h-4 text-[#10b981]" />
              <span>Create New Note</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
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
                <label className="text-[9px] font-press text-zinc-400 uppercase block">Subject</label>
                <select
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="w-full bg-black text-white font-pixel text-sm p-2 border-2 border-[#10b981]/30 focus:border-[#10b981] outline-none uppercase"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[#10b981] cursor-pointer"
                />
                <label htmlFor="isPublic" className="text-[9px] font-press text-zinc-400 uppercase cursor-pointer">
                  Make Public in Village Square
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-[#10b981] text-black font-press text-[10px] py-3 mt-2 border-2 border-white shadow-[0_3px_0_#047857] hover:bg-[#059669] cursor-pointer uppercase font-bold"
              >
                CREATE NOTION PAGE 📝
              </motion.button>
            </form>
          </div>
          
          {/* SYNC TO NOTION ACTION HUB - SIDEBAR VERSION */}
          <div className="pixel-box-green p-4 flex flex-col items-center gap-3">
            <div className="text-center w-full">
              <h4 className="text-xs font-press text-white uppercase flex items-center justify-center gap-1.5">
                <Database className="w-4 h-4 text-[#10b981]" />
                <span>Notion Hub</span>
              </h4>
              
              {notionStatus?.connected ? (
                <div className="mt-2 space-y-3">
                  <p className="text-[10px] font-pixel text-[#10b981] uppercase">
                    ✅ Connected: {notionStatus.workspace_name || 'Workspace'}
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95, y: 2 }}
                    disabled={isSyncingNotion || notes.length === 0}
                    onClick={syncNotionSimulator}
                    className="w-full bg-[#10b981] text-black font-press text-[10px] py-2.5 px-3 border-2 border-white shadow-[0_3px_0_#047857] hover:bg-[#059669] disabled:opacity-40 disabled:shadow-none cursor-pointer uppercase font-bold flex items-center justify-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{isSyncingNotion ? "SYNCING..." : "SYNC NOTES (💰 REWARD)"}</span>
                  </motion.button>
                  
                  <button
                    onClick={disconnectNotion}
                    className="w-full bg-black text-rose-400 font-press text-[9px] py-2 border-2 border-rose-500/50 hover:bg-rose-950/30 cursor-pointer uppercase flex items-center justify-center gap-1.5"
                  >
                    <Unplug className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-3">
                  <p className="text-[10px] font-pixel text-rose-400 uppercase">
                    ❌ Not Connected
                  </p>
                  <button
                    onClick={connectNotion}
                    className="w-full bg-blue-600 text-white font-press text-[10px] py-2.5 px-3 border-2 border-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-500 cursor-pointer uppercase font-bold flex items-center justify-center gap-1.5"
                  >
                    <Plug className="w-3.5 h-3.5" />
                    <span>Connect Notion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOTES VIEW SECTION */}
        <div className="lg:col-span-8 space-y-5">
          {/* SAVED NOTES GRID */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 pixel-scrollbar">
            <span className="text-[10px] text-[#10b981] font-press uppercase block mb-1">NOTION ARCHIVE VAULT</span>
            
            {notes.length === 0 ? (
              <div className="border-2 border-dashed border-[#10b981]/25 p-8 text-center text-zinc-500 font-pixel text-lg">
                EMPTY ARCHIVE VAULT
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 border-2 flex flex-col justify-between space-y-2 rounded-xl shadow-md border-[#3b82f6] bg-[#172554]/30 text-blue-300`}
                    >
                      <div className="text-left space-y-2 select-text">
                        <div className="flex justify-between items-start">
                          <span className="font-press text-[11px] text-white truncate max-w-[150px]" title={note.title}>
                            {note.title}
                          </span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(note as any).subject && (
                            <span className="text-[8px] font-press uppercase bg-black/40 px-1 border border-[#10b981]/20 text-white">
                              {(note as any).subject}
                            </span>
                          )}
                          {note.tags && note.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[8px] font-press uppercase bg-black/40 px-1 border border-[#10b981]/20 text-white"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.is_public && (
                            <span className="text-[8px] font-press uppercase bg-black/40 px-1 border border-pink-500/50 text-pink-300">
                              PUBLIC
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 pb-1">
                        {note.url ? (
                          <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-blue-900/50 hover:bg-blue-800/80 text-blue-100 font-press text-[8px] py-1.5 border border-blue-500/50 transition-colors uppercase"
                          >
                            <span>Open in Notion</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <div className="w-full text-center text-zinc-500 font-press text-[8px] py-1.5 border border-zinc-800 uppercase">
                            No URL Available
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] font-pixel text-zinc-400/80 border-t border-[#10b981]/15 pt-2 flex justify-between">
                        <span>{note.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* SYNC DEV CONSOLE LOGS */}
          <div className="flex flex-col h-[200px]">
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
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
