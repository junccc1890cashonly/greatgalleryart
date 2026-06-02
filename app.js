const STORAGE_KEY = "galleryArtSelection";
const ACTIVE_COLLECTION_KEY = "galleryArtActiveCollection";

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
    note: "A soft portrait with generous negative space, useful for extracting an editorial portrait direction.",
    collectionId: "quiet-luxury",
    tags: ["portrait", "editorial", "quietluxury", "softlight"],
    image: DEFAULT_PHOTO_IMAGE_MAP["quiet-figure"]
  },
  {
    id: "textural-living",
    title: "Textural Living",
    note: "An interior lifestyle image with layered materials, ideal for spatial and brand atmosphere prompts.",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "quietluxury"],
    image: DEFAULT_PHOTO_IMAGE_MAP["textural-living"]
  },
  {
    id: "curated-room",
    title: "Curated Room",
    note: "A restrained, structured interior composition focused on negative space and soft surfaces.",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "negativespace"],
    image: DEFAULT_PHOTO_IMAGE_MAP["curated-room"]
  },
  {
    id: "soft-portrait-notes",
    title: "Soft Portrait Notes",
    note: "A soft-toned fashion portrait composition that works well as a reference for portrait prompts.",
    collectionId: "soft-portrait-notes",
    tags: ["portrait", "editorial", "fashion"],
    image: DEFAULT_PHOTO_IMAGE_MAP["soft-portrait-notes"]
  },
  {
    id: "slow-detail",
    title: "Slow Detail",
    note: "A lifestyle close-up with a quiet framing style, well suited for calm brand storytelling.",
    collectionId: "muted-objects",
    tags: ["neutral", "detail", "lifestyle"],
    image: DEFAULT_PHOTO_IMAGE_MAP["slow-detail"]
  },
  {
    id: "quiet-window-light",
    title: "Quiet Window Light",
    note: "A light-led composition with generous space, useful for calm atmosphere prompt directions.",
    collectionId: "quiet-luxury",
    tags: ["quietluxury", "light", "neutral"],
    image: DEFAULT_PHOTO_IMAGE_MAP["quiet-window-light"]
  }
];

function readSelection() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSelection(selection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

function readActiveCollection() {
  return localStorage.getItem(ACTIVE_COLLECTION_KEY) || "";
}

function writeActiveCollection(collectionId) {
  localStorage.setItem(ACTIVE_COLLECTION_KEY, collectionId);
}

function formatCount(count) {
  return String(count).padStart(2, "0");
}

function getCollectionName(collections, collectionId) {
  const found = collections.find((collection) => collection.id === collectionId);
  return found ? found.name : "Unsorted Collection";
}

function getProxiedImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.includes(".blob.vercel-storage.com")) {
    return `./api/image?url=${encodeURIComponent(value)}`;
  }
  return value;
}

function normalizeTagList(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
}

function buildFallbackState() {
  return {
    collections: DEFAULT_COLLECTIONS,
    photos: DEFAULT_PHOTOS
  };
}

