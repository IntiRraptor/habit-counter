import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import * as Yup from 'yup';

import { FormField } from '@/app/components/FormField';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useAuthStore } from '@/app/store/authStore';
import { Frequency } from '@/app/types/db';
import { useHabitStore } from '@/libs/store/habitStore';

// Esquema de validación
const HabitSchema = Yup.object().shape({
  title: Yup.string()
    .required('El título es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(50, 'El título debe tener máximo 50 caracteres'),
  frequency: Yup.string()
    .required('La frecuencia es obligatoria')
    .oneOf(['DAILY', 'WEEKLY', 'MONTHLY', 'SPECIFIC_DAYS', 'MULTIPLE_TIMES_DAILY']),
  targetQuantity: Yup.number()
    .nullable()
    .when('hasTarget', {
      is: true,
      then: (schema) => schema.required('La cantidad objetivo es obligatoria').min(1, 'El valor debe ser mayor a 0')
    }),
  unit: Yup.string()
    .nullable()
    .when('hasTarget', {
      is: true,
      then: (schema) => schema.required('La unidad es obligatoria')
    }),
  daysOfWeek: Yup.array().of(Yup.number())
    .when('frequency', {
      is: 'SPECIFIC_DAYS',
      then: (schema) => schema.min(1, 'Selecciona al menos un día').required('Selecciona al menos un día')
    }),
});

// Tipo para los valores del formulario
interface HabitFormValues {
  title: string;
  frequency: Frequency;
  hasTarget: boolean;
  targetQuantity: number | null;
  unit: string;
  daysOfWeek: number[];
  allowMultipleLogs: boolean;
}

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { 
    fetchHabitById, 
    currentHabit, 
    isLoading, 
    updateHabit,
    deleteHabit
  } = useHabitStore();
  
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Cargar el hábito
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          await fetchHabitById(id);
        } catch (err) {
          console.error('Error loading habit:', err);
          setError('Error al cargar los datos del hábito');
        }
      }
    };
    
    loadData();
  }, [id, fetchHabitById]);
  
  // Nombres de frecuencias en español
  const frequencyOptions = [
    { value: 'DAILY', label: 'Diario' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'SPECIFIC_DAYS', label: 'Días específicos' },
    { value: 'MULTIPLE_TIMES_DAILY', label: 'Varias veces al día' }
  ];
  
  // Nombres de días de la semana
  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];
  
  // Preparar valores iniciales del formulario basados en el hábito actual
  const getInitialValues = (): HabitFormValues => {
    if (!currentHabit) {
      return {
        title: '',
        frequency: 'DAILY',
        hasTarget: false,
        targetQuantity: null,
        unit: '',
        daysOfWeek: [],
        allowMultipleLogs: false
      };
    }
    
    return {
      title: currentHabit.title,
      frequency: currentHabit.frequency,
      hasTarget: !!currentHabit.targetQuantity,
      targetQuantity: currentHabit.targetQuantity || null,
      unit: currentHabit.unit || '',
      daysOfWeek: currentHabit.daysOfWeek || [],
      allowMultipleLogs: currentHabit.allowMultipleLogs
    };
  };
  
  const handleSubmit = async (values: HabitFormValues) => {
    if (!id) {
      setError('ID de hábito no encontrado');
      return;
    }
    
    setError(null);
    
    try {
      const habitData = {
        title: values.title,
        frequency: values.frequency,
        targetQuantity: values.hasTarget && values.targetQuantity ? values.targetQuantity : undefined,
        unit: values.hasTarget ? values.unit : undefined,
        daysOfWeek: values.frequency === 'SPECIFIC_DAYS' ? values.daysOfWeek : undefined,
        allowMultipleLogs: values.allowMultipleLogs
      };
      
      await updateHabit(id, habitData);
      
      // Navegar a la pantalla del hábito
      router.replace(`/(private)/habit/${id}`);
    } catch (err) {
      setError('Error al actualizar el hábito. Inténtalo de nuevo.');
      console.error('Error updating habit:', err);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await deleteHabit(id);
      router.replace('/(private)/index');
    } catch (err) {
      setError('Error al eliminar el hábito');
      console.error('Error deleting habit:', err);
    }
  };
  
  // Si aún está cargando, mostrar mensaje
  if (isLoading && !currentHabit) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Cargando datos del hábito...</ThemedText>
      </ThemedView>
    );
  }
  
  // Si no hay un hábito cargado, mostrar mensaje de error
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
          />
        </View>
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
        <ThemedText type="title" style={styles.title}>
          Editar Hábito
        </ThemedText>
        
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
        
        <Formik
          initialValues={getInitialValues()}
          validationSchema={HabitSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formikProps) => (
            <View style={styles.form}>
              {/* Título del hábito */}
              <FormField
                label="Título"
                formikKey="title"
                formikProps={formikProps}
                placeholder="Ej: Hacer ejercicio, Leer, Meditar..."
                leftIcon={<Ionicons name="bookmark-outline" size={20} color="#999" />}
                autoCapitalize="sentences"
              />
              
              {/* Frecuencia */}
              <ThemedText style={styles.label}>Frecuencia</ThemedText>
              <View style={styles.optionsContainer}>
                {frequencyOptions.map((option) => (
                  <ThemedButton
                    key={option.value}
                    title={option.label}
                    onPress={() => formikProps.setFieldValue('frequency', option.value)}
                    type={formikProps.values.frequency === option.value ? 'primary' : 'outline'}
                    size="small"
                    style={styles.optionButton}
                  />
                ))}
              </View>
              {formikProps.errors.frequency && formikProps.touched.frequency && (
                <ThemedText style={styles.errorText}>{formikProps.errors.frequency as string}</ThemedText>
              )}
              
              {/* Días de la semana (si la frecuencia es SPECIFIC_DAYS) */}
              {formikProps.values.frequency === 'SPECIFIC_DAYS' && (
                <>
                  <ThemedText style={styles.label}>Días de la semana</ThemedText>
                  <View style={styles.daysContainer}>
                    {daysOfWeek.map((day) => {
                      const isSelected = formikProps.values.daysOfWeek.includes(day.value);
                      return (
                        <ThemedButton
                          key={day.value}
                          title={day.label.substring(0, 3)}
                          size="small"
                          type={isSelected ? 'primary' : 'outline'}
                          style={styles.dayButton}
                          onPress={() => {
                            const currentDays = [...formikProps.values.daysOfWeek];
                            if (isSelected) {
                              formikProps.setFieldValue(
                                'daysOfWeek',
                                currentDays.filter(d => d !== day.value)
                              );
                            } else {
                              formikProps.setFieldValue(
                                'daysOfWeek',
                                [...currentDays, day.value]
                              );
                            }
                          }}
                        />
                      );
                    })}
                  </View>
                  {formikProps.errors.daysOfWeek && formikProps.touched.daysOfWeek && (
                    <ThemedText style={styles.errorText}>{formikProps.errors.daysOfWeek as string}</ThemedText>
                  )}
                </>
              )}
              
              {/* Cantidad objetivo (opcional) */}
              <View style={styles.switchContainer}>
                <ThemedText>¿Tiene cantidad objetivo?</ThemedText>
                <Switch
                  value={formikProps.values.hasTarget}
                  onValueChange={(value) => {
                    void formikProps.setFieldValue('hasTarget', value);
                    if (!value) {
                      void formikProps.setFieldValue('targetQuantity', null);
                      void formikProps.setFieldValue('unit', '');
                    }
                  }}
                />
              </View>
              
              {formikProps.values.hasTarget && (
                <>
                  <FormField
                    label="Cantidad objetivo"
                    formikKey="targetQuantity"
                    formikProps={formikProps}
                    placeholder="Ej: 30, 10000, 2..."
                    keyboardType="numeric"
                    leftIcon={<Ionicons name="trending-up-outline" size={20} color="#999" />}
                  />
                  
                  <FormField
                    label="Unidad"
                    formikKey="unit"
                    formikProps={formikProps}
                    placeholder="Ej: minutos, pasos, vasos..."
                    leftIcon={<Ionicons name="options-outline" size={20} color="#999" />}
                    autoCapitalize="sentences"
                  />
                </>
              )}
              
              {/* Permitir múltiples registros */}
              <View style={styles.switchContainer}>
                <ThemedText>Permitir múltiples registros diarios</ThemedText>
                <Switch
                  value={formikProps.values.allowMultipleLogs}
                  onValueChange={(value) => {
                    void formikProps.setFieldValue('allowMultipleLogs', value);
                  }}
                />
              </View>
              
              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                <ThemedButton
                  title="Cancelar"
                  onPress={() => router.back()}
                  type="outline"
                  style={styles.button}
                />
                <ThemedButton
                  title="Guardar Cambios"
                  onPress={() => formikProps.handleSubmit()}
                  loading={isLoading}
                  disabled={isLoading}
                  type="primary"
                  style={styles.button}
                />
              </View>
              
              {/* Sección para eliminar */}
              <View style={styles.deleteSection}>
                {!showDeleteConfirm ? (
                  <ThemedButton
                    title="Eliminar Hábito"
                    onPress={() => setShowDeleteConfirm(true)}
                    type="outline"
                    style={[styles.deleteButton, { borderColor: 'red' }]}
                  />
                ) : (
                  <View style={styles.deleteConfirmContainer}>
                    <ThemedText style={styles.deleteConfirmText}>
                      ¿Estás seguro que deseas eliminar este hábito? Esta acción no se puede deshacer.
                    </ThemedText>
                    <View style={styles.deleteConfirmButtons}>
                      <ThemedButton
                        title="Cancelar"
                        onPress={() => setShowDeleteConfirm(false)}
                        type="outline"
                        style={styles.deleteConfirmButton}
                      />
                      <ThemedButton
                        title="Eliminar"
                        onPress={handleDeleteConfirm}
                        style={[styles.deleteConfirmButton, { backgroundColor: 'red' }]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </Formik>
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
  title: {
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayButton: {
    marginRight: 4,
    marginBottom: 8,
    minWidth: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  deleteSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  deleteButton: {
    marginTop: 10,
  },
  deleteConfirmContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    borderRadius: 8,
  },
  deleteConfirmText: {
    marginBottom: 15,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteConfirmButton: {
    flex: 1,
    marginHorizontal: 5,
  },
}); 