import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { AUTH0_AUDIENCE, API_URL } from "@/shared/constants";
import { auth0 } from "@/shared/auth0";
import { api } from "@/shared/api";
import type { User } from "@/shared/types";

const TOKEN_KEY = "auth_tokens_v1";

type Tokens = {
  accessToken: string;
  idToken?: string;
};

type AuthState = {
  isHydrated: boolean;
  tokens: Tokens | null;
  user: User | null;

  hydrate: () => Promise<void>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  tokens: null,
  user: null,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(TOKEN_KEY);

      if (raw) {
        const tokens = JSON.parse(raw) as Tokens;
        set({ tokens });
        // Fetch user data to validate token and get/create user
        await get().fetchMe();
      }
    } catch (error) {
      console.error("[Auth] Hydration error:", error);
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async () => {
    try {
      const res = await auth0.webAuth.authorize({
        scope: "openid profile email",
        audience: AUTH0_AUDIENCE,
      });

      const tokens: Tokens = {
        accessToken: res.accessToken,
        idToken: res.idToken,
      };

      // Save tokens first
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
      set({ tokens });

      // IMPORTANT: Call /users/me to create or update user in the database
      // This ensures the user exists in Prisma with their Auth0 profile data
      await get().fetchMe();

      console.log("[Auth] Login successful, user created/updated");
      return true;
    } catch (error: any) {
      // Silently ignore user cancellation
      if (error?.code === "a0.session.user_cancelled") {
        console.log("[Auth] User cancelled login");
        return false;
      }
      // Re-throw other errors for debugging
      console.error("[Auth] Login error:", error);
      throw error;
    }
  },

  fetchMe: async () => {
    const tokens = get().tokens;
    if (!tokens?.accessToken) {
      console.log("[Auth] No access token, skipping fetchMe");
      return;
    }

    try {
      // Use the shared api client which has the Bearer token interceptor
      const { data } = await api.get<User>("/users/me");
      set({ user: data });
      console.log("[Auth] User fetched/created:", data.email);
    } catch (error: any) {
      console.error(
        "[Auth] fetchMe failed:",
        error.response?.data || error.message,
      );

      // If 401, token might be expired - clear auth state
      if (error.response?.status === 401) {
        console.log("[Auth] Token expired, clearing session");
        await get().logout();
      }
    }
  },

  logout: async () => {
    try {
      await auth0.webAuth.clearSession();
    } catch (error) {
      console.log("[Auth] clearSession error (may be expected):", error);
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ tokens: null, user: null });
    console.log("[Auth] Logged out");
  },
}));
