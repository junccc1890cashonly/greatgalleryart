import { createPhotoRecord, formatShortDate, updateGalleryState } from "../lib/gallery-state.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const collectionId = String(body?.collectionId || "").trim();
    const image = String(body?.image || "").trim();
    const title = String(body?.title || "").trim();

    if (!collectionId || !image || !title) {
      return response.status(400).json({ error: "Collection, image, and title are required." });
    }

    const photo = createPhotoRecord({
      id: body?.id,
      title,
      note: String(body?.note || "").trim(),
      collectionId,
      tags: Array.isArray(body?.tags) ? body.tags : [],
      image
    });

    const state = await updateGalleryState((currentState) => {
      const collections = currentState.collections.map((collection) =>
        collection.id === photo.collectionId
          ? { ...collection, updatedAt: formatShortDate() }
          : collection
      );

      return {
        ...currentState,
        collections,
        photos: [photo, ...currentState.photos]
      };
    });

    return response.status(200).json({ photo, state });
  } catch (error) {
    console.error("Failed to save photo metadata:", error);
    return response.status(500).json({
      error: "Photo metadata could not be saved."
    });
  }
}
