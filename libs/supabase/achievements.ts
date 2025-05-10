/**
 * Módulo para interactuar con la tabla achievements de Supabase
 * Proporciona funciones para gestionar los logros del usuario
 */
import { Achievement } from '../../app/types/db';
import supabase from './client';

export const getAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(achievement => ({
      id: achievement.id,
      userId: achievement.user_id,
      title: achievement.title,
      description: achievement.description,
      achievedAt: achievement.achieved_at
    }));
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

export const createAchievement = async (
  userId: string,
  title: string,
  description?: string
): Promise<Achievement> => {
  try {
    const achievementData = {
      user_id: userId,
      title,
      description,
      achieved_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievementData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      achievedAt: data.achieved_at
    };
  } catch (error) {
    console.error('Error creating achievement:', error);
    throw error;
  }
};

export const deleteAchievement = async (achievementId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    throw error;
  }
}; 