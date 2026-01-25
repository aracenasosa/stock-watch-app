import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from "@/shared/constants";
import Auth0 from "react-native-auth0";

export const auth0 = new Auth0({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});
