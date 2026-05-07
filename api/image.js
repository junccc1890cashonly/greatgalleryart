export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).send("Method not allowed");
  }

  const rawUrl = String(request.query?.url || "").trim();
  if (!rawUrl) {
    return response.status(400).send("Missing image url");
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return response.status(400).send("Invalid image url");
  }

  if (!targetUrl.hostname.endsWith(".blob.vercel-storage.com")) {
    return response.status(400).send("Only Blob image urls are allowed");
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: "image/*"
      },
      cache: "no-store"
    });

    if (!upstream.ok) {
      return response.status(502).send(`Upstream image failed (${upstream.status})`);
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return response.status(200).send(buffer);
  } catch (error) {
    console.error("Image proxy failed:", error);
    return response.status(502).send("Image proxy request failed");
  }
}
