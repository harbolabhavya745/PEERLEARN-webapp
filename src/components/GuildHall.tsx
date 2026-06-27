import React from "react";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { GameState, AvatarSkin, SkillProfile } from "../types";

interface GuildHallProps {
  gameState: GameState;
  nickname: string;
  activeSkinObj: AvatarSkin;
  handleTavernRest: () => void;
  sendStudyInvitation: (peerName: string) => void;
  INITIAL_PEERS: SkillProfile[];
  playSound: (type: "click" | "coin" | "levelup" | "correct" | "wrong" | "quest_complete" | "heal" | "sync" | "cast_spell" | "danger" | "chat_send" | "chat_reply") => void;
}

export default function GuildHall({
  gameState,
  nickname,
  activeSkinObj,
  handleTavernRest,
  sendStudyInvitation,
  INITIAL_PEERS,
  playSound
}: GuildHallProps) {
  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b-4 border-dashed border-[#10b981]/20 pb-4">
        <h2 className="text-2xl md:text-3xl font-press text-[#10b981] text-retro-shadow-green uppercase mt-2">
          Guild Hall Tavern
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
        <div className="pixel-box-green p-5 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-[#10b981]/20 pb-2">
            <Users className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-sm font-press text-white uppercase">GUILD ACTIVE PARTY</h3>
          </div>
          
          <span className="text-xs font-press text-[#10b981]/70 block uppercase leading-tight">
            Invite online study peers to merge cognitive stacks (Earns XP!):
          </span>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 pixel-scrollbar">
            {INITIAL_PEERS.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-black/40 border-2 border-[#10b981]/15 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#022c22] border-2 border-[#10b981] flex items-center justify-center text-xl relative">
                    <span>{p.avatarSkin}</span>
                    <span className={`w-2.5 h-2.5 rounded-full absolute -top-1 -right-1 ${p.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-press text-[11px] text-white truncate max-w-[120px]">{p.name}</span>
                      <span className="text-[10px] font-pixel text-[#10b981] bg-[#022c22] px-1 border border-[#10b981]/30">LV {p.level}</span>
                    </div>
                    <p className="text-sm font-pixel text-zinc-400 truncate max-w-[170px]">"{p.status}"</p>
                  </div>
                </div>

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
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
