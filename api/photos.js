import { del } from "@vercel/blob";
import { createPhotoRecord, formatShortDate, updateGalleryState } from "../lib/gallery-state.js";
import { AuthError, requireAuthenticatedRequest } from "../lib/supabase-auth.js";

export default async function handler(request, response) {
  if (request.method === "POST") {
    try {
      await requireAuthenticatedRequest(request);
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
      const status = error instanceof AuthError ? error.status : 500;
      return response.status(status).json({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (request.method === "DELETE") {
    try {
      await requireAuthenticatedRequest(request);
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
      const photoId = String(body?.id || "").trim();

      if (!photoId) {
        return response.status(400).json({ error: "Photo id is required." });
      }

      let removedPhoto = null;
      const state = await updateGalleryState((currentState) => {
        removedPhoto = currentState.photos.find((photo) => photo.id === photoId) || null;
        const nextPhotos = currentState.photos.filter((photo) => photo.id !== photoId);
        return {
          ...currentState,
          photos: nextPhotos
        };
      });

      if (removedPhoto?.image && removedPhoto.image.includes(".blob.vercel-storage.com")) {
        await del(removedPhoto.image).catch((error) => {
          console.warn("Blob file could not be deleted:", error);
        });
      }

      return response.status(200).json({ state });
    } catch (error) {
      console.error("Failed to delete photo metadata:", error);
      const status = error instanceof AuthError ? error.status : 500;
      return response.status(status).json({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  response.setHeader("Allow", "POST, DELETE");
  return response.status(405).json({ error: "Method not allowed." });
}
