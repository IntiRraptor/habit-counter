import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as Yup from 'yup';

import { FormField } from '@/app/components/FormField';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useAuthStore } from '@/app/store/authStore';
import { Status } from '@/app/types/db';
import { useHabitStore } from '@/libs/store/habitStore';

// Esquema de validación
const LogSchema = Yup.object().shape({
  status: Yup.string()
    .required('Es necesario seleccionar un estado')
    .oneOf(['DONE', 'PARTIAL', 'SKIPPED', 'FAILED']),
  quantity: Yup.number()
    .nullable()
    .when('hasTarget', {
      is: true,
      then: (schema) => schema.required('La cantidad es requerida').min(0, 'La cantidad debe ser positiva')
    }),
  note: Yup.string().nullable(),
  date: Yup.string().required('La fecha es requerida')
});

// Tipos para el formulario
interface LogFormValues {
  status: Status;
  quantity: number | null;
  note: string;
  date: string;
  hasTarget: boolean;
}

export default function LogHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { 
    fetchHabitById, 
    currentHabit, 
    isLoading, 
    logHabit 
  } = useHabitStore();
  
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Opciones de estado
  const statusOptions: { value: Status; label: string; icon: string }[] = [
    { value: 'DONE', label: 'Completado', icon: 'checkmark-circle' },
    { value: 'PARTIAL', label: 'Parcial', icon: 'ellipsis-horizontal-circle' },
    { value: 'SKIPPED', label: 'Omitido', icon: 'remove-circle-outline' },
    { value: 'FAILED', label: 'Fallido', icon: 'close-circle' }
  ];
  
  // Valores iniciales del formulario
  const initialValues: LogFormValues = {
    status: 'DONE',
    quantity: currentHabit?.targetQuantity || null,
    note: '',
    date: dayjs().format('YYYY-MM-DD'),
    hasTarget: !!currentHabit?.targetQuantity
  };
  
  const handleSubmit = async (values: LogFormValues) => {
    if (!id || !user?.id) {
      setError('Faltan datos necesarios para registrar el hábito');
      return;
    }
    
    try {
      setError(null);
      await logHabit(
        id,
        user.id,
        values.date,
        values.status,
        values.hasTarget && values.quantity ? values.quantity : undefined,
        values.note || undefined
      );
      
      // Regresar a la pantalla de detalles
      router.replace(`/habit/${id}`);
    } catch (err) {
      console.error('Error logging habit:', err);
      setError('Error al registrar el hábito');
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
          Registrar "{currentHabit?.title}"
        </ThemedText>
        
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
        
        <Formik
          initialValues={initialValues}
          validationSchema={LogSchema}
          onSubmit={handleSubmit}
        >
          {(formikProps) => (
            <View style={styles.form}>
              {/* Estado del hábito */}
              <ThemedText style={styles.label}>¿Cómo te fue?</ThemedText>
              <View style={styles.optionsContainer}>
                {statusOptions.map((option) => (
                  <ThemedButton
                    key={option.value}
                    title={option.label}
                    onPress={() => formikProps.setFieldValue('status', option.value)}
                    type={formikProps.values.status === option.value ? 'primary' : 'outline'}
                    style={styles.optionButton}
                  />
                ))}
              </View>
              
              {/* Cantidad (si el hábito tiene objetivo) */}
              {currentHabit?.targetQuantity && (
                <FormField
                  label={`Cantidad (${currentHabit.unit || 'unidades'})`}
                  formikKey="quantity"
                  formikProps={formikProps}
                  placeholder={`Ej: ${currentHabit.targetQuantity}`}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="trending-up-outline" size={20} color="#999" />}
                />
              )}
              
              {/* Nota opcional */}
              <ThemedText style={styles.label}>Nota (opcional)</ThemedText>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Escribe una nota sobre tu progreso..."
                  value={formikProps.values.note}
                  onChangeText={formikProps.handleChange('note')}
                  onBlur={formikProps.handleBlur('note')}
                />
              </View>
              
              {/* Botones de acción */}
              <View style={styles.actionsContainer}>
                <ThemedButton
                  title="Cancelar"
                  onPress={() => router.back()}
                  type="outline"
                  style={styles.actionButton}
                />
                <ThemedButton
                  title="Guardar Registro"
                  onPress={() => formikProps.handleSubmit()}
                  type="primary"
                  loading={isLoading}
                  style={styles.actionButton}
                />
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
  textAreaContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
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
    marginBottom: 10,
  },
}); 