import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/theme.context';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  loading?: boolean;
}

export function ScreenHeader({ title, subtitle, rightElement, loading }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.loader} 
            />
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  loader: {
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
