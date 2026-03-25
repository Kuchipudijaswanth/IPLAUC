import React from 'react';
import socket from '../socket';
import { IPL_TEAMS, Team, Participant, RoomData } from '../types';
import { Trophy, ChevronRight, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamSelectionProps {
  room: RoomData;
  participant: Participant;
}

export function TeamSelection({ room, participant }: TeamSelectionProps) {
  const selectTeam = (team: Team) => {
    const isTaken = room.participants.some(p => p.teamName === team.name);
    if (isTaken) return;
    socket.emit('select-team', { roomId: room.id, teamName: team.name });
  };

  const startAuction = () => {
    socket.emit('start-auction', room.id);
  };

  const isHost = room.hostId === participant.id;
  const allTeamsSelected = room.participants.every(p => p.teamName !== '');

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-12 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col">
        <header className="flex flex-col md:flex-row items-end justify-between mb-12 gap-8 border-b border-white/10 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">
              <ShieldCheck className="w-4 h-4" />
              Phase 01: Franchise Selection
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase text-display">
              CHOOSE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">FRANCHISE</span>
            </h1>
            <p className="text-slate-500 font-mono text-sm">ROOM_ID: {room.id}</p>
          </div>
          
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startAuction}
              disabled={!allTeamsSelected}
              className={`group flex items-center gap-4 py-6 px-12 rounded-full font-black text-2xl transition-all shadow-2xl ${
                allTeamsSelected 
                ? 'bg-white text-black hover:bg-blue-500 hover:text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              START AUCTION <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {IPL_TEAMS.map((team, idx) => {
            const takenBy = room.participants.find(p => p.teamName === team.name);
            const isMyTeam = participant.teamName === team.name;

            return (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={team.name}
                onClick={() => selectTeam(team)}
                disabled={!!takenBy && !isMyTeam}
                className={`relative h-[280px] rounded-[32px] p-8 flex flex-col justify-between transition-all duration-500 group overflow-hidden border-2 ${
                  takenBy 
                  ? isMyTeam ? 'border-white scale-[1.02] shadow-2xl z-10' : 'opacity-20 grayscale cursor-not-allowed border-transparent'
                  : 'cursor-pointer border-transparent hover:border-white/40 hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: team.color,
                  color: team.name === 'Chennai Super Kings' ? '#000' : '#fff'
                }}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="text-9xl font-black leading-none select-none">{team.logo}</div>
                </div>

                <div className="relative z-10">
                  <div className="text-5xl font-black mb-2 tracking-tighter">{team.logo}</div>
                  <div className="text-sm font-black uppercase tracking-widest opacity-60">Franchise</div>
                </div>

                <div className="relative z-10">
                  <div className="text-xl font-black leading-tight uppercase tracking-tight max-w-[120px]">{team.name}</div>
                </div>
                
                {takenBy && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Claimed By</div>
                    <div className="text-xl font-black text-white text-center uppercase tracking-tight">{takenBy.name}</div>
                    {isMyTeam && (
                      <div className="mt-4 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Your Team
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Participants Sidebar/Footer */}
        <div className="mt-auto glass rounded-[40px] p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
              <Users className="w-8 h-8 text-blue-500" />
              War Room ({room.participants.length}/10)
            </h2>
            {!allTeamsSelected && (
              <div className="text-xs font-black text-blue-400 animate-pulse uppercase tracking-[0.2em]">
                Waiting for all owners to select teams...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {room.participants.map((p, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={p.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-white text-xl">
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white truncate uppercase tracking-tight">{p.name}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${p.teamName ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {p.teamName || 'Selecting...'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
