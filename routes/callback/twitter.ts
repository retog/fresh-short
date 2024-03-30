import { Handlers } from "$fresh/server.ts";
import { twitter } from "../../utils/oauth2_client.ts";

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

export const handler: Handlers = {
  async GET(req) {
    return await twitter.handleCallback(req)
  },
};