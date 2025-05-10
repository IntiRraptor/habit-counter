/**
 * Módulo para interactuar con la tabla habit_logs de Supabase
 * Proporciona funciones para registrar y consultar los registros de hábitos
 */
import { supabase } from '../../app/services/supabaseClient';
import { HabitLog, Status } from '../../app/types/db';

export const getHabitLogs = async (habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> => {
  try {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId);
    
    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('log_date', endDate);
    }
    
    const { data, error } = await query.order('log_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(log => ({
      id: log.id,
      habitId: log.habit_id,
      userId: log.user_id,
      logDate: log.log_date,
      status: log.status,
      quantity: log.quantity,
      note: log.note,
      insertedAt: log.inserted_at
    }));
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    throw error;
  }
};

export const getLogByDate = async (habitId: string, logDate: string): Promise<HabitLog | null> => {
  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('log_date', logDate)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      habitId: data.habit_id,
      userId: data.user_id,
      logDate: data.log_date,
      status: data.status,
      quantity: data.quantity,
      note: data.note,
      insertedAt: data.inserted_at
    };
  } catch (error) {
    console.error('Error fetching habit log by date:', error);
    throw error;
  }
};

export const logHabit = async (
  habitId: string, 
  userId: string, 
  logDate: string, 
  status: Status, 
  quantity?: number, 
  note?: string
): Promise<HabitLog> => {
  try {
    // Verificar si ya existe un registro para esta fecha
    const existingLog = await getLogByDate(habitId, logDate);
    
    const logData = {
      habit_id: habitId,
      user_id: userId,
      log_date: logDate,
      status,
      quantity,
      note
    };
    
    let result;
    
    if (existingLog) {
      // Actualizar el registro existente
      const { data, error } = await supabase
        .from('habit_logs')
        .update(logData)
        .eq('id', existingLog.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Crear un nuevo registro
      const { data, error } = await supabase
        .from('habit_logs')
        .insert(logData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return {
      id: result.id,
      habitId: result.habit_id,
      userId: result.user_id,
      logDate: result.log_date,
      status: result.status,
      quantity: result.quantity,
      note: result.note,
      insertedAt: result.inserted_at
    };
  } catch (error) {
    console.error('Error logging habit:', error);
    throw error;
  }
};

export const deleteHabitLog = async (logId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', logId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting habit log:', error);
    throw error;
  }
};

export const getUserHabitLogs = async (userId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> => {
  try {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('log_date', endDate);
    }
    
    const { data, error } = await query.order('log_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(log => ({
      id: log.id,
      habitId: log.habit_id,
      userId: log.user_id,
      logDate: log.log_date,
      status: log.status,
      quantity: log.quantity,
      note: log.note,
      insertedAt: log.inserted_at
    }));
  } catch (error) {
    console.error('Error fetching user habit logs:', error);
    throw error;
  }
}; 