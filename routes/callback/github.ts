import { Handlers } from "$fresh/server.ts";
import { github } from "../../utils/oauth2_client.ts";

export const handler: Handlers = {
  async GET(req) {
    return await github.handleCallback(req)
  },
};