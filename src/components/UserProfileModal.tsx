import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, GraduationCap, BookOpen, Users, BrainCircuit } from "lucide-react";

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setNotes([]);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("pl_access_token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const [profRes, notesRes] = await Promise.all([
          fetch(`/api/users/profile?id=${userId}`, { headers }),
          fetch(`/api/notion/public-notes?user_id=${userId}`, { headers }).catch(() => ({ ok: false, json: async () => ({ notes: [] }) }))
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setProfile(profData.profile);
        }
        
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.notes || []);
        } else {
          setNotes([]);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (!userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-black border-4 border-[#3b82f6] shadow-[0_10px_0_#1d4ed8] p-1 rounded-sm flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#172554] border-b-4 border-[#3b82f6] p-3 flex justify-between items-center shrink-0">
            <h3 className="font-press text-white text-sm uppercase">Player Card</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-rose-400 p-1 bg-black border-2 border-white/20 hover:border-rose-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto pixel-scrollbar p-5 flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-4xl animate-spin inline-block">⏳</span>
                <span className="font-press text-[10px] text-[#3b82f6] uppercase animate-pulse">Loading Profile...</span>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                
                {/* Avatar & Basic Info */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-20 h-20 bg-blue-950 border-4 border-[#3b82f6] flex items-center justify-center text-4xl shadow-[0_4px_0_#1d4ed8] relative">
                    {profile.avatar_skin || profile.full_name?.[0] || "👤"}
                    {profile.is_online && (
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-press text-white text-lg uppercase leading-tight">{profile.full_name}</h2>
                    {profile.username && (
                      <div className="font-pixel text-[#3b82f6] text-sm mt-1">
                        @{profile.username}
                      </div>
                    )}
                  </div>
                </div>

                {/* College & Course */}
                {(profile.college || profile.course) && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 font-pixel text-xs text-zinc-300 bg-white/5 p-2 border border-white/10 rounded">
                    {profile.college && (
                      <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#3b82f6]" /> {profile.college}</span>
                    )}
                    {profile.college && profile.course && <span className="text-zinc-600 hidden sm:inline">•</span>}
                    {profile.course && (
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#3b82f6]" /> {profile.course}</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black border-2 border-zinc-800 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1 text-[8px] font-press text-emerald-400 uppercase">
                      Level
                    </div>
                    <div className="font-pixel text-lg text-white">
                      {profile.level || 1}
                    </div>
                  </div>
                  <div className="bg-black border-2 border-zinc-800 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1 text-[8px] font-press text-purple-400 uppercase">
                      EXP
                    </div>
                    <div className="font-pixel text-lg text-white">
                      {profile.xp || 0}
                    </div>
                  </div>
                  <div className="bg-black border-2 border-zinc-800 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1 text-[8px] font-press text-cyan-400 uppercase">
                      <Users className="w-3 h-3" /> Conns
                    </div>
                    <div className="font-pixel text-lg text-white">
                      {(profile.followers_count?.[0]?.count || 0) + (profile.following_count?.[0]?.count || 0)}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="bg-blue-950/30 border border-[#3b82f6]/30 p-3 relative">
                    <div className="absolute -top-2 left-2 bg-black px-1 text-[8px] font-press text-[#3b82f6]">BIO</div>
                    <p className="font-sans text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Skills */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] font-press text-[#10b981] uppercase">Adept To</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill: string, i: number) => (
                          <span key={i} className="text-[10px] font-pixel text-emerald-400 bg-[#022c22] px-2 py-1 border border-emerald-500/30 uppercase">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-pixel text-zinc-500 uppercase">None specified</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[9px] font-press text-amber-400 uppercase">Targeting (Wants to Learn)</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsToLearn && profile.skillsToLearn.length > 0 ? (
                        profile.skillsToLearn.map((skill: string, i: number) => (
                          <span key={i} className="text-[10px] font-pixel text-amber-400 bg-amber-400/10 px-2 py-1 border border-amber-500/30 uppercase">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-pixel text-zinc-500 uppercase">None specified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Public Notes */}
                <div className="pt-4 border-t-2 border-dashed border-zinc-800 space-y-3">
                  <div className="text-[10px] font-press text-zinc-400 uppercase">Public Study Notes</div>
                  
                  {notes.length > 0 ? (
                    <div className="space-y-2">
                      {notes.map((n, i) => (
                        <div key={i} className="bg-black border-2 border-zinc-800 p-3 flex justify-between items-center group hover:border-[#3b82f6]/50 transition-colors">
                          <div>
                            <div className="font-pixel text-sm text-white mb-1.5">{n.title}</div>
                            <span className="text-[9px] font-press text-amber-400 bg-amber-400/10 px-1 border border-amber-400/20">{n.subject || 'Note'}</span>
                          </div>
                          {n.url && (
                            <a 
                              href={n.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-press text-[#3b82f6] bg-blue-950 px-2 py-1.5 border border-[#3b82f6]/50 hover:bg-[#3b82f6] hover:text-black flex items-center gap-1 uppercase"
                            >
                              <ExternalLink className="w-3 h-3" /> Read
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-black border-2 border-zinc-800 border-dashed p-4 text-center text-xs font-pixel text-zinc-500 uppercase">
                      No public scrolls shared yet.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-10 font-pixel text-rose-400 uppercase">Profile not found.</div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
