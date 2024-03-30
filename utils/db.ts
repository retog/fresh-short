export const kv = await Deno.openKv();

export interface UserEntity {
  name?: string;
  login: {
    github?: string;
    twitter?: string;
    [index: string]: string | undefined;
  };
  sessionId: string;
}

export interface ShortEntity {
  userLogin: string;
  shortUrl: string;
  originalUrl: string;
}

export async function createOrUpdateUser(user: UserEntity) {
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const operation = kv.atomic();
  for (const provider in user.login) {
    const login = user.login[provider] as string;
    const usersKey = ["users", provider, login];
    operation.set(usersKey, user);
  }
  operation.set(usersBySessionKey, user);
  const resp = await operation.commit();
  if (!resp.ok) throw new Error(`Failed to create or update user: ${user}`);
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUserBySession(
  sessionId: string,
): Promise<UserEntity | null> {
  const usersBySessionKey = ["users_by_session", sessionId];
  const resp = await kv.get<UserEntity>(usersBySessionKey);
  return resp.value;
}

export async function getUserByLogin(provider: string, login: string) {
  const usersKey = ["users", provider, login];
  const resp = await kv.get<UserEntity>(usersKey);
  return resp.value;
}

export async function createShort(short: ShortEntity) {
  const shortKey = ["shorts", short.shortUrl];
  const shortByUserLoginKey = [
    "shorts_by_user",
    short.userLogin,
    short.shortUrl,
  ];

  const res = await kv.atomic()
    .check({ key: shortKey, versionstamp: null })
    .check({ key: shortByUserLoginKey, versionstamp: null })
    .set(shortKey, short)
    .set(shortByUserLoginKey, short)
    .commit();

  if (!res.ok) throw new Error(`Failed to create short: ${short}`);
}

export async function deleteShort(short: ShortEntity) {
  const shortsKey = ["shorts", short.shortUrl];
  const shortsByUserKey = ["shorts_by_user", short.userLogin, short.shortUrl];

  const res = await kv.atomic()
    .delete(shortsKey)
    .delete(shortsByUserKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete short: ${short}`);
}

export async function getShort(shortUrl: string) {
  const shortKey = ["shorts", shortUrl];
  const resp = await kv.get<ShortEntity>(shortKey);
  return resp.value;
}

export async function getShortsByUser(userLogin: string) {
  const iter = kv.list<ShortEntity>({ prefix: ["shorts_by_user", userLogin] });
  const shorts = [];
  for await (const { value } of iter) {
    shorts.push(value);
  }
  return shorts;
}
