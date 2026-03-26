import React, { useEffect, useState, useMemo, useRef } from 'react';
import socket from '../socket';
import { Player, Participant, RoomData, IPL_TEAMS } from '../types';
import { Trophy, Users, Wallet, Timer, Gavel, CheckCircle2, XCircle, ShieldCheck, Activity, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AuctionRoomProps {
  room: RoomData;
  participant: Participant;
}

// Sound Synthesis Helper
const useAuctionSounds = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  const initAudio = React.useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playTick = React.useCallback(() => {
    if (muted) return;
    initAudio();
    if (!audioCtx.current) return;
    
    try {
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.current.currentTime);
      
      gain.gain.setValueAtTime(0.2, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing tick sound:', error);
    }
  }, [muted, initAudio]);

  const playHammer = React.useCallback(() => {
    if (muted) return;
    initAudio();
    if (!audioCtx.current) return;
    
    try {
      // Create three hammer strikes
      const strikes = [0, 0.15, 0.3];
      
      strikes.forEach((delay) => {
        const osc = audioCtx.current!.createOscillator();
        const gain = audioCtx.current!.createGain();
        const startTime = audioCtx.current!.currentTime + delay;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, startTime);
        osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.current!.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });
    } catch (error) {
      console.error('Error playing hammer sound:', error);
    }
  }, [muted, initAudio]);

  return { initAudio, playTick, playHammer, muted, setMuted };
};

