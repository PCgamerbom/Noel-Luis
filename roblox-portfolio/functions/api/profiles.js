import {
  ROBLOX_PROFILES,
  avatarUrlFor,
  fetchRobloxJson,
  jsonResponse,
  toUserProfile,
  withCache,
} from "../_shared/roblox.js";

export async function onRequestGet({ request }) {
  try {
    return await withCache(request, 3600, async () => {
      const [users, thumbnails] = await Promise.all([
        Promise.all(
          ROBLOX_PROFILES.map(({ userId }) =>
            fetchRobloxJson(`https://users.roblox.com/v1/users/${userId}`),
          ),
        ),
        fetchRobloxJson(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ROBLOX_PROFILES.map(({ userId }) => userId).join(",")}&size=420x420&format=Png&isCircular=false`,
        ),
      ]);

      const items = users.map((user) =>
        toUserProfile(user, avatarUrlFor(thumbnails, user.id)),
      );
      return jsonResponse({ items }, 200, 3600);
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to load Roblox profiles." },
      error?.status ?? 502,
    );
  }
}
