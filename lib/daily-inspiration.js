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
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80"
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
    images: [
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80"
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
    images: [
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
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
    images: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80"
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

export function getDailyInspirationDateKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function getDailyInspirationPayload(date = new Date()) {
  const daySeed = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.floor(daySeed / 86400000);
  const entry = DAILY_INSPIRATION_LIBRARY[dayIndex % DAILY_INSPIRATION_LIBRARY.length];
  const mood = entry.moods[dayIndex % entry.moods.length];
  const dateKey = getDailyInspirationDateKey(date);

  return {
    ...entry,
    mood,
    dateKey,
    tagSet: [
      "daily-inspiration",
      slugify(entry.title),
      slugify(mood),
      ...entry.palette.map(slugify)
    ].filter(Boolean)
  };
}
