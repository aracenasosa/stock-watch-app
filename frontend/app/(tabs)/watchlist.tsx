import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/theme.context';
import { ScreenHeader, StockCard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useAlertsStore } from '@/stores/alerts.store';
import { useMarketStore } from '@/stores/market.store';
import { DEFAULT_WATCHLIST_SYMBOLS } from '@/shared/symbols';

export default function WatchlistScreen() {
  const { colors } = useTheme();
  const { tokens } = useAuthStore();
  const { alerts, fetchAlerts, loading: alertsLoading } = useAlertsStore();
  const { 
    subscribeMany, 
    prices, 
    prevCloses,
    isConnected,
    hasReceivedInitialData
  } = useMarketStore();

  // 1. Initial setup: Fetch alerts and connect to WS
  useEffect(() => {
    if (tokens?.accessToken) {
      fetchAlerts();
    }
  }, [tokens?.accessToken]);

  // 2. Derive watchlist symbols from defaults + active alerts
  const watchSymbols = React.useMemo(() => {
    const activeAlertSymbols = alerts.filter(a => !a.isTriggered).map(a => a.symbol);
    // Combine and deduplicate
    return Array.from(new Set([...DEFAULT_WATCHLIST_SYMBOLS, ...activeAlertSymbols]));
  }, [alerts]);

  // 3. Subscribe to symbols when list changes or connection opens
  useEffect(() => {
    if (isConnected && watchSymbols.length > 0) {
      subscribeMany(watchSymbols);
    }
  }, [isConnected, watchSymbols]);

  const renderItem = ({ item: symbol }: { item: string }) => {
    return (
      <View style={styles.cardContainer}>
        <StockCard 
          symbol={symbol}
          price={prices[symbol] || 0}
          // Pass the previous CLOSE price for daily change calculation
          // If no previous close is known (e.g. fresh start), fallback to current price (0 change)
          prevPrice={prevCloses[symbol] || prices[symbol] || 0}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title="Watchlist" 
        subtitle="Real-time market data"
        loading={!isConnected || alertsLoading}
        rightElement={
           !isConnected ? (
             <View style={styles.statusBadge}>
                <Text style={{color: colors.danger, fontSize: 10, fontWeight: '700'}}>OFFLINE</Text>
             </View>
           ) : null
        }
      />

      {isConnected && !hasReceivedInitialData ? (
         <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
               Fetching market data...
            </Text>
         </View>
      ) : (
        <FlatList
            data={watchSymbols}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
            <RefreshControl 
                refreshing={alertsLoading} 
                onRefresh={fetchAlerts}
                tintColor={colors.text} 
            />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        No symbols to watch
                    </Text>
                </View>
            }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 0.5,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  }
});