import { Handlers } from "$fresh/server.ts";
import { signIn } from "kv_oauth";
import * as clients from "../utils/oauth2_client.ts";

export const handler: Handlers = {
  async GET(req) {
    const provider = (new URL(req.url).searchParams.get("with") || "github") as ("twitter"|"github")
    console.log(provider)
    return await signIn(req, clients[provider].oauthConfig);
  },
};