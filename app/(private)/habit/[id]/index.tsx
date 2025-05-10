import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionCard } from '@/app/components/ActionCard';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Habit, HabitLog, Status } from '@/app/types/db';
import { useHabitStore } from '@/libs/store/habitStore';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchHabitById, currentHabit, isLoading, fetchHabitLogs, habitLogs } = useHabitStore();
  
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar el hábito y sus registros
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          await fetchHabitById(id);
          
          // Cargar los registros de los últimos 30 días
          const endDate = dayjs().format('YYYY-MM-DD');
          const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
          await fetchHabitLogs(id, startDate, endDate);
        } catch (err) {
          console.error('Error loading habit:', err);
          setError('Error al cargar los datos del hábito');
        }
      }
    };
    
    loadData();
  }, [id, fetchHabitById, fetchHabitLogs]);
  
  // Actualizar logs cuando cambian en el store
  useEffect(() => {
    if (id && habitLogs[id]) {
      setLogs(habitLogs[id]);
    }
  }, [id, habitLogs]);
  
  // Si no hay un hábito cargado, mostrar un mensaje
  if (!currentHabit && !isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            No se pudo encontrar el hábito solicitado.
          </ThemedText>
          <ThemedButton 
            title="Volver" 
            onPress={() => router.back()} 
            type="primary"
            style={styles.button}
          />
        </View>
      </ThemedView>
    );
  }
  
  const handleLogHabit = () => {
    if (id) {
      router.push(`/habit/${id}/log`);
    }
  };
  
  const handleEditHabit = () => {
    if (id) {
      router.push(`/habit/${id}/edit`);
    }
  };
  
  // Obtener texto de frecuencia en español
  const getFrequencyText = (habit: Habit) => {
    switch (habit.frequency) {
      case 'DAILY':
        return 'Diario';
      case 'WEEKLY':
        return 'Semanal';
      case 'MONTHLY':
        return 'Mensual';
      case 'SPECIFIC_DAYS':
        if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) return 'Días específicos';
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const days = habit.daysOfWeek.map(day => dayNames[day]).join(', ');
        return `${days}`;
        
      case 'MULTIPLE_TIMES_DAILY':
        return 'Varias veces al día';
      default:
        return 'Desconocido';
    }
  };
  
  // Obtener icono según el estado
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'DONE':
        return 'checkmark-circle';
      case 'PARTIAL':
        return 'ellipsis-horizontal-circle';
      case 'SKIPPED':
        return 'remove-circle-outline';
      case 'FAILED':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };
  
  // Obtener texto según el estado
  const getStatusText = (status: Status) => {
    switch (status) {
      case 'DONE':
        return 'Completado';
      case 'PARTIAL':
        return 'Parcial';
      case 'SKIPPED':
        return 'Omitido';
      case 'FAILED':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };
  
  // Si aún está cargando, mostrar mensaje
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Cargando datos del hábito...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mensaje de error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
        
        {/* Encabezado con título e información */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {currentHabit?.title}
          </ThemedText>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#999" />
              <ThemedText style={styles.infoText}>
                {currentHabit ? getFrequencyText(currentHabit) : ''}
              </ThemedText>
            </View>
            
            {currentHabit?.targetQuantity && (
              <View style={styles.infoItem}>
                <Ionicons name="trending-up-outline" size={20} color="#999" />
                <ThemedText style={styles.infoText}>
                  Meta: {currentHabit.targetQuantity} {currentHabit.unit}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        
        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <ThemedButton
            title="Registrar Hábito"
            onPress={handleLogHabit}
            type="primary"
            style={styles.actionButton}
          />
          <ThemedButton
            title="Editar"
            onPress={handleEditHabit}
            type="outline"
            style={styles.actionButton}
          />
        </View>
        
        {/* Información de racha */}
        <View style={styles.streakContainer}>
          <ThemedText type="subtitle">Racha actual</ThemedText>
          <View style={styles.streakInfo}>
            <Ionicons name="flame" size={36} color="#FF9500" />
            <ThemedText type="title" style={styles.streakText}>
              {/* 
                Aquí se mostraría la racha del hábito, pero como no tenemos 
                acceso directo a los datos de racha desde el store, 
                mostramos un contador básico basado en registros recientes
              */}
              {logs.filter(log => log.status === 'DONE').length} días
            </ThemedText>
          </View>
        </View>
        
        {/* Listado de registros recientes */}
        <View style={styles.logsContainer}>
          <ThemedText type="subtitle">Registros recientes</ThemedText>
          
          {logs.length > 0 ? (
            logs.slice(0, 10).map(log => (
              <ActionCard
                key={log.id}
                title={dayjs(log.logDate).format('DD/MM/YYYY')}
                subtitle={
                  `${getStatusText(log.status)}${log.quantity ? ` - ${log.quantity} ${currentHabit?.unit || ''}` : ''}${log.note ? ` - ${log.note}` : ''}`
                }
                icon={getStatusIcon(log.status)}
              />
            ))
          ) : (
            <ThemedText style={styles.emptyText}>
              No hay registros para este hábito. Comienza a registrar tu progreso.
            </ThemedText>
          )}
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
    paddingBottom: 40,
  },
  errorContainer: {
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 10,
  },
  infoContainer: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  streakContainer: {
    padding: 15,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  streakText: {
    marginLeft: 10,
    fontSize: 24,
  },
  logsContainer: {
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    opacity: 0.7,
  },
  button: {
    minWidth: 120,
  },
}); 