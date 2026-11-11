import {
  ROBLOX_PROFILES,
  fetchRobloxJson,
  jsonResponse,
  withCache,
} from "../_shared/roblox.js";

export async function onRequestGet({ request }) {
  try {
    return await withCache(request, 20, async () => {
      const presenceData = await fetchRobloxJson(
        "https://presence.roblox.com/v1/presence/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: ROBLOX_PROFILES.map((profile) => profile.userId),
          }),
        },
      );
      const rawPresence = Array.isArray(presenceData.userPresences)
        ? presenceData.userPresences
        : [];

      const inGame = rawPresence.filter(
        (item) => item.userPresenceType === 2 && item.universeId,
      );
      const universeIds = [...new Set(inGame.map((item) => item.universeId))];
      let experienceNames = new Map();
      if (universeIds.length > 0) {
        const gamesData = await fetchRobloxJson(
          `https://games.roblox.com/v1/games?universeIds=${universeIds.join(",")}`,
        );
        experienceNames = new Map(
          (gamesData.data ?? []).map((game) => [game.id, game.name]),
        );
      }

      const byId = new Map(rawPresence.map((item) => [item.userId, item]));
      const items = ROBLOX_PROFILES.map(({ userId, username }) => {
        const current = byId.get(userId);
        if (!current) {
          return {
            userId,
            username,
            status: "unavailable",
            experienceName: null,
            lastLocation: null,
          };
        }

        const statusByType = {
          0: "offline",
          1: "online",
          2: "in_game",
          3: "in_studio",
        };
        const status = statusByType[current.userPresenceType] ?? "unavailable";
        return {
          userId,
          username,
          status,
          experienceName:
            status === "in_game"
              ? (experienceNames.get(current.universeId) ?? null)
              : null,
          lastLocation:
            typeof current.lastLocation === "string" && current.lastLocation
              ? current.lastLocation
              : null,
        };
      });

      return jsonResponse({ items, updatedAt: new Date().toISOString() }, 200, 20);
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to load Roblox presence." },
      error?.status ?? 502,
    );
  }
}
