import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface GameState {
  session: Session | null;
  room: {
    id: string | null;
    hostId: string | null;
    currentTurnUserId: string | null;
    timerStartTimestamp: string | null;
    isActive: boolean;
  };
  participants: Array<{
    id: string;
    userId: string;
    turnOrder: number;
    username: string;
  }>;
  actions: {
    createRoom: () => Promise<string>;
    joinRoom: (roomId: string) => Promise<void>;
    startGame: () => Promise<void>;
    makeMove: () => Promise<void>;
    setSession: (session: Session | null) => void;
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  room: {
    id: null,
    hostId: null,
    currentTurnUserId: null,
    timerStartTimestamp: null,
    isActive: false,
  },
  participants: [],
  actions: {
    createRoom: async () => {
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          host_id: (await supabase.auth.getUser()).data.user?.id,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      set({ room });
      return room.id;
    },
    joinRoom: async (roomId: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Subscribe to room updates
      const roomSubscription = supabase
        .channel(`room:${roomId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            set({ room: payload.new });
          }
        )
        .subscribe();

      // Join room
      const { error } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
        });

      if (error) throw error;
    },
    startGame: async () => {
      const { room } = get();
      if (!room.id) return;

      const { data: participants } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', room.id)
        .order('created_at');

      if (!participants?.length) return;

      await supabase
        .from('rooms')
        .update({
          is_active: true,
          current_turn_user_id: participants[0].user_id,
          timer_start_timestamp: new Date().toISOString(),
        })
        .eq('id', room.id);
    },
    makeMove: async () => {
      // Implement move logic here
    },
    setSession: (session) => set({ session }),
  },
})); 