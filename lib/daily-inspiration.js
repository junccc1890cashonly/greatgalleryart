export const DAILY_INSPIRATION_COLLECTION_ID = "daily-inspiration";

export const DAILY_INSPIRATION_LIBRARY = [
  {
    id: "collection-01",
    collectionLabel: "Collection 01",
    title: "Blue Silence",
    description: "The feeling of a winter morning before the world wakes up. Silence. Distance. Breathing space.",
    moods: ["Quiet", "Calm", "Expansive", "Reflective"],
    palette: ["deep blue", "fog grey", "soft white", "cold silver"],
    prompt: "Find landscapes that create stillness through water, fog, distance, and light.",
    preferredCollectionIds: ["interior-silence", "quiet-luxury"],
    preferredTags: ["quietspace", "light", "neutral", "negativespace"],
    fallbackImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "collection-02",
    collectionLabel: "Collection 02",
    title: "Stone Meditation",
    description: "The feeling of time existing inside material. Ancient. Grounded. Silent.",
    moods: ["Grounded", "Timeless", "Stable", "Meditative"],
    palette: ["charcoal", "graphite", "black", "mineral grey"],
    prompt: "Find objects and materials that communicate permanence and quiet strength.",
    preferredCollectionIds: ["muted-objects", "quiet-luxury"],
    preferredTags: ["detail", "neutral", "lifestyle", "quietluxury"],
    fallbackImages: [
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "collection-03",
    collectionLabel: "Collection 03",
    title: "Architectural Light",
    description: "The relationship between light, shadow and geometry. Order without noise.",
    moods: ["Precise", "Quiet", "Structured", "Luminous"],
    palette: ["stone white", "shadow grey", "concrete", "soft black"],
    prompt: "Find architecture where light and shadow reveal geometry with stillness and restraint.",
    preferredCollectionIds: ["interior-silence", "quiet-luxury"],
    preferredTags: ["interior", "editorial", "negativespace", "quietspace"],
    fallbackImages: [
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "collection-04",
    collectionLabel: "Collection 04",
    title: "Ritual Domesticity",
    description: "Small interior rituals that return attention to presence, slowness, and lived texture.",
    moods: ["Attentive", "Warm", "Ritual", "Focused"],
    palette: ["bone", "linen", "oat", "aged wood"],
    prompt: "Find domestic scenes and quiet objects that turn ordinary routines into deliberate rituals.",
    preferredCollectionIds: ["muted-objects", "interior-silence", "quiet-luxury"],
    preferredTags: ["lifestyle", "detail", "interior", "softlight"],
    fallbackImages: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"
    ]
  }
];

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSeed(value) {
  let hash = 2166136261;
  const stringValue = String(value);
  for (let index = 0; index < stringValue.length; index += 1) {
    hash ^= stringValue.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleDeterministic(items, seedKey) {
  const nextItems = [...items];
  const random = createSeededRandom(createSeed(seedKey));
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }
  return nextItems;
}

function dedupeStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function buildPhotoPool(entry, sourcePhotos = []) {
  const nonDailyPhotos = (sourcePhotos || []).filter((photo) => photo.collectionId !== DAILY_INSPIRATION_COLLECTION_ID);
  const preferredCollections = new Set(entry.preferredCollectionIds || []);
  const preferredTags = new Set((entry.preferredTags || []).map((tag) => String(tag).toLowerCase()));

  const scored = nonDailyPhotos
    .map((photo) => {
      let score = 0;
      if (preferredCollections.has(photo.collectionId)) {
        score += 3;
      }
      const photoTags = Array.isArray(photo.tags) ? photo.tags.map((tag) => String(tag).toLowerCase()) : [];
      if (photoTags.some((tag) => preferredTags.has(tag))) {
        score += 2;
      }
      if (photo.image && photo.image.includes(".blob.vercel-storage.com")) {
        score += 1;
      }
      return {
        photo,
        score
      };
    })
    .sort((left, right) => right.score - left.score);

  const userImages = dedupeStrings(scored.map((item) => item.photo.image));
  const fallbackImages = dedupeStrings(entry.fallbackImages || []);
  return dedupeStrings([...userImages, ...fallbackImages]);
}

function pickFourImages(pool, seedKey) {
  if (pool.length <= 4) {
    return pool.slice(0, 4);
  }
  return shuffleDeterministic(pool, seedKey).slice(0, 4);
}

export function getDailyInspirationDateKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function getDailyInspirationPayload(date = new Date(), sourcePhotos = []) {
  const daySeed = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.floor(daySeed / 86400000);
  const entry = DAILY_INSPIRATION_LIBRARY[dayIndex % DAILY_INSPIRATION_LIBRARY.length];
  const mood = entry.moods[dayIndex % entry.moods.length];
  const dateKey = getDailyInspirationDateKey(date);
  const imagePool = buildPhotoPool(entry, sourcePhotos);
  const images = pickFourImages(imagePool, `${entry.id}-${dateKey}`);

  return {
    ...entry,
    mood,
    dateKey,
    images,
    imagePool,
    tagSet: [
      "daily-inspiration",
      slugify(entry.title),
      slugify(mood),
      ...entry.palette.map(slugify)
    ].filter(Boolean)
  };
}
