import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';
import { matchFont, LinearGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@/contexts/theme.context';
import { ScreenHeader, SymbolPicker } from '@/components';
import { useMarketStore } from '@/stores/market.store';
import { useAlertsStore } from '@/stores/alerts.store';
import { DEFAULT_WATCHLIST_SYMBOLS } from '@/shared/symbols';
import Animated from 'react-native-reanimated';

// Chart Colors
const CHART_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#5856D6',
  '#FF2D55',
  '#5AC8FA',
];

export default function GraphScreen() {
  const { colors, isDark } = useTheme();
  // Get prevCloses and timeSeries from market store
  const { timeSeries, prevCloses, isConnected, hasReceivedInitialData } = useMarketStore();
  const { alerts } = useAlertsStore();
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  
  // Use system font since we don't have a guaranteed asset file
  const font = matchFont({ fontFamily: 'sans-serif', fontSize: 12 });

  // 1. Derive all available symbols from default + active alerts
  const allSymbols = useMemo(() => {
    const activeAlertSymbols = alerts.filter(a => !a.isTriggered).map(a => a.symbol);
    return Array.from(new Set([...DEFAULT_WATCHLIST_SYMBOLS, ...activeAlertSymbols]));
  }, [alerts]);

  // 2. Determine which symbols are currently visible on the chart
  const visibleSymbols = useMemo(() => {
    if (selectedSymbol && selectedSymbol !== 'ALL') {
      return [selectedSymbol];
    }
    return allSymbols;
  }, [selectedSymbol, allSymbols]);

  const isSingleSymbol = visibleSymbols.length === 1;

  // 3. Transform data for Victory Native XL
  // If showing "ALL", we normalize to percentage change so different price ranges can be compared.
  const chartData = useMemo(() => {
    const timestampSet = new Set<number>();
    visibleSymbols.forEach(symbol => {
      // Collect all unique timestamps across all series to align data points
      timeSeries[symbol]?.forEach(pt => timestampSet.add(new Date(pt.x).getTime()));
    });
    
    // Sort chronologically
    const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
    
      /*
        Note: This effectively overlays multiple lines with potentially very different scales (e.g. 100 vs 3000).
      */
      
      return sortedTimestamps.map(timestamp => {
        const point: any = { x: timestamp };
        
        visibleSymbols.forEach(symbol => {
           // Find data point for this symbol at this timestamp
           const found = timeSeries[symbol]?.find(pt => new Date(pt.x).getTime() === timestamp);
           
           if (found) {
              point[symbol] = found.y;
           }
        });
        return point;
      });
    }, [visibleSymbols, timeSeries]);
  
    const hasData = chartData.length > 0;
  
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader 
          title="Graph" 
          subtitle={isSingleSymbol ? visibleSymbols[0] : "Overview"}
          loading={!isConnected}
        />
  
        <View style={styles.filterContainer}>
          <SymbolPicker
            symbols={['ALL', ...allSymbols]}
            selectedSymbol={selectedSymbol === 'ALL' ? '' : selectedSymbol}
            onSelect={(s) => setSelectedSymbol(s || 'ALL')}
            placeholder="All Symbols"
          />
        </View>
  
        {/* Info Header when Active (Single Symbol) */}
        {isSingleSymbol && (
          <View style={styles.activeInfoContainer}>
            <Animated.Text style={[styles.activePrice, { color: colors.text }]}>
               {""}
            </Animated.Text>
          </View>
        )}
  
        {/* Legend (Multi-symbol) */}
        {!isSingleSymbol && (
          <View style={styles.legendContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>
              {visibleSymbols.map((symbol, index) => (
                <View key={symbol} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>{symbol}</Text>
                </View>
              ))}
              {/* Spacer to allow scrolling past last item */}
              <View style={{width: 20}} />
            </ScrollView>
          </View>
        )}
  
        <View style={styles.chartContainer}>
          {hasData ? (
            <CartesianChart
              data={chartData}
              xKey="x"
              yKeys={visibleSymbols}
              axisOptions={{
                font,
                tickCount: 5,
                formatXLabel: (x) => new Date(x).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lineColor: isDark ? '#333' : '#e0e0e0',
                labelColor: colors.textSecondary,
                formatYLabel: (y) => `$${y.toFixed(0)}`,
              }}
            >
            {({ points, chartBounds }) => (
              <>
                {visibleSymbols.map((symbol, index) => {
                  const pointsForSymbol = points[symbol];
                  if (!pointsForSymbol) return null;

                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  
                  return (
                    <React.Fragment key={symbol}>
                      {isSingleSymbol ? (
                        <>
                          <Area
                            points={pointsForSymbol}
                            y0={chartBounds.bottom}
                            animate={{ type: "timing", duration: 300 }}
                          >
                            <LinearGradient
                              start={vec(0, 0)}
                              end={vec(0, chartBounds.bottom)}
                              colors={[color, `${color}11`]}
                            />
                          </Area>
                          <Line
                            points={pointsForSymbol}
                            color={color}
                            strokeWidth={3}
                            animate={{ type: "timing", duration: 300 }}
                          />
                        </>
                      ) : (
                        <Line
                          points={pointsForSymbol}
                          color={color}
                          strokeWidth={2}
                          animate={{ type: "timing", duration: 300 }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </CartesianChart>
        ) : (
             <View style={styles.noData}>
                {isConnected && !hasReceivedInitialData ? (
                   <>
                     <ActivityIndicator size="small" color={colors.primary} />
                     <Text style={{color: colors.textMuted, marginTop: 10}}>Loading chart data...</Text>
                   </>
                ) : (
                   <Text style={{color: colors.textMuted}}>Waiting for live data...</Text>
                )}
             </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 0,
    zIndex: 10,
  },
  activeInfoContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    height: 30,
    justifyContent: 'center',
  },
  activePrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  legendContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
    height: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  noData: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
  }
});