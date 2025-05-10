import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionCard } from '@/app/components/ActionCard';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { Habit } from '@/app/types/db';
import { useHabitStore } from '@/libs/store/habitStore';

export default function StatsScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuthStore();
  const { habits, fetchHabits, habitLogs, fetchHabitLogs } = useHabitStore();
  const cardBackgroundColor = useThemeColor({}, 'card');
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeHabits, setActiveHabits] = useState<Habit[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<Record<string, number>>({});
  const [streakData, setStreakData] = useState<Record<string, number>>({});
  
  // Si no está autenticado, redireccionar
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(public)/login');
    }
  }, [isAuthenticated, user, router]);
  
  // Cargar hábitos y registros
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setIsLoading(true);
        
        // Cargar hábitos
        await fetchHabits(user.id);
        
        // Cargar registros de los últimos 30 días para cada hábito
        const endDate = dayjs().format('YYYY-MM-DD');
        const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        
        for (const habit of habits) {
          await fetchHabitLogs(habit.id, startDate, endDate);
        }
        
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchHabits, fetchHabitLogs]);
  
  // Filtrar hábitos activos y calcular estadísticas
  useEffect(() => {
    // Filtrar solo hábitos activos (no archivados)
    const active = habits.filter(habit => !habit.archived);
    setActiveHabits(active);
    
    // Calcular estadísticas semanales
    const weekStats: Record<string, number> = {};
    const streaks: Record<string, number> = {};
    
    // Inicializar días de la semana
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    weekDays.forEach(day => {
      weekStats[day] = 0;
    });
    
    // Calcular completados por día de semana
    active.forEach(habit => {
      const logs = habitLogs[habit.id] || [];
      streaks[habit.id] = 0;
      
      let currentStreak = 0;
      const sortedLogs = [...logs].sort((a, b) => 
        dayjs(b.logDate).valueOf() - dayjs(a.logDate).valueOf()
      );
      
      // Calcular rachas
      sortedLogs.forEach((log, index) => {
        if (log.status === 'DONE') {
          if (index === 0) {
            currentStreak = 1;
          } else {
            const prevDate = dayjs(sortedLogs[index - 1].logDate);
            const currDate = dayjs(log.logDate);
            const diffDays = prevDate.diff(currDate, 'day');
            
            if (diffDays <= 1) {
              currentStreak += 1;
            } else {
              currentStreak = 1;
            }
          }
          
          // Actualizar estadísticas semanales
          const dayOfWeek = dayjs(log.logDate).day();
          weekStats[weekDays[dayOfWeek]] = (weekStats[weekDays[dayOfWeek]] || 0) + 1;
        }
      });
      
      streaks[habit.id] = currentStreak;
    });
    
    setWeeklyStats(weekStats);
    setStreakData(streaks);
  }, [habits, habitLogs]);
  
  // Calcular el total de hábitos completados
  const getTotalCompleted = () => {
    let total = 0;
    Object.keys(habitLogs).forEach(habitId => {
      total += habitLogs[habitId].filter(log => log.status === 'DONE').length;
    });
    return total;
  };
  
  // Obtener el hábito con la racha más larga
  const getBestStreakHabit = () => {
    if (Object.keys(streakData).length === 0) return null;
    
    const bestHabitId = Object.keys(streakData).reduce((a, b) => 
      streakData[a] > streakData[b] ? a : b
    );
    
    return {
      habit: habits.find(h => h.id === bestHabitId),
      streak: streakData[bestHabitId]
    };
  };
  
  const bestStreak = getBestStreakHabit();
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.greeting}>
          Estadísticas
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Resumen de tus hábitos y logros
        </ThemedText>

        {isLoading ? (
          <ThemedText style={styles.loadingText}>
            Cargando estadísticas...
          </ThemedText>
        ) : (
          <>
            {/* Resumen general */}
            <View style={[styles.summaryContainer, { backgroundColor: cardBackgroundColor }]}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <ThemedText type="title" style={styles.summaryValue}>
                  {getTotalCompleted()}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>
                  Completados
                </ThemedText>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="trending-up" size={32} color="#2196F3" />
                <ThemedText type="title" style={styles.summaryValue}>
                  {activeHabits.length}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>
                  Hábitos Activos
                </ThemedText>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="flame" size={32} color="#FF9800" />
                <ThemedText type="title" style={styles.summaryValue}>
                  {bestStreak?.streak || 0}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>
                  Mejor Racha
                </ThemedText>
              </View>
            </View>
            
            {/* Mejor hábito */}
            {bestStreak?.habit && (
              <View style={styles.bestHabitContainer}>
                <ThemedText type="subtitle">Mejor Desempeño</ThemedText>
                <ActionCard
                  title={bestStreak.habit.title}
                  subtitle={`Racha actual: ${bestStreak.streak} días`}
                  icon="trophy"
                  onPress={() => router.push(`/(private)/habit/${bestStreak.habit?.id}`)}
                />
              </View>
            )}
            
            {/* Estadísticas semanales */}
            <View style={styles.weeklyContainer}>
              <ThemedText type="subtitle">Actividad Semanal</ThemedText>
              
              <View style={[styles.chartContainer, { backgroundColor: cardBackgroundColor }]}>
                {Object.keys(weeklyStats).map((day) => {
                  const value = weeklyStats[day];
                  const height = value === 0 ? 10 : Math.min(100, Math.max(20, value * 10));
                  
                  return (
                    <View key={day} style={styles.chartBarContainer}>
                      <View style={[
                        styles.chartBar,
                        { height, backgroundColor: value > 0 ? '#4CAF50' : '#E0E0E0' }
                      ]} />
                      <ThemedText style={styles.chartLabel}>{day}</ThemedText>
                      <ThemedText style={styles.chartValue}>{value}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Hábitos activos */}
            <View style={styles.habitsContainer}>
              <ThemedText type="subtitle">Mis Hábitos</ThemedText>
              
              {activeHabits.length > 0 ? (
                activeHabits.map(habit => (
                  <ActionCard
                    key={habit.id}
                    title={habit.title}
                    subtitle={`Racha: ${streakData[habit.id] || 0} días`}
                    icon="analytics-outline"
                    onPress={() => router.push(`/(private)/habit/${habit.id}`)}
                  />
                ))
              ) : (
                <ThemedText style={styles.emptyText}>
                  No tienes hábitos activos. ¡Crea uno nuevo!
                </ThemedText>
              )}
            </View>
          </>
        )}
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
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  bestHabitContainer: {
    marginBottom: 20,
  },
  weeklyContainer: {
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 5,
  },
  chartLabel: {
    fontSize: 12,
  },
  chartValue: {
    fontSize: 10,
    opacity: 0.7,
  },
  habitsContainer: {
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
}); 