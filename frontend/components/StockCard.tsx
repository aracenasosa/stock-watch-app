import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/theme.context';

interface StockCardProps {
  symbol: string;
  price: number;
  prevPrice: number;
}

function StockCardComponent({ symbol, price, prevPrice }: StockCardProps) {
  const { colors } = useTheme();
  
  const priceChange = price - prevPrice;
  const percentChange = prevPrice > 0 ? ((priceChange / prevPrice) * 100) : 0;
  const isPositive = priceChange >= 0;
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Symbol */}
      <Text style={[styles.symbol, { color: colors.text }]}>{symbol}</Text>
      
      {/* Price */}
      <Text style={[styles.price, { color: colors.text }]}>
        ${price.toFixed(2)}
      </Text>
      
      {/* Change indicator */}
      <View style={[
        styles.changeContainer, 
        { backgroundColor: isPositive ? colors.successLight : colors.dangerLight }
      ]}>
        <Text style={[
          styles.changeText, 
          { color: isPositive ? colors.success : colors.danger }
        ]}>
          {isPositive ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
        </Text>
      </View>
      
      {/* Absolute change */}
      <Text style={[styles.absoluteChange, { color: colors.textMuted }]}>
        {isPositive ? '+' : ''}{priceChange.toFixed(2)}
      </Text>
    </View>
  );
}

export const StockCard = memo(StockCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 150,
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  changeContainer: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  absoluteChange: {
    fontSize: 12,
    marginTop: 4,
  },
});
