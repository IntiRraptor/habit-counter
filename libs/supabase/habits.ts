/**
 * Módulo para interactuar con la tabla habits de Supabase
 * Proporciona funciones CRUD para gestionar hábitos
 */
import { supabase } from '../../app/services/supabaseClient';
import { Habit } from '../../app/types/db';

export const getHabits = async (userId: string, includeArchived = false): Promise<Habit[]> => {
  try {
    let query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
      
    if (!includeArchived) {
      query = query.eq('archived', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(habit => ({
      id: habit.id,
      userId: habit.user_id,
      title: habit.title,
      frequency: habit.frequency,
      targetQuantity: habit.target_quantity,
      unit: habit.unit,
      daysOfWeek: habit.days_of_week,
      allowMultipleLogs: habit.allow_multiple_logs,
      createdAt: habit.created_at,
      archived: habit.archived
    }));
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
};

export const getHabitById = async (habitId: string): Promise<Habit | null> => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      frequency: data.frequency,
      targetQuantity: data.target_quantity,
      unit: data.unit,
      daysOfWeek: data.days_of_week,
      allowMultipleLogs: data.allow_multiple_logs,
      createdAt: data.created_at,
      archived: data.archived
    };
  } catch (error) {
    console.error('Error fetching habit:', error);
    throw error;
  }
};

export const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> => {
  try {
    const newHabit = {
      user_id: habit.userId,
      title: habit.title,
      frequency: habit.frequency,
      target_quantity: habit.targetQuantity,
      unit: habit.unit,
      days_of_week: habit.daysOfWeek,
      allow_multiple_logs: habit.allowMultipleLogs,
      archived: habit.archived
    };
    
    const { data, error } = await supabase
      .from('habits')
      .insert(newHabit)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      frequency: data.frequency,
      targetQuantity: data.target_quantity,
      unit: data.unit,
      daysOfWeek: data.days_of_week,
      allowMultipleLogs: data.allow_multiple_logs,
      createdAt: data.created_at,
      archived: data.archived
    };
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
};

export const updateHabit = async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>): Promise<Habit> => {
  try {
    const habitData: any = {};
    
    if (updates.title !== undefined) habitData.title = updates.title;
    if (updates.frequency !== undefined) habitData.frequency = updates.frequency;
    if (updates.targetQuantity !== undefined) habitData.target_quantity = updates.targetQuantity;
    if (updates.unit !== undefined) habitData.unit = updates.unit;
    if (updates.daysOfWeek !== undefined) habitData.days_of_week = updates.daysOfWeek;
    if (updates.allowMultipleLogs !== undefined) habitData.allow_multiple_logs = updates.allowMultipleLogs;
    if (updates.archived !== undefined) habitData.archived = updates.archived;
    
    const { data, error } = await supabase
      .from('habits')
      .update(habitData)
      .eq('id', habitId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      frequency: data.frequency,
      targetQuantity: data.target_quantity,
      unit: data.unit,
      daysOfWeek: data.days_of_week,
      allowMultipleLogs: data.allow_multiple_logs,
      createdAt: data.created_at,
      archived: data.archived
    };
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

export const archiveHabit = async (habitId: string, archived = true): Promise<Habit> => {
  return updateHabit(habitId, { archived });
}; 