export function AuctionRoom({ room, participant }: AuctionRoomProps) {
  const [timeLeft, setTimeLeft] = useState(room.timer);
  const { initAudio, playTick, playHammer, muted, setMuted } = useAuctionSounds();
  const lastPlayerStatus = useRef<string | null>(null);

  useEffect(() => {
    setTimeLeft(room.timer);
    if (room.timer <= 3 && room.timer > 0 && room.status === 'active') {
      playTick();
    }
  }, [room.timer, room.status, playTick]);

  useEffect(() => {
    const handleTimer = (time: number) => setTimeLeft(time);
    socket.on('timer-update', handleTimer);
    return () => {
      socket.off('timer-update', handleTimer);
    };
  }, []);

  // Monitor player status changes for "Sold" sound
  useEffect(() => {
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer && currentPlayer.status !== lastPlayerStatus.current) {
      if (currentPlayer.status === 'sold') {
        playHammer();
      }
      lastPlayerStatus.current = currentPlayer.status;
    }
  }, [room.players, room.currentPlayerIndex, playHammer]);

  const myTeam = useMemo(() => 
    IPL_TEAMS.find(t => t.name === participant.teamName) || IPL_TEAMS[0], 
    [participant.teamName]
  );
  
  const currentPlayer = useMemo(() => 
    room.players[room.currentPlayerIndex], 
    [room.players, room.currentPlayerIndex]
  );

  const currentBidder = useMemo(() => 
    room.participants.find(p => p.id === room.currentBidderId),
    [room.participants, room.currentBidderId]
  );

  const placeBid = () => {
    initAudio();
    if (timeLeft === 0) return;
    socket.emit('place-bid', room.id);
  };

  const skipPlayer = () => {
    if (participant.id !== room.hostId) return;
    socket.emit('skip-player', room.id);
  };

  const isHost = participant.id === room.hostId;

  // Dynamic Theme Colors
  const themeColor = myTeam.color;
  const secondaryColor = myTeam.secondaryColor;
  const isDarkTeam = ['Mumbai Indians', 'Kolkata Knight Riders', 'Delhi Capitals', 'Gujarat Titans'].includes(myTeam.name);

  return (
    <div 
      className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-500/30"
      style={{ '--accent': themeColor, '--secondary': secondaryColor } as any}
    >
      {/* Top Bar */}
      <header className="h-20 glass-dark border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500"
              style={{ backgroundColor: themeColor }}
            >
              <Activity className={cn("w-6 h-6", isDarkTeam ? "text-white" : "text-black")} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1 opacity-60" style={{ color: themeColor }}>Live Feed</div>
              <div className="text-sm font-black uppercase tracking-tight">Auction Console v2.0</div>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] shadow-xl transition-all duration-500"
              style={{ backgroundColor: themeColor, color: isDarkTeam ? '#fff' : '#000' }}
            >
              {myTeam.logo}
            </div>
            <div className="text-sm font-black uppercase tracking-tight">{myTeam.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => { initAudio(); setMuted(!muted); }}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
          </button>
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Available Budget</div>
            <div className="text-2xl font-black text-emerald-400 tabular-nums leading-none">{participant.budget.toFixed(1)} <span className="text-xs">CR</span></div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Squad Size</div>
            <div className="text-2xl font-black text-white tabular-nums leading-none">{participant.playersBought.length}<span className="text-slate-600 text-xs">/11</span></div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Center: Main Stage */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {room.status === 'active' && currentPlayer ? (
            <div className="flex-1 flex flex-col gap-6">
              {/* Player Showcase */}
              <div className="glass rounded-[48px] flex-1 relative overflow-hidden flex flex-col shadow-2xl border border-white/5">
                {/* Background Visuals */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000"
                  style={{ background: `radial-gradient(circle at 50% 30%, ${themeColor} 0%, transparent 70%)` }}
                />
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[150px] animate-pulse-glow transition-all duration-1000"
                  style={{ backgroundColor: `${themeColor}20` }}
                />
                
                <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                  <motion.div 
                    key={currentPlayer.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-40 h-40 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 border border-white/10 shadow-2xl transform -rotate-3">
                      <Users className="w-20 h-20 text-white/20" />
                    </div>
                    <h2 className="text-7xl font-black text-white leading-none tracking-tighter uppercase text-display mb-4">
                      {currentPlayer.name}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span 
                        className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500"
                        style={{ backgroundColor: themeColor, color: isDarkTeam ? '#fff' : '#000' }}
                      >
                        {currentPlayer.role}
                      </span>
                      <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">ID: {currentPlayer.id}</span>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-24 mt-16 w-full max-w-xl">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Base Valuation</div>
                      <div className="text-5xl font-black text-white tabular-nums">{currentPlayer.basePrice}<span className="text-lg ml-1 text-slate-600">CR</span></div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: themeColor }}>Current Bid</div>
                      <motion.div 
                        key={room.currentBid}
                        initial={{ scale: 1.1, color: themeColor }}
                        animate={{ scale: 1, color: '#fff' }}
                        className="text-5xl font-black text-white tabular-nums"
                      >
                        {room.currentBid.toFixed(1)}<span className="text-lg ml-1" style={{ color: themeColor }}>CR</span>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="h-32 bg-white/[0.02] border-t border-white/5 flex items-center justify-between px-12 relative z-10 backdrop-blur-xl">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle 
                          cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={226.2}
                          strokeDashoffset={226.2 - (226.2 * timeLeft) / 20}
                          className={cn("transition-all duration-1000")}
                          style={{ color: timeLeft <= 5 ? '#ef4444' : themeColor }}
                        />
                      </svg>
                      <div className={cn("absolute inset-0 flex items-center justify-center font-black text-2xl tabular-nums", timeLeft <= 5 ? "text-red-500" : "text-white")}>
                        {timeLeft}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Auction Timer</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seconds Remaining</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: themeColor }}>Leading Bidder</div>
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={room.currentBidderId || 'none'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-2xl font-black uppercase tracking-tight"
                      >
                        {currentBidder ? currentBidder.name : 'NO BIDS'}
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {currentBidder?.teamName || '---'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="h-32 flex gap-4">
                <button
                  onClick={placeBid}
                  disabled={timeLeft === 0 || room.currentBidderId === participant.id}
                  className={cn(
                    "flex-1 rounded-[32px] font-black text-3xl uppercase tracking-tighter transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden",
                    timeLeft === 0 || room.currentBidderId === participant.id
                      ? "bg-white/5 text-white/10 cursor-not-allowed border border-white/5"
                      : "bg-white text-black shadow-2xl active:scale-[0.98]"
                  )}
                  style={{ 
                    backgroundColor: (timeLeft > 0 && room.currentBidderId !== participant.id) ? themeColor : undefined,
                    color: (timeLeft > 0 && room.currentBidderId !== participant.id) ? (isDarkTeam ? '#fff' : '#000') : undefined
                  }}
                >
                  <span className="text-[10px] font-black tracking-[0.4em] opacity-50">Confirm Bid</span>
                  <span>+ 0.5 CR</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
                
                {isHost && (
                  <button
                    onClick={skipPlayer}
                    className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-black px-8 rounded-[32px] transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500 shrink-0"
                    title="Skip this player (Host only)"
                  >
                    <XCircle className="w-6 h-6" />
                    <span className="text-sm uppercase tracking-wider">Skip</span>
                  </button>
                )}
              </div>
            </div>
          ) : room.status === 'finished' ? (
            <div className="flex-1 glass rounded-[48px] flex flex-col items-center justify-center p-16 text-center">
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border border-white/10"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Trophy className="w-12 h-12" style={{ color: themeColor }} />
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Auction Concluded</h2>
              <p className="text-slate-500 max-w-sm mb-12 font-medium">The hammer has fallen. All players have been assigned to their respective franchises.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-black font-black py-5 px-12 rounded-2xl text-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95"
              >
                NEW SESSION
              </button>
            </div>
          ) : null}
        </div>

        {/* Right: Franchise Standings */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className="glass rounded-[32px] flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Franchise Hub
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {room.participants?.map(p => {
                const team = IPL_TEAMS.find(t => t.name === p.teamName) || IPL_TEAMS[0];
                const isLeading = room.currentBidderId === p.id;
                const isMe = p.id === participant.id;
                
                return (
                  <div 
                    key={p.id} 
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-500",
                      isLeading ? "shadow-xl" : "bg-white/[0.03] border-white/5",
                      isMe && !isLeading && "border-white/20"
                    )}
                    style={{ 
                      backgroundColor: isLeading ? team.color : undefined,
                      borderColor: isLeading ? team.color : undefined
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[8px] shadow-lg"
                          style={{ backgroundColor: team.color, color: team.name === 'Chennai Super Kings' ? '#000' : '#fff' }}
                        >
                          {team.logo}
                        </div>
                        <div className="min-w-0">
                          <div className={cn("text-xs font-black truncate uppercase tracking-tight", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black" : "text-white") : "text-slate-200")}>
                            {p.name} {isMe && "(YOU)"}
                          </div>
                          <div className={cn("text-[8px] font-bold uppercase tracking-widest", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black/60" : "text-white/60") : "text-slate-500")}>
                            {team.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-sm font-black tabular-nums", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black" : "text-white") : "text-emerald-400")}>
                          {p.budget.toFixed(1)}
                        </div>
                        <div className={cn("text-[8px] font-bold uppercase tracking-widest", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black/40" : "text-white/40") : "text-slate-600")}>
                          REMAINING
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {p.playersBought.length > 0 ? (
                        <>
                          <div className={cn("text-[8px] font-bold uppercase tracking-widest mb-2", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black/60" : "text-white/60") : "text-slate-500")}>
                            Squad ({p.playersBought.length}/11)
                          </div>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                            {p.playersBought.map(player => (
                              <div 
                                key={player.id} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg text-[10px]",
                                  isLeading ? "bg-black/10" : "bg-white/5"
                                )} 
                                title={`${player.name} - ${player.role}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center font-black text-[8px] shrink-0",
                                    isLeading ? "bg-black/20 text-black/60" : "bg-white/10 text-white/60"
                                  )}>
                                    {player.name[0]}
                                  </div>
                                  <span className={cn("font-bold truncate", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black" : "text-white") : "text-slate-300")}>
                                    {player.name}
                                  </span>
                                </div>
                                <span className={cn("font-black tabular-nums shrink-0", isLeading ? (['Chennai Super Kings'].includes(team.name) ? "text-black/60" : "text-white/60") : "text-slate-500")}>
                                  {player.soldPrice?.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "w-6 h-6 rounded-md border border-dashed",
                                isLeading ? "bg-black/5 border-black/20" : "bg-black/20 border-white/5"
                              )} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
