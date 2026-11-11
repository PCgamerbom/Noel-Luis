import {
  ROBLOX_COMMUNITIES,
  fetchRobloxJson,
  groupIconUrlFor,
  jsonResponse,
  withCache,
} from "../_shared/roblox.js";

export async function onRequestGet({ request }) {
  try {
    return await withCache(request, 3600, async () => {
      const [groups, thumbnails] = await Promise.all([
        Promise.all(
          ROBLOX_COMMUNITIES.map(({ communityId }) =>
            fetchRobloxJson(`https://groups.roblox.com/v1/groups/${communityId}`),
          ),
        ),
        fetchRobloxJson(
          `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${ROBLOX_COMMUNITIES.map(({ communityId }) => communityId).join(",")}&size=150x150&format=Png&isCircular=false`,
        ),
      ]);

      const items = groups.map((group) => {
        const identity = ROBLOX_COMMUNITIES.find(
          ({ communityId }) => communityId === group.id,
        );
        return {
          communityId: group.id,
          name: group.name,
          description: group.description ?? "",
          memberCount: group.memberCount ?? 0,
          iconUrl: groupIconUrlFor(thumbnails, group.id),
          communityUrl: identity.communityUrl,
          storeUrl: identity.storeUrl,
        };
      });
      return jsonResponse({ items }, 200, 3600);
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to load Roblox communities." },
      error?.status ?? 502,
    );
  }
}
