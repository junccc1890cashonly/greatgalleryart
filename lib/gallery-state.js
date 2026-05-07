import { head, put } from "@vercel/blob";

const STATE_PATHNAME = "state/gallery-state.json";

const DEFAULT_COLLECTIONS = [
  {
    id: "quiet-luxury",
    name: "Quiet Luxury",
    description: "Refined editorial references with soft daylight and restrained styling.",
    tags: ["quietluxury", "editorial", "softdaylight"],
    updatedAt: "Apr 22"
  },
  {
    id: "soft-portrait-notes",
    name: "Soft Portrait Notes",
    description: "Portrait references with muted tones and light fashion energy.",
    tags: ["portrait", "fashion", "mutedtones"],
    updatedAt: "Apr 19"
  },
  {
    id: "interior-silence",
    name: "Interior Silence",
    description: "Quiet spatial references with tactile materials and generous negative space.",
    tags: ["interior", "neutralpalette", "quietspace"],
    updatedAt: "Apr 22"
  },
  {
    id: "muted-objects",
    name: "Muted Objects",
    description: "Still life details and brand-friendly object studies.",
    tags: ["detail", "neutral", "lifestyle"],
    updatedAt: "Apr 11"
  }
];

const DEFAULT_PHOTO_IMAGE_MAP = {
  "quiet-figure": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  "textural-living": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
  "curated-room": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
  "soft-portrait-notes": "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
  "slow-detail": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  "quiet-window-light": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
};

const DEFAULT_PHOTOS = [
  {
    id: "quiet-figure",
    title: "Quiet Figure",
    note: "柔和人物姿态与较大的呼吸区，适合提炼 editorial 人像方向。",
    collectionId: "quiet-luxury",
    tags: ["portrait", "editorial", "quietluxury", "softlight"],
    image: DEFAULT_PHOTO_IMAGE_MAP["quiet-figure"]
  },
  {
    id: "textural-living",
    title: "Textural Living",
    note: "带材质层次的室内生活图像，适合生成空间与品牌氛围 prompt。",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "quietluxury"],
    image: DEFAULT_PHOTO_IMAGE_MAP["textural-living"]
  },
  {
    id: "curated-room",
    title: "Curated Room",
    note: "安静、克制、结构感强的空间构图，强调留白与柔和质地。",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "negativespace"],
    image: DEFAULT_PHOTO_IMAGE_MAP["curated-room"]
  },
  {
    id: "soft-portrait-notes",
    title: "Soft Portrait Notes",
    note: "轻柔色阶与时尚感人物构图，适合人像类 prompt 的审美参考。",
    collectionId: "soft-portrait-notes",
    tags: ["portrait", "editorial", "fashion"],
    image: DEFAULT_PHOTO_IMAGE_MAP["soft-portrait-notes"]
  },
  {
    id: "slow-detail",
    title: "Slow Detail",
    note: "偏生活化的特写与局部构图，适合更安静的品牌内容表达。",
    collectionId: "muted-objects",
    tags: ["neutral", "detail", "lifestyle"],
    image: DEFAULT_PHOTO_IMAGE_MAP["slow-detail"]
  },
  {
    id: "quiet-window-light",
    title: "Quiet Window Light",
    note: "以光感和留白为主的画面，适合生成 calm atmosphere 方向的 prompt。",
    collectionId: "quiet-luxury",
    tags: ["quietluxury", "light", "neutral"],
    image: DEFAULT_PHOTO_IMAGE_MAP["quiet-window-light"]
  }
];

function formatShortDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);
}

function sanitizeCollection(collection) {
  return {
    id: String(collection.id),
    name: String(collection.name || "Untitled Collection"),
    description: String(collection.description || ""),
    tags: sanitizeTags(collection.tags),
    updatedAt: String(collection.updatedAt || formatShortDate())
  };
}

function sanitizePhoto(photo) {
  return {
    id: String(photo.id),
    title: String(photo.title || "Untitled Photo"),
    note: String(photo.note || ""),
    collectionId: String(photo.collectionId || ""),
    tags: sanitizeTags(photo.tags),
    image: String(photo.image || ""),
    uploadedAt: String(photo.uploadedAt || "")
  };
}

export function getDefaultState() {
  return {
    collections: DEFAULT_COLLECTIONS.map(sanitizeCollection),
    photos: DEFAULT_PHOTOS.map(sanitizePhoto)
  };
}

function normalizeState(state) {
  const baseState = getDefaultState();
  return {
    collections: Array.isArray(state?.collections) && state.collections.length
      ? state.collections.map(sanitizeCollection)
      : baseState.collections,
    photos: Array.isArray(state?.photos) && state.photos.length
      ? state.photos.map(sanitizePhoto)
      : baseState.photos
  };
}

async function readStoredState() {
  try {
    const metadata = await head(STATE_PATHNAME);
    const response = await fetch(metadata.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not read stored gallery state (${response.status})`);
    }
    const json = await response.json();
    return {
      state: normalizeState(json),
      etag: metadata.etag
    };
  } catch (error) {
    if (error?.name === "BlobNotFoundError") {
      return {
        state: getDefaultState(),
        etag: null
      };
    }
    throw error;
  }
}

async function persistState(state, etag = null) {
  const options = {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  };

  if (etag) {
    options.ifMatch = etag;
  }

  await put(STATE_PATHNAME, JSON.stringify(normalizeState(state), null, 2), options);
}

export async function getGalleryState() {
  const { state } = await readStoredState();
  return state;
}

export async function updateGalleryState(updater, attempt = 0) {
  const { state, etag } = await readStoredState();
  const nextState = normalizeState(await updater(state));

  try {
    await persistState(nextState, etag);
    return nextState;
  } catch (error) {
    if (error?.name === "BlobPreconditionFailedError" && attempt < 2) {
      return updateGalleryState(updater, attempt + 1);
    }
    throw error;
  }
}

export function createCollectionRecord(input) {
  const slug = String(input.name || "collection")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return sanitizeCollection({
    id: `${slug || "collection"}-${Date.now()}`,
    name: input.name,
    description: input.description,
    tags: input.tags,
    updatedAt: formatShortDate()
  });
}

export function createPhotoRecord(input) {
  return sanitizePhoto({
    id: input.id || `upload-${Date.now()}`,
    title: input.title,
    note: input.note,
    collectionId: input.collectionId,
    tags: input.tags,
    image: input.image,
    uploadedAt: new Date().toISOString()
  });
}

export { formatShortDate };
