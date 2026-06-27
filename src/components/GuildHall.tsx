import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, MessageSquare } from "lucide-react";
import { GameState, AvatarSkin, SkillProfile } from "../types";

interface GuildHallProps {
  gameState: GameState;
  nickname: string;
  setNickname: (name: string) => void;
  activeSkinObj: AvatarSkin;
  handleTavernRest: () => void;
  sendStudyInvitation: (peerName: string) => void;
  INITIAL_PEERS: SkillProfile[];
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
  onOpenChat: (peerId: string) => void;
}

export default function GuildHall({
  gameState,
  nickname,
  setNickname,
  activeSkinObj,
  handleTavernRest,
  sendStudyInvitation,
  INITIAL_PEERS,
  playSound,
  onOpenChat
}: GuildHallProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(nickname);

  const saveNickname = () => {
    if (tempName.trim()) {
      setNickname(tempName.trim());
      setIsEditing(false);
      playSound("coin");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#10b981]/20 pb-4">
        <span className="text-xs text-[#10b981] font-press tracking-wider uppercase block">
          MODULE 01: DASHBOARD
        </span>
        <h2 className="text-2xl md:text-3xl font-press text-[#10b981] text-retro-shadow-green uppercase mt-2">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHARACTER PROFILE CARD */}
        <div className="pixel-box-green p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">{activeSkinObj.spriteUrl}</span>
              <div>
                <span className="text-xs text-[#10b981] font-press uppercase block">Hero Profile</span>
                <span className="text-xl font-press text-white">{nickname}</span>
              </div>
            </div>

            {/* NICKNAME CHANGER */}
            <div className="space-y-2 bg-black/40 p-3 border-2 border-[#10b981]/30">
              <span className="text-[11px] text-[#10b981]/70 font-press uppercase block">
                [Rename Character]
              </span>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-black text-[#10b981] font-pixel text-xl p-1.5 border-2 border-[#10b981] focus:outline-none"
                    maxLength={16}
                  />
                  <button
                    onClick={saveNickname}
                    className="bg-[#10b981] text-black font-press text-[10px] px-3 border-2 border-white hover:bg-[#059669] cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-pixel text-white">IGN: {nickname}</span>
                  <button
                    onClick={() => { setTempName(nickname); setIsEditing(true); playSound("click"); }}
                    className="text-xs font-press text-[#10b981] hover:underline cursor-pointer"
                  >
                    [EDIT]
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1 bg-[#022c22]/80 p-3 border border-[#10b981]/20 font-sans text-xs text-zinc-300 leading-relaxed">
              <p className="font-pixel text-xl text-[#10b981]">
                ACTIVE CLASS: <strong className="text-white">{activeSkinObj.name}</strong>
              </p>
              <p className="font-pixel text-lg">
                BUFF PERK: <strong className="text-white">{activeSkinObj.powerName}</strong>
              </p>
            </div>
          </div>

          {/* TAVERN REST HEALING */}
          <div className="pt-3 border-t-2 border-dashed border-[#10b981]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs text-white font-press uppercase block">REST AT TAVERN</span>
              <span className="text-sm font-pixel text-zinc-400">
                Spend 10 Gold Coins to recover full cognitive energy health.
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={handleTavernRest}
              className="w-full sm:w-auto bg-[#10b981] text-black font-press text-xs py-2 px-4 border-2 border-white shadow-[0_4px_0_#047857] hover:bg-[#059669] cursor-pointer uppercase flex-shrink-0"
            >
              REST (💰10)
            </motion.button>
          </div>
        </div>

        {/* CO-OP ACTIVE PEER LOBBY */}
        <div className="pixel-box-green p-5 flex flex-col space-y-4 min-h-[380px]">
          <div className="flex items-center gap-2 border-b border-[#10b981]/20 pb-2 justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10b981]" />
              <h3 className="text-sm font-press text-white uppercase">ACTIVE NETWORK</h3>
            </div>
            <span className="text-[10px] font-pixel text-[#10b981] animate-pulse">
              ● {INITIAL_PEERS.filter((p) => p.isOnline).length} ONLINE
            </span>
          </div>

          <span className="text-xs font-press text-[#10b981]/70 block uppercase leading-tight">
            Invite study peers to collaborate or chat directly:
          </span>

          <div className="space-y-3 overflow-y-auto pr-1 pixel-scrollbar flex-grow max-h-[300px]">
            {INITIAL_PEERS.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-black/40 border-2 border-[#10b981]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#022c22] border-2 border-[#10b981] flex items-center justify-center text-xl relative shrink-0">
                    <span>{p.avatarSkin}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full absolute -top-1 -right-1 ${
                        p.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-press text-[11px] text-white truncate max-w-[120px]">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-pixel text-[#10b981] bg-[#022c22] px-1 border border-[#10b981]/30">
                        LV {p.level}
                      </span>
                    </div>
                    <p className="text-sm font-pixel text-zinc-400 truncate max-w-[170px] sm:max-w-[210px]">
                      "{p.status}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end shrink-0">
                  <motion.button
                    whileHover={{ scale: p.isOnline ? 1.05 : 1 }}
                    whileTap={{ scale: p.isOnline ? 0.95 : 1 }}
                    disabled={!p.isOnline}
                    onClick={() => sendStudyInvitation(p.name)}
                    className={`font-press text-[9px] px-2.5 py-1.5 border-2 uppercase cursor-pointer ${
                      p.isOnline
                        ? "bg-[#10b981] text-black border-white shadow-[0_2px_0_#047857] hover:bg-[#059669]"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {p.isOnline ? "INVITE" : "OFFLINE"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onOpenChat(p.id)}
                    className="font-press text-[9px] px-2.5 py-1.5 border-2 border-[#10b981]/40 bg-black text-[#10b981] hover:bg-[#10b981]/20 cursor-pointer flex items-center gap-1 uppercase font-bold"
                  >
                    <MessageSquare className="w-3 h-3" /> Chat Console
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
