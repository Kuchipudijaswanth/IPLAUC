import React, { useEffect, useState } from 'react';
import socket from './socket';
import { RoomData, Participant } from './types';
import { JoinRoom } from './components/JoinRoom';
import { TeamSelection } from './components/TeamSelection';
import { AuctionRoom } from './components/AuctionRoom';

export default function App() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent accidental back button navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (room && room.status === 'active') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room]);

  useEffect(() => {
    const handleRoomCreated = ({ roomId, participant }: { roomId: string, participant: Participant }) => {
      setParticipant(participant);
    };

    const handleRoomJoined = ({ roomId, participant }: { roomId: string, participant: Participant }) => {
      setParticipant(participant);
    };

    const handleRoomUpdate = (data: RoomData) => {
      setRoom(data);
      // Update local participant if found in room data
      const updatedParticipant = data.participants.find(p => p.id === socket.id);
      if (updatedParticipant) {
        setParticipant(updatedParticipant);
      }
    };

    const handleError = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    };

    const handlePlayerLeft = ({ participantId }: { participantId: string }) => {
      console.log('Player left:', participantId);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('room-update', handleRoomUpdate);
    socket.on('error', handleError);
    socket.on('player-left', handlePlayerLeft);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-update', handleRoomUpdate);
      socket.off('error', handleError);
      socket.off('player-left', handlePlayerLeft);
    };
  }, []);

  if (!room || !participant) {
    return <JoinRoom onJoined={() => {}} />;
  }

  if (room.status === 'waiting') {
    return <TeamSelection room={room} participant={participant} />;
  }

  return <AuctionRoom room={room} participant={participant} />;
}
