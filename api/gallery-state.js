import { getGalleryState } from "../lib/gallery-state.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const state = await getGalleryState();
    return response.status(200).json(state);
  } catch (error) {
    console.error("Failed to load gallery state:", error);
    return response.status(500).json({
      error: "Could not load gallery state. Make sure BLOB_READ_WRITE_TOKEN is configured on Vercel."
    });
  }
}
