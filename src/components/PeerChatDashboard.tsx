import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Users, 
  BookOpen, 
  Search, 
  Bot, 
  Terminal,
  Zap,
  Globe,
  Compass
} from "lucide-react";
import { SkillProfile } from "../types";

interface PeerChatDashboardProps {
  nickname: string;
  peers: SkillProfile[];
  activePeerId: string | null;
  setActivePeerId: (id: string | null) => void;
  peerChatHistories: Record<string, { role: "user" | "model"; text: string }[]>;
  sendPeerMessage: (peerId: string, text: string) => Promise<void>;
  peerChatLoading: Record<string, boolean>;
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
  onOpenProfile: (userId: string) => void;
}

export default function PeerChatDashboard({
  nickname,
  peers,
  activePeerId,
  setActivePeerId,
  peerChatHistories,
  sendPeerMessage,
  peerChatLoading,
  playSound,
  onOpenProfile
}: PeerChatDashboardProps) {
  const [localMsg, setLocalMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Set default active peer if none selected
  useEffect(() => {
    if (!activePeerId && peers.length > 0) {
      setActivePeerId(peers[0].id);
    }
  }, [activePeerId, peers, setActivePeerId]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activePeerId, peerChatHistories, peerChatLoading]);

  const filteredPeers = peers.filter(peer => 
    peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peer.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePeer = peers.find(p => p.id === activePeerId) || peers[0];
  const activeChat = activePeerId ? (peerChatHistories[activePeerId] || []) : [];
  const isActiveLoading = activePeerId ? !!peerChatLoading[activePeerId] : false;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localMsg.trim() || !activePeerId || isActiveLoading) return;
    sendPeerMessage(activePeerId, localMsg.trim());
    setLocalMsg("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#10b981]/20 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-press text-[#10b981] text-retro-shadow-green uppercase">
            Peer Connections Console
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-[#022c22] border border-[#10b981]/30 p-2 font-pixel text-xs text-[#10b981]">
          <Globe className="w-4 h-4 animate-spin text-emerald-400" />
          <span className="font-press text-[9px] uppercase">CO-OP CHANNEL STABLE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: PEER ROSTER & CHANNELS */}
        <div className="col-span-1 lg:col-span-4 flex flex-col min-h-0">
          <div className="pixel-box-green p-4 space-y-3.5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between border-b border-[#10b981]/20 pb-2">
              <span className="text-[10px] text-white font-press uppercase flex items-center gap-1.5 font-bold">
                <Users className="w-4 h-4 text-[#10b981]" /> Study Guild Peers
              </span>
              <span className="text-[9px] font-pixel text-emerald-400 bg-black/40 px-1 border border-[#10b981]/30">
                {peers.filter(p => p.isOnline).length} ACTIVE
              </span>
            </div>

            {/* Roster Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search guild party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black text-[#10b981] font-pixel text-xs pl-9 p-2 border-2 border-[#10b981]/30 focus:border-[#10b981] focus:outline-none placeholder-zinc-600"
              />
            </div>

            {/* Peers List */}
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1 pixel-scrollbar">
              {filteredPeers.map((p) => {
                const isActive = p.id === activePeerId;
                const lastMsg = peerChatHistories[p.id]?.[peerChatHistories[p.id].length - 1];

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePeerId(p.id);
                      playSound("click");
                    }}
                    className={`w-full text-left p-3 border-2 transition-all cursor-pointer flex items-center gap-3 relative ${
                      isActive 
                        ? "bg-[#022c22]/50 border-[#10b981] ring-1 ring-[#10b981]/30"
                        : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div 
                      className="w-10 h-10 bg-[#022c22] border border-[#10b981]/30 flex items-center justify-center text-xl shrink-0 relative hover:bg-[#064e3b] transition-colors"
                      title="View Profile"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(p.targetUserId || p.id);
                      }}
                    >
                      <span>{p.avatarSkin}</span>
                      <span className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 ${p.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                    </div>
                    
                    <div className="truncate flex-grow">
                      <div className="flex justify-between items-center">
                        <span 
                          className="font-press text-[10px] text-white truncate max-w-[120px] hover:text-[#10b981] transition-colors"
                          title="View Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfile(p.targetUserId || p.id);
                          }}
                        >
                          {p.name}
                        </span>
                        <span className="text-[9px] font-pixel text-zinc-400">LV {p.level}</span>
                      </div>
                      <p className="text-[11px] font-pixel text-[#10b981] truncate mt-0.5">
                        {p.status}
                      </p>
                      {lastMsg && (
                        <p className="text-[10px] font-pixel text-zinc-500 truncate mt-1 italic">
                          {lastMsg.role === "user" ? "You: " : ""}{lastMsg.text}
                        </p>
                      )}
                    </div>

                    {isActive && (
                      <span className="absolute right-2 top-2 w-1.5 h-1.5 bg-[#10b981] rounded-full" />
                    )}
                  </button>
                );
              })}

              {filteredPeers.length === 0 && (
                <div className="text-center py-8 text-zinc-600 font-pixel text-xs">
                  NO ONLINE PEERS FOUND
                </div>
              )}
            </div>

            {/* Quick Stats Banner */}
            <div className="p-2 bg-black border border-[#10b981]/20 font-pixel text-[10px] text-zinc-400 leading-normal uppercase">
              💡 <span className="text-[#10b981]">PROTIP:</span> Merging study scrolls with online peers adds immediate multipliers to your knowledge yields.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT WINDOW */}
        <div className="col-span-1 lg:col-span-8 flex flex-col min-h-0">
          <div className="pixel-box-green p-5 flex flex-col flex-1 min-h-0">
            {activePeer ? (
              <div className="flex flex-col h-full flex-grow space-y-4">
                
                {/* Active Chat Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#10b981]/20 pb-3.5 gap-2.5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 bg-[#022c22] border-2 border-[#10b981] flex items-center justify-center text-2xl shrink-0 relative cursor-pointer hover:bg-[#064e3b] transition-colors"
                      title="View Profile"
                      onClick={() => onOpenProfile(activePeer.targetUserId || activePeer.id)}
                    >
                      <span>{activePeer.avatarSkin}</span>
                      <span className={`w-3 h-3 rounded-full absolute -top-1 -right-1 ${activePeer.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-press text-sm text-white uppercase cursor-pointer hover:text-[#10b981] transition-colors"
                          title="View Profile"
                          onClick={() => onOpenProfile(activePeer.targetUserId || activePeer.id)}
                        >
                          {activePeer.name}
                        </h3>
                        <span className="text-[9px] font-pixel text-[#10b981] bg-[#022c22] px-1.5 border border-[#10b981]/30">LV {activePeer.level}</span>
                      </div>
                      <span className="text-xs font-pixel text-zinc-400 block mt-0.5">"{activePeer.status}"</span>
                    </div>
                  </div>

                  {/* Skills summary chips */}
                  <div className="text-left sm:text-right text-[10px] font-pixel space-y-0.5">
                    <div>
                      <span className="text-[#10b981] uppercase font-bold">Adept To:</span>{" "}
                      <span className="text-zinc-300">{activePeer.skillsToGive.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-amber-400 uppercase font-bold">Next Targeted Capability:</span>{" "}
                      <span className="text-zinc-300">{activePeer.skillsToLearn.join(", ")}</span>
                    </div>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 min-h-0 bg-black/60 border-2 border-[#10b981]/15 p-4 overflow-y-auto pixel-scrollbar space-y-4 flex flex-col justify-start">
                  <div className="text-center py-1 border-b border-dashed border-[#10b981]/10 mb-2">
                    <span className="text-[9px] font-press text-[#10b981]/50 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Terminal className="w-3 h-3" /> SECURE RETRO LINK COMPLETED • LOCAL ID: {nickname}
                    </span>
                  </div>

                  {activeChat.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[9px] font-press uppercase tracking-wider text-zinc-500 mb-0.5">
                        {msg.role === "user" ? nickname : activePeer.name}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-md p-3 text-xs sm:text-sm font-pixel leading-relaxed border ${
                          msg.role === "user"
                            ? "bg-[#022c22]/70 text-[#10b981] border-[#10b981]/40 rounded-tr-none text-right"
                            : "bg-zinc-900/90 text-zinc-200 border-zinc-800 rounded-tl-none text-left"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isActiveLoading && (
                    <div className="flex flex-col items-start animate-pulse">
                      <span className="text-[9px] font-press text-zinc-500 mb-0.5">{activePeer.name}</span>
                      <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md rounded-tl-none p-3 text-xs font-pixel">
                        <span className="font-press text-[9px] text-[#10b981] tracking-widest uppercase animate-pulse flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" /> Casting Scroll Message...
                        </span>
                      </div>
                    </div>
                  )}

                  {activeChat.length === 0 && !isActiveLoading && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-zinc-500 font-pixel">
                      <Bot className="w-10 h-10 text-[#10b981]/30 mb-2" />
                      <p className="uppercase text-xs tracking-wider">No dialogue logs found.</p>
                      <p className="text-[10px] text-zinc-600 uppercase mt-1">Send a message to initiate co-op learning.</p>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Input Console */}
                <form onSubmit={handleSend} className="flex gap-2.5 pt-2 border-t border-[#10b981]/15">
                  <input
                    type="text"
                    value={localMsg}
                    disabled={isActiveLoading}
                    onChange={(e) => setLocalMsg(e.target.value)}
                    placeholder={`Transmit 8-bit connection scroll to ${activePeer.name}...`}
                    className="w-full bg-black text-[#10b981] font-pixel text-sm p-3 border-2 border-[#10b981]/30 focus:border-[#10b981] focus:outline-none placeholder-zinc-700 disabled:opacity-60"
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    disabled={isActiveLoading || !localMsg.trim()}
                    className="bg-[#10b981] text-black font-press text-[10px] px-5 border-2 border-white hover:bg-[#059669] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase shrink-0"
                  >
                    <Send className="w-4 h-4" /> TRANSMIT
                  </button>
                </form>

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-500 font-pixel">
                <Compass className="w-12 h-12 text-[#10b981]/20 animate-pulse mb-3" />
                <p className="uppercase text-sm tracking-widest">Awaiting Scroll Signal</p>
                <p className="text-xs text-zinc-600 uppercase mt-1">Select a study peer from the party log to begin communication.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
