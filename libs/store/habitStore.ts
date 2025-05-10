/**
 * Store de Zustand para gestionar los hábitos y sus registros
 */
import { create } from 'zustand';
import { Habit, HabitLog, Status } from '../../app/types/db';
import * as habitLogService from '../supabase/habitLogs';
import * as habitService from '../supabase/habits';
import * as habitStreakService from '../supabase/habitStreaks';

interface HabitStoreState {
  // Estado
  habits: Habit[];
  currentHabit: Habit | null;
  habitLogs: Record<string, HabitLog[]>; // habitId -> logs
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchHabits: (userId: string, includeArchived?: boolean) => Promise<void>;
  fetchHabitById: (habitId: string) => Promise<void>;
  fetchHabitLogs: (habitId: string, startDate?: string, endDate?: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<Habit>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string, archived?: boolean) => Promise<void>;
  logHabit: (
    habitId: string, 
    userId: string, 
    logDate: string, 
    status: Status, 
    quantity?: number, 
    note?: string
  ) => Promise<void>;
  deleteHabitLog: (habitId: string, logId: string) => Promise<void>;
  clearErrors: () => void;
}

export const useHabitStore = create<HabitStoreState>((set, get) => ({
  // Estado inicial
  habits: [],
  currentHabit: null,
  habitLogs: {},
  isLoading: false,
  error: null,
  
  // Acciones
  fetchHabits: async (userId: string, includeArchived = false) => {
    try {
      set({ isLoading: true, error: null });
      const habits = await habitService.getHabits(userId, includeArchived);
      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error fetching habits:', error);
      set({ isLoading: false, error: 'Error al cargar los hábitos' });
    }
  },
  
  fetchHabitById: async (habitId: string) => {
    try {
      set({ isLoading: true, error: null });
      const habit = await habitService.getHabitById(habitId);
      set({ currentHabit: habit, isLoading: false });
    } catch (error) {
      console.error('Error fetching habit:', error);
      set({ isLoading: false, error: 'Error al cargar el hábito' });
    }
  },
  
  fetchHabitLogs: async (habitId: string, startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      const logs = await habitLogService.getHabitLogs(habitId, startDate, endDate);
      set(state => ({
        habitLogs: { ...state.habitLogs, [habitId]: logs },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching habit logs:', error);
      set({ isLoading: false, error: 'Error al cargar los registros del hábito' });
    }
  },
  
  createHabit: async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    try {
      set({ isLoading: true, error: null });
      const newHabit = await habitService.createHabit(habit);
      
      // Crear o inicializar racha
      await habitStreakService.getOrCreateHabitStreak(newHabit.id);
      
      set(state => ({
        habits: [newHabit, ...state.habits],
        isLoading: false
      }));
      
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      set({ isLoading: false, error: 'Error al crear el hábito' });
      throw error;
    }
  },
  
  updateHabit: async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>) => {
    try {
      set({ isLoading: true, error: null });
      const updatedHabit = await habitService.updateHabit(habitId, updates);
      
      set(state => ({
        habits: state.habits.map(h => h.id === habitId ? updatedHabit : h),
        currentHabit: state.currentHabit?.id === habitId ? updatedHabit : state.currentHabit,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating habit:', error);
      set({ isLoading: false, error: 'Error al actualizar el hábito' });
    }
  },
  
  deleteHabit: async (habitId: string) => {
    try {
      set({ isLoading: true, error: null });
      await habitService.deleteHabit(habitId);
      
      set(state => {
        // Crear un nuevo objeto de registros sin la entrada del hábito eliminado
        const newHabitLogs = { ...state.habitLogs };
        delete newHabitLogs[habitId];
        
        return {
          habits: state.habits.filter(h => h.id !== habitId),
          currentHabit: state.currentHabit?.id === habitId ? null : state.currentHabit,
          habitLogs: newHabitLogs,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({ isLoading: false, error: 'Error al eliminar el hábito' });
    }
  },
  
  archiveHabit: async (habitId: string, archived = true) => {
    try {
      set({ isLoading: true, error: null });
      const updatedHabit = await habitService.archiveHabit(habitId, archived);
      
      set(state => ({
        habits: state.habits.map(h => h.id === habitId ? updatedHabit : h),
        currentHabit: state.currentHabit?.id === habitId ? updatedHabit : state.currentHabit,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error archiving habit:', error);
      set({ isLoading: false, error: 'Error al archivar el hábito' });
    }
  },
  
  logHabit: async (
    habitId: string, 
    userId: string, 
    logDate: string, 
    status: Status, 
    quantity?: number, 
    note?: string
  ) => {
    try {
      set({ isLoading: true, error: null });
      const log = await habitLogService.logHabit(habitId, userId, logDate, status, quantity, note);
      
      // Actualizar la racha si es necesario
      if (status === 'DONE') {
        const streak = await habitStreakService.getOrCreateHabitStreak(habitId);
        
        // Lógica simple para actualizar la racha
        const lastDate = streak.lastCompletionDate ? new Date(streak.lastCompletionDate) : null;
        const currentDate = new Date(logDate);
        
        let currentStreak = streak.currentStreak;
        let longestStreak = streak.longestStreak;
        
        // Si es la primera vez o si la fecha es un día después de la última
        if (!lastDate || 
            (Math.abs(currentDate.getTime() - lastDate.getTime()) <= 86400000 * 2 && 
             currentDate.getDate() !== lastDate.getDate())) {
          currentStreak += 1;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
        } 
        // Si es el mismo día, no incrementar
        else if (lastDate && 
                 currentDate.getDate() === lastDate.getDate() && 
                 currentDate.getMonth() === lastDate.getMonth() && 
                 currentDate.getFullYear() === lastDate.getFullYear()) {
          // No hacer nada, mismo día
        } 
        // Si hay un gap, reiniciar
        else {
          currentStreak = 1;
        }
        
        await habitStreakService.updateHabitStreak(habitId, {
          currentStreak,
          longestStreak,
          lastCompletionDate: logDate
        });
      }
      
      // Actualizar el estado local
      set(state => {
        const currentLogs = state.habitLogs[habitId] || [];
        const updatedLogs = [
          log,
          ...currentLogs.filter(l => l.id !== log.id)
        ];
        
        return {
          habitLogs: { ...state.habitLogs, [habitId]: updatedLogs },
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error logging habit:', error);
      set({ isLoading: false, error: 'Error al registrar el hábito' });
    }
  },
  
  deleteHabitLog: async (habitId: string, logId: string) => {
    try {
      set({ isLoading: true, error: null });
      await habitLogService.deleteHabitLog(logId);
      
      set(state => {
        const currentLogs = state.habitLogs[habitId] || [];
        const updatedLogs = currentLogs.filter(log => log.id !== logId);
        
        return {
          habitLogs: { ...state.habitLogs, [habitId]: updatedLogs },
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error deleting habit log:', error);
      set({ isLoading: false, error: 'Error al eliminar el registro' });
    }
  },
  
  clearErrors: () => set({ error: null })
})); 