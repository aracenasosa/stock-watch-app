import { create } from "zustand";
import { api } from "@/shared/api";
import type { Alert } from "@/shared/types";

interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  createAlert: (
    symbol: string,
    targetPrice: number,
  ) => Promise<{ success: boolean; message?: string }>;
  deleteAlert: (alertId: string) => Promise<void>;
  clearAlerts: () => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  loading: false,
  error: null,

  fetchAlerts: async () => {
    // Check if we have a valid session before fetching
    const { tokens } = require("@/stores/auth.store").useAuthStore.getState();
    if (!tokens?.accessToken) {
      console.error("[AlertsStore] No access token, skipping fetchAlerts");
      set({ loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data } = await api.get<Alert[]>("/alerts");
      set({ alerts: data, loading: false });
    } catch (error: any) {
      console.error("[AlertsStore] fetchAlerts error:", error);
      // Suppress 401s as they often happen during logout race conditions
      if (error.response?.status !== 401) {
        set({
          error: error.message || "Failed to fetch alerts",
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    }
  },

  createAlert: async (symbol: string, targetPrice: number) => {
    try {
      const { data } = await api.post<Alert>("/alerts", {
        symbol,
        targetPrice,
      });
      set((state) => ({ alerts: [data, ...state.alerts] }));
      return { success: true };
    } catch (error: any) {
      console.error("[AlertsStore] createAlert error:", error);
      const message = error.response?.data?.message || "Failed to create alert";
      return { success: false, message };
    }
  },

  deleteAlert: async (alertId: string) => {
    try {
      await api.delete(`/alerts/${alertId}`);
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== alertId),
      }));
    } catch (error: any) {
      console.error("[AlertsStore] deleteAlert error:", error);
    }
  },

  clearAlerts: () => {
    set({ alerts: [], loading: false, error: null });
  },
}));
