export const ROBLOX_PROFILES = [
  { userId: 2281180949, username: "PCgamerbom" },
  { userId: 2356360059, username: "LRicardo9506" },
];

export const ROBLOX_COMMUNITIES = [
  {
    communityId: 32550336,
    name: "LUSOBR STUDIO",
    communityUrl: "https://www.roblox.com/communities/32550336/LusoBR-Studio",
    storeUrl: "https://www.roblox.com/communities/32550336/LusoBR-Studio#!/store",
  },
  {
    communityId: 663568444,
    name: "NOEL UGC",
    communityUrl: "https://www.roblox.com/communities/663568444/NOEL-UGC#!/about",
    storeUrl: "https://www.roblox.com/communities/663568444/NOEL-UGC#!/store",
  },
];

export class RobloxApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "RobloxApiError";
    this.status = status;
  }
}

export async function fetchRobloxJson(url, init) {
  let response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": "RobloxPortfolio/1.0 (public Roblox data)",
        ...init?.headers,
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new RobloxApiError("Roblox services could not be reached.", 502);
  }

  if (!response.ok) {
    throw new RobloxApiError(
      `Roblox service returned HTTP ${response.status}.`,
      response.status === 429 ? 503 : 502,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new RobloxApiError("Roblox returned an invalid response.", 502);
  }
}

export function jsonResponse(data, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control":
        cacheSeconds > 0
          ? `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${Math.min(cacheSeconds * 2, 3600)}`
          : "no-store",
    },
  });
}

export async function withCache(request, cacheSeconds, load) {
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), {
    method: "GET",
  });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await load();
  if (response.ok && cacheSeconds > 0) {
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

export function toUserProfile(user, avatarUrl) {
  return {
    userId: user.id,
    username: user.name,
    displayName: user.displayName,
    description: user.description ?? "",
    created: user.created,
    avatarUrl: avatarUrl ?? null,
    profileUrl: `https://www.roblox.com/users/${user.id}/profile`,
  };
}

export function avatarUrlFor(thumbnails, userId) {
  return thumbnails?.data?.find((item) => item.targetId === userId)?.imageUrl ?? null;
}

export function groupIconUrlFor(thumbnails, groupId) {
  return thumbnails?.data?.find((item) => item.targetId === groupId)?.imageUrl ?? null;
}

export function productSlug(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
