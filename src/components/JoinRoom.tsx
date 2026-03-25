import React, { useState } from 'react';
import socket from '../socket';
import { Trophy, Plus, LogIn, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JoinRoomProps {
  onJoined: (roomId: string, participant: any) => void;
}

export function JoinRoom({ onJoined }: JoinRoomProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = () => {
    if (!name) return setError('Please enter your name');
    socket.connect();
    socket.emit('create-room', name);
  };

  const handleJoin = () => {
    if (!name || !roomCode) return setError('Please enter name and room code');
    socket.connect();
    socket.emit('join-room', { roomId: roomCode.toUpperCase(), name });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-glow" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"
      >
        {/* Left Side: Editorial Content */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">
              <Sparkles className="w-3 h-3" />
              Live Auction Simulator
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase text-display">
              IPL <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">AUCTION</span> <br />
              2026
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg max-w-md font-medium leading-relaxed"
          >
            Experience the thrill of real-time bidding. Build your dream squad, manage your budget, and dominate the league.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-8 pt-4"
          >
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">100 Cr</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Budget</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">10</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Elite Teams</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Action Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass p-10 rounded-[40px] shadow-2xl relative overflow-hidden"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Your Identity</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleCreate}
                className="group relative w-full bg-white text-black font-black py-5 px-8 rounded-2xl text-xl transition-all hover:bg-blue-500 hover:text-white active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-xl"
              >
                <Plus className="w-6 h-6" />
                <span>Create New Room</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>

              <div className="relative py-4 flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">or join existing</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white text-center font-mono text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 uppercase"
                  placeholder="CODE"
                  maxLength={6}
                />
                <button
                  onClick={handleJoin}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center border border-white/10"
                >
                  <LogIn className="w-6 h-6" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold py-4 px-6 rounded-2xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 left-12 flex items-center gap-4 opacity-30">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Online</span>
      </div>
    </div>
  );
}
