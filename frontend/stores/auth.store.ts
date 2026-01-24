import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { AUTH0_AUDIENCE } from "@/shared/constants";
import { auth0 } from "@/app/(auth)/auth0";

const TOKEN_KEY = "auth_tokens_v1";

type Tokens = {
  accessToken: string;
  idToken?: string;
};

type UserProfile = {
  id?: number;
  name?: string | null;
  email?: string | null;
};

type AuthState = {
  isHydrated: boolean;
  tokens: Tokens | null;
  user: UserProfile | null;

  hydrate: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  tokens: null,
  user: null,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    if (raw) {
      set({ tokens: JSON.parse(raw) });
    }
    set({ isHydrated: true });
  },

  login: async () => {
    const res = await auth0.webAuth.authorize({
      scope: "openid profile email",
      audience: AUTH0_AUDIENCE,
    });

    const tokens: Tokens = {
      accessToken: res.accessToken,
      idToken: res.idToken,
    };

    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
    set({ tokens });

    // Call backend /users/me to ensure user is upserted with name/email
    await get().fetchMe();
  },

  fetchMe: async () => {
    const tokens = get().tokens;
    if (!tokens?.accessToken) return;

    const api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL!,
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    const { data } = await api.get("/users/me");
    set({ user: data });
  },

  logout: async () => {
    try {
      await auth0.webAuth.clearSession();
    } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ tokens: null, user: null });
  },
}));
