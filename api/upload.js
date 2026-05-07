import { handleUpload } from "@vercel/blob/client";
import { createPhotoRecord, formatShortDate, updateGalleryState } from "../lib/gallery-state.js";

function parseClientPayload(clientPayload) {
  if (!clientPayload) {
    return {};
  }

  if (typeof clientPayload === "string") {
    return JSON.parse(clientPayload);
  }

  return clientPayload;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        const tags = Array.isArray(payload.tags) ? payload.tags : [];

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            pathname,
            title: String(payload.title || "Uploaded Photo"),
            note: String(payload.note || "Uploaded personal reference."),
            collectionId: String(payload.collectionId || ""),
            tags
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "{}");
        const photo = createPhotoRecord({
          id: `upload-${Date.now()}`,
          title: payload.title,
          note: payload.note,
          collectionId: payload.collectionId,
          tags: payload.tags,
          image: blob.url
        });

        await updateGalleryState((currentState) => {
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
      }
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Blob upload handshake failed:", error);
    return response.status(400).json({
      error: error.message || "Blob upload could not start."
    });
  }
}
