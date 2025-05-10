/**
 * Utilidades para operaciones relacionadas con hábitos, rachas y frecuencias
 */
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import { Frequency, HabitLog } from '../../app/types/db';

// Configurar plugins de dayjs
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

/**
 * Calcula la racha actual en base a los registros de un hábito
 */
export const calculateStreak = (logs: HabitLog[], frequency: Frequency): { current: number; longest: number } => {
  if (!logs.length) return { current: 0, longest: 0 };

  // Ordenar logs por fecha, el más reciente primero
  const sortedLogs = [...logs].sort((a, b) => 
    dayjs(b.logDate).valueOf() - dayjs(a.logDate).valueOf()
  );

  // Filtrar sólo los completados (DONE)
  const completedLogs = sortedLogs.filter(log => log.status === 'DONE');
  if (!completedLogs.length) return { current: 0, longest: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let lastDate = dayjs(completedLogs[0].logDate);
  let isInStreak = true;

  // Función para verificar si una fecha está dentro del período de streak según la frecuencia
  const isWithinStreakPeriod = (date1: dayjs.Dayjs, date2: dayjs.Dayjs, freq: Frequency): boolean => {
    switch (freq) {
      case 'DAILY':
        return date1.diff(date2, 'day') <= 1;
      case 'WEEKLY':
        return date1.week() === date2.week() || 
               (date1.diff(date2, 'week') === 1 && date1.day() < date2.day());
      case 'MONTHLY':
        return date1.month() === date2.month() || 
               (date1.diff(date2, 'month') === 1 && date1.date() < date2.date());
      // Para otros tipos, usamos lógica diaria
      default:
        return date1.diff(date2, 'day') <= 1;
    }
  };

  // Procesar todos los logs completados
  for (const log of completedLogs) {
    const logDate = dayjs(log.logDate);
    
    // Si es el primer log o está dentro del período de streak según la frecuencia
    if (isInStreak && isWithinStreakPeriod(lastDate, logDate, frequency)) {
      currentStreak++;
    } else {
      // Rompe la racha, reinicia
      isInStreak = false;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      currentStreak = 1;
      isInStreak = true;
    }
    
    lastDate = logDate;
  }

  // Verificar si la racha actual es la más larga
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { current: currentStreak, longest: longestStreak };
};

/**
 * Convierte un arreglo de días de la semana (0-6) a nombres
 */
export const daysOfWeekToNames = (days: number[]): string[] => {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days.map(day => dayNames[day]).sort((a, b) => {
    const aIndex = dayNames.indexOf(a);
    const bIndex = dayNames.indexOf(b);
    return aIndex - bIndex;
  });
};

/**
 * Determina si un hábito debe ser registrado hoy según su frecuencia
 */
export const shouldLogHabitToday = (frequency: Frequency, daysOfWeek?: number[]): boolean => {
  const today = dayjs();
  
  switch (frequency) {
    case 'DAILY':
      return true;
    
    case 'WEEKLY':
      // Lunes es el primer día de la semana
      return today.day() === 1;
    
    case 'MONTHLY':
      // Primer día del mes
      return today.date() === 1;
    
    case 'SPECIFIC_DAYS':
      if (!daysOfWeek || !daysOfWeek.length) return false;
      // Si el día actual está en la lista de días especificados
      // Ajuste: dayjs.day() devuelve 0 para Domingo, mientras que
      // nuestra convención podría ser distinta
      return daysOfWeek.includes(today.day());
    
    case 'MULTIPLE_TIMES_DAILY':
      return true;
    
    default:
      return false;
  }
};

/**
 * Formatea la frecuencia para mostrarla en la UI
 */
export const formatFrequency = (frequency: Frequency, daysOfWeek?: number[]): string => {
  switch (frequency) {
    case 'DAILY':
      return 'Diario';
    case 'WEEKLY':
      return 'Semanal';
    case 'MONTHLY':
      return 'Mensual';
    case 'SPECIFIC_DAYS':
      if (!daysOfWeek || !daysOfWeek.length) return 'Días específicos';
      return `${daysOfWeekToNames(daysOfWeek).join(', ')}`;
    case 'MULTIPLE_TIMES_DAILY':
      return 'Varias veces al día';
    default:
      return 'Personalizado';
  }
};

/**
 * Genera un reporte de avance basado en logs y período
 */
export const generateProgressReport = (
  logs: HabitLog[], 
  startDate: string, 
  endDate: string, 
  frequency: Frequency
): { 
  completed: number; 
  total: number; 
  percentage: number; 
  streak: { current: number; longest: number } 
} => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  // Total esperado según la frecuencia
  let totalExpected = 0;
  
  switch (frequency) {
    case 'DAILY':
      totalExpected = end.diff(start, 'day') + 1;
      break;
    case 'WEEKLY':
      totalExpected = Math.ceil(end.diff(start, 'week', true));
      break;
    case 'MONTHLY':
      totalExpected = Math.ceil(end.diff(start, 'month', true));
      break;
    case 'SPECIFIC_DAYS':
    case 'MULTIPLE_TIMES_DAILY':
      // Para estos casos, el total esperado es más complejo y requiere 
      // conocer los días específicos o la cantidad de veces al día
      totalExpected = end.diff(start, 'day') + 1;
      break;
  }
  
  // Contar completados
  const completed = logs.filter(log => 
    log.status === 'DONE' && 
    dayjs(log.logDate).isSameOrAfter(start, 'day') && 
    dayjs(log.logDate).isSameOrBefore(end, 'day')
  ).length;
  
  // Calcular porcentaje
  const percentage = totalExpected > 0 ? Math.round((completed / totalExpected) * 100) : 0;
  
  // Calcular racha
  const streak = calculateStreak(logs, frequency);
  
  return {
    completed,
    total: totalExpected,
    percentage,
    streak
  };
}; 