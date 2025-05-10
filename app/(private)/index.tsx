import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionCard } from '@/app/components/ActionCard';
import { HeaderAvatar } from '@/app/components/HeaderAvatar';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { Habit } from '@/app/types/db';
import { useHabitStore } from '@/libs/store/habitStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuthStore();
  const { habits, fetchHabits, habitLogs, fetchHabitLogs } = useHabitStore();
  const cardBackgroundColor = useThemeColor({}, 'card');
  
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Si no está autenticado, redireccionar (se maneja en _layout.tsx)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(public)/login');
    }
  }, [isAuthenticated, user, router]);
  
  // Cargar hábitos al montar
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setIsLoading(true);
        await fetchHabits(user.id);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchHabits]);
  
  // Filtrar hábitos para mostrar solo los del día actual
  useEffect(() => {
    if (habits.length > 0) {
      const today = dayjs();
      const dayOfWeek = today.day(); // 0-6 (domingo a sábado)
      
      // Filtrar hábitos según su frecuencia
      const filtered = habits.filter(habit => {
        if (habit.archived) return false;
        
        // Diario
        if (habit.frequency === 'DAILY') return true;
        
        // Días específicos
        if (habit.frequency === 'SPECIFIC_DAYS' && habit.daysOfWeek) {
          return habit.daysOfWeek.includes(dayOfWeek);
        }
        
        // Semanal - verificar si es primer día de la semana
        if (habit.frequency === 'WEEKLY') {
          return dayOfWeek === 1; // Lunes como primer día
        }
        
        // Mensual - verificar si es primer día del mes
        if (habit.frequency === 'MONTHLY') {
          return today.date() === 1;
        }
        
        // Para frecuencia multiple diaria
        if (habit.frequency === 'MULTIPLE_TIMES_DAILY') {
          return true;
        }
        
        return false;
      });
      
      setTodayHabits(filtered);
      
      // Cargar registros para cada hábito
      filtered.forEach(habit => {
        if (user?.id) {
          const todayStr = today.format('YYYY-MM-DD');
          fetchHabitLogs(habit.id, todayStr, todayStr);
        }
      });
    }
  }, [habits, user, fetchHabitLogs]);
  
  const handleHabitPress = (habitId: string) => {
    router.push(`/(private)/habit/${habitId}`);
  };
  
  const handleCreateHabit = () => {
    router.push('/(private)/habit/new');
  };
  
  // Calcular el progreso del día
  const calculateDailyProgress = () => {
    if (todayHabits.length === 0) return 0;
    
    const today = dayjs().format('YYYY-MM-DD');
    let completedCount = 0;
    
    todayHabits.forEach(habit => {
      const logs = habitLogs[habit.id] || [];
      const todayLogs = logs.filter(log => log.logDate === today);
      
      if (todayLogs.some(log => log.status === 'DONE')) {
        completedCount++;
      }
    });
    
    return Math.round((completedCount / todayHabits.length) * 100);
  };
  
  const progress = calculateDailyProgress();
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con avatar y saludo */}
        <HeaderAvatar
          imageUrl={profile?.avatar_url}
          firstName={profile?.first_name || ''}
          lastName={profile?.last_name || ''}
          showName={true}
        />
        
        <ThemedText style={styles.subtitle}>
          {todayHabits.length > 0 
            ? `Tienes ${todayHabits.length} hábitos para hoy` 
            : 'No tienes hábitos programados para hoy'}
        </ThemedText>

        {/* Resumen de progreso */}
        <View style={[styles.progressContainer, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText type="subtitle">Progreso del día</ThemedText>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>{progress}% completado</ThemedText>
        </View>
        
        {/* Lista de hábitos del día */}
        <View style={styles.habitsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Hábitos de hoy
          </ThemedText>
          
          {isLoading ? (
            <ThemedText>Cargando hábitos...</ThemedText>
          ) : todayHabits.length > 0 ? (
            todayHabits.map(habit => {
              const habitLogs = useHabitStore.getState().habitLogs[habit.id] || [];
              const todayLog = habitLogs.find(
                log => log.logDate === dayjs().format('YYYY-MM-DD')
              );
              
              return (
                <ActionCard
                  key={habit.id}
                  title={habit.title}
                  subtitle={`${habit.frequency === 'DAILY' ? 'Diario' : 
                    habit.frequency === 'WEEKLY' ? 'Semanal' : 
                    habit.frequency === 'MONTHLY' ? 'Mensual' : 
                    habit.frequency === 'SPECIFIC_DAYS' ? 'Días específicos' : 
                    'Varias veces al día'}`}
                  icon={todayLog?.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'}
                  onPress={() => handleHabitPress(habit.id)}
                />
              );
            })
          ) : (
            <ThemedText style={styles.emptyText}>
              No tienes hábitos para hoy. ¡Crea uno nuevo!
            </ThemedText>
          )}
          
          <ThemedButton
            title="Crear Nuevo Hábito"
            onPress={handleCreateHabit}
            type="primary"
            style={styles.createButton}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 14,
  },
  habitsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
  createButton: {
    marginTop: 20,
  },
}); 