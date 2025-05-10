/**
 * Módulo para interactuar con la tabla user_settings de Supabase
 * Proporciona funciones para gestionar la configuración de usuario
 */
import { UserSettings } from '../../app/types/db';
import supabase from './client';

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      userId: data.user_id,
      timezone: data.timezone,
      dailyReminderTime: data.daily_reminder_time,
      notificationEnabled: data.notification_enabled,
      theme: data.theme
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

export const createUserSettings = async (settings: Omit<UserSettings, 'userId'> & { userId: string }): Promise<UserSettings> => {
  try {
    const settingsData = {
      user_id: settings.userId,
      timezone: settings.timezone,
      daily_reminder_time: settings.dailyReminderTime,
      notification_enabled: settings.notificationEnabled,
      theme: settings.theme
    };
    
    const { data, error } = await supabase
      .from('user_settings')
      .insert(settingsData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      userId: data.user_id,
      timezone: data.timezone,
      dailyReminderTime: data.daily_reminder_time,
      notificationEnabled: data.notification_enabled,
      theme: data.theme
    };
  } catch (error) {
    console.error('Error creating user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  userId: string, 
  updates: Partial<Omit<UserSettings, 'userId'>>
): Promise<UserSettings> => {
  try {
    const settingsData: any = {};
    
    if (updates.timezone !== undefined) settingsData.timezone = updates.timezone;
    if (updates.dailyReminderTime !== undefined) settingsData.daily_reminder_time = updates.dailyReminderTime;
    if (updates.notificationEnabled !== undefined) settingsData.notification_enabled = updates.notificationEnabled;
    if (updates.theme !== undefined) settingsData.theme = updates.theme;
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(settingsData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      userId: data.user_id,
      timezone: data.timezone,
      dailyReminderTime: data.daily_reminder_time,
      notificationEnabled: data.notification_enabled,
      theme: data.theme
    };
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const getOrCreateUserSettings = async (userId: string, defaultTimezone = 'UTC'): Promise<UserSettings> => {
  try {
    const existingSettings = await getUserSettings(userId);
    
    if (existingSettings) {
      return existingSettings;
    }
    
    // Crear configuración por defecto
    return createUserSettings({
      userId,
      timezone: defaultTimezone,
      notificationEnabled: false,
      theme: 'light'
    });
  } catch (error) {
    console.error('Error getting or creating user settings:', error);
    throw error;
  }
}; 