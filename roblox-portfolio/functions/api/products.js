import {
  ROBLOX_COMMUNITIES,
  fetchRobloxJson,
  jsonResponse,
  productSlug,
  withCache,
} from "../_shared/roblox.js";

async function getCommunityItems(community) {
  const params = new URLSearchParams({
    CreatorType: "Group",
    CreatorTargetId: String(community.communityId),
    Limit: "30",
    SortType: "3",
  });
  const response = await fetchRobloxJson(
    `https://catalog.roblox.com/v1/search/items/details?${params.toString()}`,
  );
  return (response.data ?? [])
    .filter(
      (item) =>
        Number.isSafeInteger(item.id) &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        item.creatorTargetId === community.communityId,
    )
    .map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: null,
      productUrl: `https://www.roblox.com/catalog/${item.id}/${productSlug(item.name)}`,
      communityId: community.communityId,
      communityName: item.creatorName || community.name,
    }));
}

export async function onRequestGet({ request }) {
  try {
    return await withCache(request, 900, async () => {
      const communities = await Promise.all(
        ROBLOX_COMMUNITIES.map(async (community) => ({
          community,
          items: await getCommunityItems(community),
        })),
      );
      const products = communities.flatMap(({ items }) => items);
      if (products.length > 0) {
        const thumbnails = await fetchRobloxJson(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${products.map(({ productId }) => productId).join(",")}&size=420x420&format=Png&isCircular=false`,
        );
        const imageById = new Map(
          (thumbnails.data ?? []).map((item) => [item.targetId, item.imageUrl ?? null]),
        );
        for (const product of products) {
          product.imageUrl = imageById.get(product.productId) ?? null;
        }
      }

      return jsonResponse(
        {
          items: products,
          available: true,
          updatedAt: new Date().toISOString(),
        },
        200,
        900,
      );
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to load Roblox store items." },
      error?.status ?? 502,
    );
  }
}
