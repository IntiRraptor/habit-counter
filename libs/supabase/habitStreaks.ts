/**
 * Módulo para interactuar con la tabla habit_streaks de Supabase
 * Proporciona funciones para gestionar rachas de hábitos
 */
import { supabase } from '../../app/services/supabaseClient';
import { HabitStreak } from '../../app/types/db';

export const getHabitStreak = async (habitId: string): Promise<HabitStreak | null> => {
  try {
    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('habit_id', habitId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      habitId: data.habit_id,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastCompletionDate: data.last_completion_date
    };
  } catch (error) {
    console.error('Error fetching habit streak:', error);
    throw error;
  }
};

export const createHabitStreak = async (habitId: string): Promise<HabitStreak> => {
  try {
    const streakData = {
      habit_id: habitId,
      current_streak: 0,
      longest_streak: 0,
      last_completion_date: null
    };
    
    const { data, error } = await supabase
      .from('habit_streaks')
      .insert(streakData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      habitId: data.habit_id,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastCompletionDate: data.last_completion_date
    };
  } catch (error) {
    console.error('Error creating habit streak:', error);
    throw error;
  }
};

export const updateHabitStreak = async (
  habitId: string, 
  updates: { currentStreak?: number; longestStreak?: number; lastCompletionDate?: string }
): Promise<HabitStreak> => {
  try {
    const streakData: any = {};
    
    if (updates.currentStreak !== undefined) streakData.current_streak = updates.currentStreak;
    if (updates.longestStreak !== undefined) streakData.longest_streak = updates.longestStreak;
    if (updates.lastCompletionDate !== undefined) streakData.last_completion_date = updates.lastCompletionDate;
    
    const { data, error } = await supabase
      .from('habit_streaks')
      .update(streakData)
      .eq('habit_id', habitId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      habitId: data.habit_id,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastCompletionDate: data.last_completion_date
    };
  } catch (error) {
    console.error('Error updating habit streak:', error);
    throw error;
  }
};

export const getOrCreateHabitStreak = async (habitId: string): Promise<HabitStreak> => {
  try {
    const existingStreak = await getHabitStreak(habitId);
    
    if (existingStreak) {
      return existingStreak;
    }
    
    return createHabitStreak(habitId);
  } catch (error) {
    console.error('Error getting or creating habit streak:', error);
    throw error;
  }
}; 