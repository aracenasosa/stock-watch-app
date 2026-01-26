import React, { useState } from 'react';
import { View, StyleSheet, Keyboard, TouchableWithoutFeedback, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@/contexts/theme.context';
import { 
  ScreenHeader, 
  SymbolPicker, 
  InputField, 
  Button, 
  Toast 
} from '@/components';
import { DROPDOWN_SYMBOLS } from '@/shared/symbols';
import { useAlertsStore } from '@/stores/alerts.store';
import { router } from 'expo-router';

const alertSchema = z.object({
  symbol: z.string().min(1, 'Please select a symbol'),
  targetPrice: z.string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a valid positive number'),
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function AddAlertScreen() {
  const { colors } = useTheme();
  const createAlert = useAlertsStore((s) => s.createAlert);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      symbol: '',
      targetPrice: '',
    },
  });

  const onSubmit = async (data: AlertFormData) => {
    Keyboard.dismiss();
    setIsSubmitting(true);
    
    try {
      const result = await createAlert(data.symbol, Number(data.targetPrice));
      
      if (result.success) {
        setToast({
          visible: true,
          message: `Alert created for ${data.symbol} at $${data.targetPrice}`,
          type: 'success',
        });
        reset();
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to create alert',
          type: 'error',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader 
          title="Add Alert" 
          subtitle="Get notified when a stock hits your target price"
        />

        <Toast 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />

        <View style={styles.form}>
          {/* Symbol Selection */}
          <View style={styles.field}>
            <Controller
              control={control}
              name="symbol"
              render={({ field: { value } }) => (
                <SymbolPicker
                  symbols={DROPDOWN_SYMBOLS}
                  selectedSymbol={value}
                  onSelect={(symbol) => setValue('symbol', symbol, { shouldValidate: true })}
                  placeholder="Select Stock Symbol"
                />
              )}
            />
            {errors.symbol && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.symbol.message}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.spacer} />

          {/* Target Price Input */}
          <Controller
            control={control}
            name="targetPrice"
            render={({ field: { onChange, value } }) => (
              <InputField
                label="Target Price ($)"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. 150.50"
                keyboardType="decimal-pad"
                error={errors.targetPrice?.message}
              />
            )}
          />

          <View style={styles.spacer} />

          <Button
            title="Create Alert"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 8,
  },
  spacer: {
    height: 16,
  },
  errorContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
  },
});