import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from "@/shared/constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const issuer = `https://${AUTH0_DOMAIN}`;

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${issuer}/authorize`,
  tokenEndpoint: `${issuer}/oauth/token`,
  revocationEndpoint: `${issuer}/oauth/revoke`,
};

export const redirectUri = AuthSession.makeRedirectUri({
  path: "callback",
});

type Auth0TokenResponse = {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in?: number;
};

export async function loginWithAuth0() {
  const request = new AuthSession.AuthRequest({
    clientId: AUTH0_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      audience: AUTH0_AUDIENCE,
    },
  });

  await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params.code) {
    if (result.type === "dismiss" || result.type === "cancel") {
      const error: any = new Error("User cancelled login");
      error.code = "user_cancelled";
      throw error;
    }
    throw new Error("Auth0 login failed");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: AUTH0_CLIENT_ID,
    code: result.params.code,
    redirect_uri: redirectUri,
    code_verifier: request.codeVerifier!,
  }).toString();

  const tokenRes = await fetch(discovery.tokenEndpoint!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const json = (await tokenRes.json()) as Auth0TokenResponse;

  return {
    accessToken: json.access_token,
    idToken: json.id_token,
  };
}

export async function logoutFromAuth0() {
  const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(
    redirectUri,
  )}`;

  // For logout we just open the URL in the browser; the Auth0
  // session will be cleared and we clear local tokens below.
  await WebBrowser.openBrowserAsync(logoutUrl);
}
