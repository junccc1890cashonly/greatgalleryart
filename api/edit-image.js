import { put } from "@vercel/blob";

function sanitizeFilename(filename) {
  return String(filename || "enhanced-image")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchSourceImageAsBlob(sourceImageUrl) {
  const response = await fetch(sourceImageUrl);
  if (!response.ok) {
    throw new Error("The source image could not be loaded for editing.");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";

  return {
    blob: new Blob([arrayBuffer], { type: contentType }),
    extension
  };
}

function extractImagePayload(data) {
  const first = Array.isArray(data?.data) ? data.data[0] : null;
  if (!first) {
    throw new Error("OpenAI image edit returned no image.");
  }

  if (first.b64_json) {
    return {
      buffer: Buffer.from(first.b64_json, "base64"),
      mimeType: "image/png",
      revisedPrompt: first.revised_prompt || ""
    };
  }

  if (first.url) {
    return {
      url: first.url,
      revisedPrompt: first.revised_prompt || ""
    };
  }

  throw new Error("OpenAI image edit did not include a usable image result.");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  if (!apiKey) {
    return response.status(500).json({ error: "OPENAI_API_KEY is missing in this Vercel project." });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const sourceImageUrl = String(body.sourceImageUrl || "").trim();
    const prompt = String(body.prompt || "").trim();
    const title = String(body.title || "galleryart-edit").trim();

    if (!sourceImageUrl || !prompt) {
      return response.status(400).json({
        error: "A source image URL and prompt are required."
      });
    }

    const { blob, extension } = await fetchSourceImageAsBlob(sourceImageUrl);
    const formData = new FormData();
    formData.append("model", imageModel);
    formData.append("prompt", prompt);
    formData.append("quality", "medium");
    formData.append("size", "1024x1024");
    formData.append("response_format", "b64_json");
    formData.append("image", blob, `${sanitizeFilename(title)}.${extension}`);

    const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const rawText = await openaiResponse.text();
    let parsed = {};
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsed = {};
    }

    if (!openaiResponse.ok) {
      const message =
        parsed?.error?.message ||
        rawText ||
        "OpenAI image editing failed.";
      return response.status(openaiResponse.status).json({ error: message });
    }

    const imagePayload = extractImagePayload(parsed);

    if (imagePayload.url) {
      return response.status(200).json({
        imageUrl: imagePayload.url,
        revisedPrompt: imagePayload.revisedPrompt || ""
      });
    }

    const stored = await put(
      `gallery-art-edits/${Date.now()}-${sanitizeFilename(title)}.png`,
      imagePayload.buffer,
      {
        access: "public",
        addRandomSuffix: true,
        contentType: imagePayload.mimeType || "image/png"
      }
    );

    return response.status(200).json({
      imageUrl: stored.url,
      revisedPrompt: imagePayload.revisedPrompt || ""
    });
  } catch (error) {
    console.error("Image enhancement failed:", error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