async function fetchGalleryState() {
  const response = await fetch("./api/gallery-state", {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Could not load gallery state (${response.status})`);
  }

  return response.json();
}

async function postJson(url, payload) {
  return requestJson(url, "POST", payload);
}

async function deleteJson(url, payload) {
  return requestJson(url, "DELETE", payload);
}

async function requestJson(url, method, payload) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const rawError = data?.error;
    const textError = typeof rawText === "string" ? rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    const message =
      typeof rawError === "string"
        ? rawError
        : rawError?.message || rawError?.error || textError || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function createUploadedCard(photo, collections) {
  const card = document.createElement("article");
  card.className = "gallery-item is-user-photo";
  card.dataset.photoId = photo.id;
  card.dataset.tags = (photo.tags || []).join(" ");
  const collectionName = getCollectionName(collections, photo.collectionId);
  const imageUrl = String(photo.image || "").trim();
  const proxiedImageUrl = getProxiedImageUrl(imageUrl);
  card.innerHTML = `
    <div class="gallery-cover">
      ${imageUrl
        ? `<a class="gallery-cover-link" href="${proxiedImageUrl}" target="_blank" rel="noreferrer">
             <img class="gallery-image" src="${proxiedImageUrl}" alt="${photo.title}" loading="lazy" />
           </a>`
        : `<div class="image-empty">Image URL missing</div>`}
    </div>
    <h4>${photo.title}</h4>
    <p>${photo.note || "Uploaded personal reference."}</p>
    <div class="meta">Stored in Blob · Collection ${collectionName}</div>
    <div class="item-tags">${(photo.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join("")}</div>
    <div class="gallery-actions">
      <button class="card-action js-delete-photo" type="button">Delete</button>
      <button class="card-action primary js-add-to-prompt" type="button">Add to Prompt</button>
    </div>
  `;
  return card;
}

function createGalleryCard(photo, collections, options = {}) {
  const { isFallback = false } = options;
  if (!isFallback) {
    return createUploadedCard(photo, collections);
  }

  const card = document.createElement("article");
  card.className = "gallery-item";
  card.dataset.photoId = photo.id;
  card.dataset.tags = (photo.tags || []).join(" ");
  const collectionName = getCollectionName(collections, photo.collectionId);
  const imageUrl = String(photo.image || "").trim();
  const proxiedImageUrl = getProxiedImageUrl(imageUrl);
  card.innerHTML = `
    <div class="gallery-cover">
      ${imageUrl
        ? `<a class="gallery-cover-link" href="${proxiedImageUrl}" target="_blank" rel="noreferrer">
             <img class="gallery-image" src="${proxiedImageUrl}" alt="${photo.title}" loading="lazy" />
           </a>`
        : `<div class="image-empty">Image URL missing</div>`}
    </div>
    <h4>${photo.title}</h4>
    <p>${photo.note || "Collected visual reference."}</p>
    <div class="meta">Added ${collectionName}</div>
    <div class="item-tags">${(photo.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join("")}</div>
    <div class="gallery-actions">
      <button class="card-action js-delete-photo" type="button">Delete</button>
      <button class="card-action primary js-add-to-prompt" type="button">Add to Prompt</button>
    </div>
  `;
  return card;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process this image."));
    image.src = dataUrl;
  });
}

async function compressImageFile(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function setupGallery() {
  const galleryGrid = document.querySelector(".js-gallery-grid");
  if (!galleryGrid) return;

  const items = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));

  const countTargets = document.querySelectorAll(".js-selected-count");
  const summary = document.querySelector(".js-selection-summary");
  const promptLinks = document.querySelectorAll(".js-open-prompt");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const collectionList = document.querySelector(".js-collection-list");
  const uploadModal = document.querySelector(".js-upload-modal");
  const collectionModal = document.querySelector(".js-collection-modal");
  const uploadForm = document.querySelector(".js-upload-form");
  const collectionForm = document.querySelector(".js-collection-form");
  const uploadCollection = document.querySelector(".js-upload-collection");
  const galleryStatus = document.querySelector(".js-gallery-status");

  let selection = readSelection();
  let remoteState = buildFallbackState();

  function normalizeSelection() {
    const validIds = new Set((remoteState.photos || []).map((photo) => photo.id));
    selection = selection.filter((id) => validIds.has(id));
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function refreshGalleryStatus(message) {
    if (galleryStatus) {
      galleryStatus.textContent = message;
    }
  }

  function attachSelectionHandler(item) {
    if (item.dataset.boundSelection === "true") return;
    item.dataset.boundSelection = "true";
  }

  function renderSelection() {
    normalizeSelection();
    const allItems = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
    const selectedCount = selection.length;
    allItems.forEach((item) => {
      const isSelected = selection.includes(item.dataset.photoId);
      item.classList.toggle("is-selected", isSelected);
      const addButton = item.querySelector(".js-add-to-prompt");
      if (addButton) {
        addButton.textContent = isSelected ? "Added to Prompt" : "Add to Prompt";
      }
    });

    countTargets.forEach((node) => {
      node.textContent = selectedCount;
    });

    if (summary) {
      summary.textContent =
        selectedCount > 0
          ? `${selectedCount} references ready for Prompt Studio.`
          : "Select references to prepare a Lovart prompt set.";
    }

    promptLinks.forEach((link) => {
      const disabled = selectedCount === 0;
      link.classList.toggle("is-disabled", disabled);
      link.setAttribute("aria-disabled", String(disabled));
      link.textContent = disabled ? "Select References First" : "Open Prompt Studio";
      if (link.classList.contains("js-open-prompt") && link.closest(".toolbar-right")) {
        link.textContent = disabled ? "Select References First" : "Generate Prompt";
      }
    });

    writeSelection(selection);
  }

  function renderFilter(tag) {
    filterButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === tag);
    });

    const allItems = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
    allItems.forEach((item) => {
      const tags = item.dataset.tags || "";
      const visible = tag === "all" || tags.includes(tag);
      item.classList.toggle("is-hidden", !visible);
    });
  }

  function renderCollectionOptions() {
    if (!uploadCollection) return;
    uploadCollection.innerHTML = remoteState.collections
      .map((collection) => `<option value="${collection.id}">${collection.name}</option>`)
      .join("");
    if (!uploadCollection.value && remoteState.collections[0]) {
      uploadCollection.value = remoteState.collections[0].id;
    }
  }

  function renderCollectionList() {
    if (!collectionList) return;
    collectionList.innerHTML = remoteState.collections
      .map((collection) => `<a href="./collection.html?collection=${collection.id}" data-collection-link="${collection.id}">${collection.name}</a>`)
      .join("");

    collectionList.querySelectorAll("[data-collection-link]").forEach((link) => {
      link.addEventListener("click", () => {
        writeActiveCollection(link.dataset.collectionLink || "");
      });
    });
  }

  function renderGalleryPhotos() {
    galleryGrid.innerHTML = "";
    const defaultIds = new Set(DEFAULT_PHOTOS.map((photo) => photo.id));
    (remoteState.photos || []).forEach((photo) => {
      const isFallback = defaultIds.has(photo.id);
      const card = createGalleryCard(photo, remoteState.collections, { isFallback });
      galleryGrid.append(card);
      attachSelectionHandler(card);

      const deleteButton = card.querySelector(".js-delete-photo");
      const addToPromptButton = card.querySelector(".js-add-to-prompt");
      if (deleteButton) {
        deleteButton.addEventListener("click", async (event) => {
          event.stopPropagation();
          deleteButton.disabled = true;
          try {
            const result = await deleteJson("./api/photos", { id: photo.id });
            remoteState = result.state;
            renderCollectionOptions();
            renderCollectionList();
            renderGalleryPhotos();
            renderSelection();
            refreshGalleryStatus("Photo removed from your gallery.");
          } catch (error) {
            console.error("Delete failed:", error);
            refreshGalleryStatus(error.message || "Photo could not be deleted.");
            deleteButton.disabled = false;
          }
        });
      }

      if (addToPromptButton) {
        addToPromptButton.addEventListener("click", (event) => {
          event.stopPropagation();
          const alreadySelected = selection.includes(photo.id);
          selection = alreadySelected
            ? selection.filter((id) => id !== photo.id)
            : [...selection, photo.id];
          renderSelection();
          refreshGalleryStatus(
            alreadySelected
              ? `${photo.title} removed from the current prompt selection.`
              : `${photo.title} added to the current prompt selection.`
          );
          addToPromptButton.textContent = alreadySelected ? "Add to Prompt" : "Added to Prompt";
        });
      }
    });
  }

  async function syncRemoteState(options = {}) {
    try {
      remoteState = await fetchGalleryState();
      renderCollectionOptions();
      renderCollectionList();
      renderGalleryPhotos();
      renderSelection();
      if (options.successMessage) {
        refreshGalleryStatus(options.successMessage);
      }
    } catch (error) {
      console.error("Could not sync remote state:", error);
      if (options.failureMessage) {
        refreshGalleryStatus(options.failureMessage);
      }
    }
  }

  items.forEach(attachSelectionHandler);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderFilter(button.dataset.filter || "all");
    });
  });

  promptLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      normalizeSelection();
      if (selection.length === 0) {
        event.preventDefault();
        if (summary) {
          summary.textContent = "Select at least one image before opening Prompt Studio.";
        }
      }
    });
  });

  document.querySelectorAll(".js-open-upload").forEach((button) => {
    button.addEventListener("click", () => openModal(uploadModal));
  });

  document.querySelectorAll(".js-open-collection-modal").forEach((button) => {
    button.addEventListener("click", () => openModal(collectionModal));
  });

  document.querySelectorAll(".js-close-modal").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(uploadModal);
      closeModal(collectionModal);
    });
  });

  if (collectionForm) {
    collectionForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nameInput = collectionForm.querySelector(".js-collection-name");
      const descriptionInput = collectionForm.querySelector(".js-collection-description");
      const tagsInput = collectionForm.querySelector(".js-collection-tags");
      const status = collectionForm.querySelector(".js-collection-status");
      const name = nameInput.value.trim();

      if (!name) {
        status.textContent = "Collection name is required.";
        return;
      }

      status.textContent = "Creating collection...";

      try {
        const result = await postJson("./api/collections", {
          name,
          description: descriptionInput.value.trim(),
          tags: normalizeTagList(tagsInput.value)
        });
        remoteState = result.state;
        renderCollectionOptions();
        renderCollectionList();
        renderGalleryPhotos();
        writeActiveCollection(result.collection.id);
        if (uploadCollection) {
          uploadCollection.value = result.collection.id;
        }
        refreshGalleryStatus(`${result.collection.name} created and ready for uploads.`);
        status.textContent = "Collection created.";
        collectionForm.reset();
        closeModal(collectionModal);
      } catch (error) {
        console.error("Collection creation failed:", error);
        status.textContent = error.message || "Collection could not be created.";
        refreshGalleryStatus("Collection creation did not finish. Please try again.");
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = uploadForm.querySelector('input[type="file"]');
      const titleInput = uploadForm.querySelector(".js-upload-title");
      const noteInput = uploadForm.querySelector(".js-upload-note");
      const tagsInput = uploadForm.querySelector(".js-upload-tags");
      const collectionSelect = uploadForm.querySelector(".js-upload-collection");
      const status = uploadForm.querySelector(".js-upload-status");
      const files = Array.from(fileInput.files || []);

      if (!files.length) {
        status.textContent = "Please choose at least one image file.";
        return;
      }

      const tags = normalizeTagList(tagsInput.value);
      const collectionId = collectionSelect.value || remoteState.collections[0]?.id || "";
      if (!collectionId) {
        status.textContent = "Please create a collection first.";
        return;
      }

      status.textContent = "Uploading to Blob...";
      refreshGalleryStatus("Uploading references to permanent storage...");

      try {
        const savedPhotos = [];
        for (const [index, file] of files.entries()) {
          const title = titleInput.value.trim()
            ? files.length > 1
              ? `${titleInput.value.trim()} ${index + 1}`
              : titleInput.value.trim()
            : file.name.replace(/\.[^.]+$/, "");
          const dataUrl = await compressImageFile(file);

          const uploadResult = await postJson("./api/uploads", {
            title,
            note: noteInput.value.trim() || "Uploaded personal reference.",
            collectionId,
            tags: tags.length ? tags : ["uploaded", "personal-reference"],
            filename: file.name,
            dataUrl
          });

          const photoResult = await postJson("./api/photos", {
            title,
            note: noteInput.value.trim() || "Uploaded personal reference.",
            collectionId,
            tags: tags.length ? tags : ["uploaded", "personal-reference"],
            image: uploadResult.url
          });

          savedPhotos.push(photoResult.photo);
        }

        writeActiveCollection(collectionId);
        remoteState = await fetchGalleryState();
        closeModal(uploadModal);
        uploadForm.reset();
        status.textContent = "Upload complete.";
        renderCollectionOptions();
        renderCollectionList();
        renderGalleryPhotos();
        renderSelection();
        renderFilter(document.querySelector("[data-filter].active")?.dataset.filter || "all");
        refreshGalleryStatus(`${savedPhotos.length} photo${savedPhotos.length > 1 ? "s" : ""} added to your gallery.`);
      } catch (error) {
        console.error("Upload failed:", error);
        status.textContent = error.message || "Something went wrong while saving the upload.";
        refreshGalleryStatus("Upload did not finish. Please check Blob setup and try again.");
      }
    });
  }

  renderCollectionOptions();
  renderCollectionList();
  renderGalleryPhotos();
  renderFilter("all");
  renderSelection();
  syncRemoteState({
    failureMessage: "Gallery loaded with local fallback content. Connect Blob storage to persist uploads."
  });
}

function setupPromptStudio() {
  const promptStudioRoot = document.querySelector(".js-selection-helper") || document.querySelector(".js-generate-prompt");
  if (!promptStudioRoot) return;
  const countTarget = document.querySelector(".js-selected-count");

  let selection = readSelection();
  const helper = document.querySelector(".js-selection-helper");
  const label = document.querySelector(".js-selection-label");
  const cards = Array.from(document.querySelectorAll(".selection-card"));
  const refreshButton = document.querySelector(".js-refresh-selection");
  const toggles = document.querySelectorAll("[data-target]");
  const directionInput = document.querySelector(".js-creative-direction");
  const generateButton = document.querySelector(".js-generate-prompt");
  const generateStatus = document.querySelector(".js-generate-status");
  const styleSummaryText = document.querySelector(".js-style-summary-text");
  const hashtagBank = document.querySelector(".js-tag-bank");
  const lovartPromptText = document.querySelector(".js-lovart-prompt-text");
  const enhanceButton = document.querySelector(".js-enhance-image");
  const enhanceStatus = document.querySelector(".js-enhance-status");
  const enhanceSourceFrame = document.querySelector(".js-enhance-source-frame");
  const enhanceResultFrame = document.querySelector(".js-enhance-result-frame");
  const enhanceSourceMeta = document.querySelector(".js-enhance-source-meta");
  const enhanceResultMeta = document.querySelector(".js-enhance-result-meta");
  const enhanceSourceLabel = document.querySelector(".js-enhance-source-label");
  const enhanceUploadInput = document.querySelector(".js-enhance-upload-input");
  let promptStudioState = buildFallbackState();
  let enhancementSource = null;

  function normalizeSelection() {
    const validIds = new Set((promptStudioState.photos || []).map((photo) => photo.id));
    selection = selection.filter((id) => validIds.has(id));
  }

  function setGenerateStatus(message) {
    if (generateStatus) {
      generateStatus.textContent = message;
    }
  }

  function setEnhanceStatus(message) {
    if (enhanceStatus) {
      enhanceStatus.textContent = message;
    }
  }

  function getSelectedPhotos() {
    normalizeSelection();
    const selectedSet = new Set(selection);
    const selectedPhotos = (promptStudioState.photos || []).filter((photo) => selectedSet.has(photo.id));
    return selection
      .map((id) => selectedPhotos.find((photo) => photo.id === id))
      .filter(Boolean);
  }

  function getExplicitSelectedPhotos() {
    normalizeSelection();
    const selectedSet = new Set(selection);
    return selection
      .map((id) => (promptStudioState.photos || []).find((photo) => selectedSet.has(photo.id) && photo.id === id))
      .filter(Boolean);
  }

  function renderSelection() {
    const selectedPhotos = getSelectedPhotos();
    const count = selectedPhotos.length;
    const selectedCount = selection.length;
    if (countTarget) {
      countTarget.textContent = formatCount(count);
    }
    if (helper) {
      helper.textContent =
        selectedCount > 0
          ? `${selectedCount} references were carried over from Gallery selection.`
          : "No explicit selection is active. Select images in Gallery to build the current prompt set.";
    }
    if (label) {
      label.textContent = selectedCount > 0 ? "Gallery selection synced" : "No active selection";
    }
    cards.forEach((card, index) => {
      const photo = selectedPhotos[index];
      const active = Boolean(photo);
      card.dataset.photoId = active ? photo?.id || "" : "";
      card.classList.toggle("is-active", active);
      card.classList.toggle("is-muted", !active);
      card.classList.toggle("is-empty", !active);
      if (photo?.image) {
        card.style.backgroundImage = `url("${getProxiedImageUrl(photo.image)}")`;
        card.title = active
          ? "Click to remove this reference from the current selection."
          : "Preview only. Select images in Gallery to make them active references.";
        card.style.cursor = "pointer";
      } else {
        card.style.backgroundImage = "none";
        card.title = "Add references from Gallery to build the current prompt set.";
        card.style.cursor = "default";
      }
    });
  }

  function renderEnhancementSource(source) {
    if (enhanceSourceLabel) {
      enhanceSourceLabel.textContent = source ? source.title : "Upload source image";
    }
    if (enhanceSourceFrame) {
      enhanceSourceFrame.innerHTML = source?.image
        ? `<img src="${source.image}" alt="${source.title}" loading="lazy" />`
        : `<div class="enhance-empty">Upload a source image to preview it here before running image enhancement.</div>`;
    }
    if (enhanceSourceMeta) {
      enhanceSourceMeta.textContent = source
        ? `${source.title} is ready as the source image for enhancement.`
        : "Upload any image you want to refine with the current Lovart prompt.";
    }
  }

  function renderEnhancementResult(imageUrl, promptText, revisedPrompt = "") {
    if (!enhanceResultFrame) return;
    if (!imageUrl) {
      enhanceResultFrame.innerHTML = `<div class="enhance-empty">Generate or refine your prompt, then enhance the uploaded source image to preview the result here.</div>`;
      if (enhanceResultMeta) {
        enhanceResultMeta.textContent = "The result is generated with OpenAI image editing and stored in Blob for preview.";
      }
      return;
    }

    const proxiedResultUrl = getProxiedImageUrl(imageUrl);
    enhanceResultFrame.innerHTML = `
      <a class="enhance-download" href="${proxiedResultUrl}" download="galleryart-enhanced-result.png" aria-label="Download enhanced result" title="Download enhanced result">↓</a>
      <img src="${proxiedResultUrl}" alt="Enhanced prompt result" loading="lazy" />
    `;
    if (enhanceResultMeta) {
      enhanceResultMeta.textContent = revisedPrompt
        ? `Enhanced with OpenAI. Revised prompt: ${revisedPrompt}`
        : `Enhanced with the current Lovart prompt: ${promptText.slice(0, 120)}${promptText.length > 120 ? "..." : ""}`;
    }
  }

  function updateToggleState(button, target) {
    const collapsed = target.classList.contains("is-collapsed");
    button.textContent = collapsed ? "Expand" : "Collapse";
    if (target.dataset.collapsible === "lovart-prompt") {
      button.textContent = collapsed ? "Expand Prompt" : "Collapse Prompt";
    }
  }

  toggles.forEach((button) => {
    const target = document.querySelector(`[data-collapsible="${button.dataset.target}"]`);
    if (!target) return;
    updateToggleState(button, target);
    button.addEventListener("click", () => {
      target.classList.toggle("is-collapsed");
      updateToggleState(button, target);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const cardPhotoId = card.dataset.photoId || "";
      if (!cardPhotoId) return;

      if (!selection.length) {
        selection = getSelectedPhotos()
          .map((photo) => photo?.id)
          .filter(Boolean);
      }

      if (!selection.includes(cardPhotoId)) {
        return;
      }

      selection = selection.filter((id) => id !== cardPhotoId);
      writeSelection(selection);
      renderSelection();
      setGenerateStatus(
        selection.length
          ? `${selection.length} reference${selection.length === 1 ? "" : "s"} still selected for prompt generation.`
          : "All references were cleared. Select new images in Gallery or keep the fallback set."
      );
      setEnhanceStatus(
        selection.length
          ? "Prompt references updated. Your uploaded source image is kept for enhancement."
          : "Prompt references were cleared. Upload a source image and generate a prompt when ready."
      );
    });
  });

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      const previousSelection = [...selection];
      const previousSelectedPhotos = getSelectedPhotos().map((photo) => photo.id);
      const originalLabel = refreshButton.textContent;
      refreshButton.disabled = true;
      refreshButton.textContent = "Refreshing...";
      setGenerateStatus("Refreshing selected references from Gallery...");
      selection = readSelection();
      try {
        promptStudioState = await fetchGalleryState();
      } catch (error) {
        console.error("Could not refresh prompt studio state:", error);
        setGenerateStatus("Could not refresh selection. Using the latest saved state.");
        refreshButton.disabled = false;
        refreshButton.textContent = originalLabel;
        renderSelection();
        return;
      }
      renderSelection();
      const nextSelectedPhotos = getSelectedPhotos().map((photo) => photo.id);
      const selectionChanged =
        previousSelection.join("|") !== selection.join("|") ||
        previousSelectedPhotos.join("|") !== nextSelectedPhotos.join("|");

      setGenerateStatus(
        selectionChanged
          ? `Selection refreshed. ${selection.length || nextSelectedPhotos.length || 0} reference${(selection.length || nextSelectedPhotos.length || 0) === 1 ? "" : "s"} synced from Gallery.`
          : "Selection is already up to date."
      );
      refreshButton.disabled = false;
      refreshButton.textContent = originalLabel;
    });
  }

  if (generateButton) {
    generateButton.addEventListener("click", async () => {
      generateButton.disabled = true;
      setGenerateStatus("Generating prompt with OpenAI...");
      try {
        const result = await postJson("./api/generate-prompt", {
          selectedIds: selection,
          creativeDirection: directionInput ? directionInput.value : ""
        });

        if (styleSummaryText) {
          styleSummaryText.textContent = result.styleSummary || "No style summary returned.";
        }
        if (hashtagBank) {
          hashtagBank.innerHTML = (result.hashtags || [])
            .map((tag) => `<span class="tag">${tag.startsWith("#") ? tag : `#${tag}`}</span>`)
            .join("");
        }
        if (lovartPromptText) {
          lovartPromptText.textContent = result.lovartPrompt || "No prompt returned.";
        }
        if (countTarget && result.selectedCount) {
          countTarget.textContent = formatCount(result.selectedCount);
        }
        setGenerateStatus("Prompt generated with OpenAI.");
      } catch (error) {
        console.error("Prompt generation failed:", error);
        setGenerateStatus(error.message || "Prompt generation failed.");
      } finally {
        generateButton.disabled = false;
      }
    });
  }

  if (enhanceSourceFrame && enhanceUploadInput) {
    enhanceSourceFrame.addEventListener("click", () => {
      enhanceUploadInput.click();
    });

    enhanceSourceFrame.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enhanceUploadInput.click();
      }
    });

    enhanceUploadInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      enhanceSourceFrame.style.pointerEvents = "none";
      setEnhanceStatus("Preparing source image...");

      try {
        const dataUrl = await compressImageFile(file);
        enhancementSource = {
          title: file.name.replace(/\.[^.]+$/, "") || "Uploaded source image",
          image: dataUrl,
          dataUrl
        };
        renderEnhancementSource(enhancementSource);
        setEnhanceStatus("Source image ready. Enhance it with the current prompt when you are ready.");
      } catch (error) {
        console.error("Source image upload failed:", error);
        setEnhanceStatus(error.message || "Could not prepare the source image.");
      } finally {
        enhanceSourceFrame.style.pointerEvents = "";
        enhanceUploadInput.value = "";
      }
    });
  }

  if (enhanceButton) {
    enhanceButton.addEventListener("click", async () => {
      const promptText = String(lovartPromptText?.textContent || "").trim();

      if (!enhancementSource?.dataUrl) {
        setEnhanceStatus("Upload a source image before enhancing.");
        return;
      }

      if (!promptText) {
        setEnhanceStatus("Generate or provide a Lovart prompt before enhancing an image.");
        return;
      }

      enhanceButton.disabled = true;
      setEnhanceStatus("Enhancing the uploaded source image with OpenAI...");

      try {
        const result = await postJson("./api/edit-image", {
          sourceImageDataUrl: enhancementSource.dataUrl,
          prompt: promptText,
          title: enhancementSource.title
        });

        renderEnhancementResult(result.imageUrl, promptText, result.revisedPrompt || "");
        setEnhanceStatus("Enhanced image ready. Review the side-by-side preview.");
      } catch (error) {
        console.error("Image enhancement failed:", error);
        setEnhanceStatus(error.message || "Image enhancement failed.");
      } finally {
        enhanceButton.disabled = false;
      }
    });
  }

  fetchGalleryState()
    .then((state) => {
      promptStudioState = state;
      renderSelection();
      renderEnhancementSource(null);
      renderEnhancementResult("", "");
    })
    .catch((error) => {
      console.error("Could not load prompt studio state:", error);
      renderSelection();
      renderEnhancementSource(null);
      renderEnhancementResult("", "");
      setGenerateStatus("Using fallback references until gallery data loads.");
    });
}

function setupArchive() {
  const toggles = document.querySelectorAll(".js-entry-toggle");
  if (!toggles.length) return;

  toggles.forEach((button) => {
    const target = document.getElementById(button.dataset.target || "");
    if (!target) return;
    const entry = button.closest(".entry");
    button.addEventListener("click", () => {
      const visible = target.classList.toggle("is-visible");
      if (entry) {
        entry.classList.toggle("is-expanded", visible);
      }
      button.textContent = visible ? "Collapse Entry" : "Expand Entry";
    });
  });
}

async function setupCollectionPage() {
  const nameNode = document.querySelector(".js-collection-name");
  if (!nameNode) return;

  const descriptionNode = document.querySelector(".js-collection-description");
  const countNode = document.querySelector(".js-collection-count");
  const updatedNode = document.querySelector(".js-collection-updated");
  const moodNode = document.querySelector(".js-collection-mood");
  const tagsNode = document.querySelector(".js-collection-tags");
  const gridNode = document.querySelector(".js-collection-grid");
  const switcherNode = document.querySelector(".js-collection-switcher");
  const coverNode = document.querySelector(".js-collection-cover");
  const params = new URLSearchParams(window.location.search);
  const loadingClass = "is-collection-loading";

  let state = buildFallbackState();
  try {
    state = await fetchGalleryState();
  } catch (error) {
    console.error("Could not load remote collection state:", error);
  }

  const selectedId = params.get("collection") || readActiveCollection();
  const collection = state.collections.find((item) => item.id === selectedId) || state.collections[0];
  if (!collection) {
    document.body.classList.remove(loadingClass);
    return;
  }

  writeActiveCollection(collection.id);
  nameNode.textContent = collection.name;
  if (descriptionNode) {
    descriptionNode.textContent = collection.description || "A personal collection of visual references.";
  }

  const collectionPhotos = (state.photos || []).filter((photo) => photo.collectionId === collection.id);
  if (countNode) {
    countNode.textContent = `${collectionPhotos.length} references`;
  }
  if (updatedNode) {
    updatedNode.textContent = `Updated ${collection.updatedAt || "Recently"}`;
  }
  if (moodNode) {
    moodNode.textContent = `Mood: ${(collection.tags || ["curated", "editorial", "quiet"]).slice(0, 3).join(" / ")}`;
  }
  if (tagsNode) {
    tagsNode.innerHTML = (collection.tags || ["curated", "quiet", "editorial"])
      .map((tag) => `<span class="tag">#${tag}</span>`)
      .join("");
  }
  if (switcherNode) {
    switcherNode.innerHTML = state.collections
      .map((item) => `
        <a class="switch-chip ${item.id === collection.id ? "current" : ""}" href="./collection.html?collection=${item.id}">
          ${item.name}
        </a>
      `)
      .join("");
  }
  if (coverNode && collectionPhotos[0]?.image) {
    coverNode.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(24,21,18,0.18)), url("${getProxiedImageUrl(collectionPhotos[0].image)}")`;
  }
  if (gridNode) {
    if (!collectionPhotos.length) {
      gridNode.innerHTML = `
        <div class="empty-state">
          This collection is still empty. Add uploaded photos from Gallery and they will appear here automatically.
        </div>
      `;
    } else {
      gridNode.innerHTML = collectionPhotos
        .map((photo) => {
          const imageUrl = String(photo.image || "").trim();
          const proxiedImageUrl = getProxiedImageUrl(imageUrl);
          return `
          <article class="item">
            <div class="shot">
              ${imageUrl
                ? `<img class="shot-image" src="${proxiedImageUrl}" alt="${photo.title}" loading="lazy" />
                   <a class="image-link image-link-collection" href="${proxiedImageUrl}" target="_blank" rel="noreferrer">Open image</a>`
                : `<div class="image-empty">Image URL missing</div>`}
            </div>
            <h4>${photo.title}</h4>
            <p>${photo.note || "Uploaded personal reference."}</p>
          </article>
        `;
        })
        .join("");
    }
  }

  document.body.classList.remove(loadingClass);
}

setupGallery();
setupPromptStudio();
setupArchive();
setupCollectionPage();
