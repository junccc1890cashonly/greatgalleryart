import { getGalleryState } from "../lib/gallery-state.js";

function buildSelectedPhotos(state, selectedIds) {
  const selectedSet = new Set(selectedIds);
  const selectedPhotos = state.photos.filter((photo) => selectedSet.has(photo.id));
  if (selectedPhotos.length) {
    return selectedIds
      .map((id) => selectedPhotos.find((photo) => photo.id === id))
      .filter(Boolean);
  }
  return state.photos.slice(0, 4);
}

function extractJson(text) {
  const source = String(text || "").trim();
  if (!source) {
    throw new Error("OpenAI returned an empty response.");
  }
  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("OpenAI did not return valid JSON.");
  }
  return JSON.parse(source.slice(firstBrace, lastBrace + 1));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: "OPENAI_API_KEY is missing in this Vercel project." });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const selectedIds = Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : [];
    const creativeDirection = String(body.creativeDirection || "").trim();

    const state = await getGalleryState();
    const photos = buildSelectedPhotos(state, selectedIds);

    if (!photos.length) {
      return response.status(400).json({ error: "No references available for prompt generation." });
    }

    const userContent = [
      {
        type: "input_text",
        text:
          "Use the selected references to produce a structured prompt package for Lovart. " +
          "Return JSON only with keys: style_summary, hashtags, lovart_prompt."
      },
      {
        type: "input_text",
        text:
          `Creative direction from the user: ${creativeDirection || "No extra direction provided. Keep the result refined, editorial, and reusable."}`
      },
      {
        type: "input_text",
        text:
          `Reference metadata:\n${photos
            .map((photo, index) => `${index + 1}. ${photo.title} | tags: ${(photo.tags || []).join(", ")} | note: ${photo.note || "None"}`)
            .join("\n")}`
      },
      ...photos
        .filter((photo) => photo.image)
        .map((photo) => ({
          type: "input_image",
          image_url: photo.image,
          detail: "low"
        }))
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are a visual prompt strategist. Analyze the references for shared visual language, then write a refined, English-first Lovart prompt. " +
                  "Keep the output concise, specific, and editorial. Return JSON only. The hashtags field must be an array of 6 to 10 hashtag strings."
              }
            ]
          },
          {
            role: "user",
            content: userContent
          }
        ],
        text: {
          verbosity: "medium"
        }
      })
    });

    const rawText = await openaiResponse.text();
    if (!openaiResponse.ok) {
      return response.status(openaiResponse.status).json({ error: rawText || "OpenAI request failed." });
    }

    const parsedResponse = JSON.parse(rawText);
    const outputText = parsedResponse.output_text || "";
    const promptPackage = extractJson(outputText);

    return response.status(200).json({
      styleSummary: String(promptPackage.style_summary || "").trim(),
      hashtags: Array.isArray(promptPackage.hashtags) ? promptPackage.hashtags.map(String) : [],
      lovartPrompt: String(promptPackage.lovart_prompt || "").trim(),
      selectedCount: photos.length
    });
  } catch (error) {
    console.error("Prompt generation failed:", error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
