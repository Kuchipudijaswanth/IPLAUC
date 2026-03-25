export interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  status: 'available' | 'bidding' | 'sold' | 'unsold';
  soldTo?: string;
  soldPrice?: number;
}

export interface Participant {
  id: string;
  name: string;
  teamName: string;
  budget: number;
  playersBought: Player[];
}

export interface RoomData {
  id: string;
  hostId: string;
  participants: Participant[];
  players: Player[];
  currentPlayerIndex: number;
  status: 'waiting' | 'active' | 'finished';
  currentBid: number;
  currentBidderId: string | null;
  timer: number;
}

export interface Team {
  name: string;
  color: string;
  secondaryColor: string;
  logo: string;
}

export const IPL_TEAMS: Team[] = [
  { name: 'Chennai Super Kings', color: '#FFFF00', secondaryColor: '#0000FF', logo: 'CSK' },
  { name: 'Mumbai Indians', color: '#004BA0', secondaryColor: '#D1AB3E', logo: 'MI' },
  { name: 'Royal Challengers Bengaluru', color: '#EC1C24', secondaryColor: '#000000', logo: 'RCB' },
  { name: 'Kolkata Knight Riders', color: '#3A225D', secondaryColor: '#B3A123', logo: 'KKR' },
  { name: 'Delhi Capitals', color: '#00008B', secondaryColor: '#FF0000', logo: 'DC' },
  { name: 'Rajasthan Royals', color: '#EA1A85', secondaryColor: '#254AA5', logo: 'RR' },
  { name: 'Punjab Kings', color: '#ED1B24', secondaryColor: '#D1AB3E', logo: 'PBKS' },
  { name: 'Sunrisers Hyderabad', color: '#FF822A', secondaryColor: '#000000', logo: 'SRH' },
  { name: 'Gujarat Titans', color: '#1B2133', secondaryColor: '#BC9411', logo: 'GT' },
  { name: 'Lucknow Super Giants', color: '#0057E2', secondaryColor: '#FF4B4B', logo: 'LSG' },
];
