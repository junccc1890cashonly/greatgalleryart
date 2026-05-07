import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
};

function parseRequestBody(request) {
  return typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image payload.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function sanitizeFilename(filename) {
  return String(filename || "upload.jpg")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = parseRequestBody(request);
    const title = String(body?.title || "").trim();
    const collectionId = String(body?.collectionId || "").trim();
    const filename = sanitizeFilename(body?.filename);

    if (!title || !collectionId || !body?.dataUrl) {
      return response.status(400).json({
        error: "Title, collection, and image payload are required."
      });
    }

    const { contentType, buffer } = parseDataUrl(body.dataUrl);
    const blob = await put(`gallery-art/${Date.now()}-${filename}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType
    });
    return response.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Failed to upload photo:", error);
    return response.status(500).json({
      error: error.message || "Photo upload failed."
    });
  }
}
