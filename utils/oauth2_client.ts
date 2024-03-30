import { createGitHubOAuthConfig, createTwitterOAuthConfig } from "kv_oauth";
import { handleCallback } from "kv_oauth";
import {
  createOrUpdateUser,
  deleteUserBySession,
  getUserByLogin,
  UserEntity,
} from "./db.ts";

interface GithubUser {
  login: string;
  name: string;
  avatar_url: string;
}

export const twitter = {
  oauthConfig: createTwitterOAuthConfig({
    redirectUri:
      "https://probable-goggles-xr97799wcvwx6-8000.app.github.dev/callback/twitter",
    scope: ["users.read", "tweet.read"],
  }),
  handleCallback: async (req: Request) => {
      const { response, sessionId, tokens } = await handleCallback(
        req,
        twitter.oauthConfig,
      );
  
      const twitterResponse = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          authorization: `bearer ${tokens.accessToken}`,
        },
      });
  
      const twitterUser = await twitterResponse.json();
      console.log(JSON.stringify(twitterUser));
      const user = await getUserByLogin("twitter", twitterUser.data.username);
      if (user) {
        await deleteUserBySession(user.sessionId);
        await createOrUpdateUser({ ...user, sessionId });
      } else {
        const newUser: UserEntity = {
          login: {twitter: twitterUser.data.username},
          name: twitterUser.data.name,
          sessionId,
        };
        await createOrUpdateUser(newUser);
      }
      return response;
  }
};

export const github = {
  oauthConfig: createGitHubOAuthConfig(),
  handleCallback: async (req: Request) => {
    const { response, sessionId, tokens } = await handleCallback(
      req,
      github.oauthConfig,
    );

    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        authorization: `bearer ${tokens.accessToken}`,
      },
    });

    const githubUser: GithubUser = await githubResponse.json();

    const user = await getUserByLogin("github", githubUser.login);
    if (user) {
      await deleteUserBySession(user.sessionId);
      await createOrUpdateUser({ ...user, sessionId });
    } else {
      const newUser: UserEntity = {
        login: {github: githubUser.login},
        sessionId,
      };
      await createOrUpdateUser(newUser);
    }
    return response;
  },
};
