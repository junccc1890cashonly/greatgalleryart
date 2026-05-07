import { createCollectionRecord, updateGalleryState } from "../lib/gallery-state.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const name = String(body?.name || "").trim();

    if (!name) {
      return response.status(400).json({ error: "Collection name is required." });
    }

    const collection = createCollectionRecord({
      name,
      description: String(body?.description || "").trim(),
      tags: Array.isArray(body?.tags) ? body.tags : []
    });

    const state = await updateGalleryState((currentState) => ({
      ...currentState,
      collections: [collection, ...currentState.collections]
    }));

    return response.status(200).json({ collection, state });
  } catch (error) {
    console.error("Failed to create collection:", error);
    return response.status(500).json({
      error: "Collection could not be created. Check that Vercel Blob is connected to this project."
    });
  }
}
