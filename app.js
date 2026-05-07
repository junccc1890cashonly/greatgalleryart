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
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawError = data?.error;
    const message =
      typeof rawError === "string"
        ? rawError
        : rawError?.message || rawError?.error || `Request failed (${response.status})`;
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
  card.innerHTML = `
    <div class="gallery-cover" style="background-image:url('${photo.image}')"></div>
    <h4>${photo.title}</h4>
    <p>${photo.note || "Uploaded personal reference."}</p>
    <div class="meta">Stored in Blob · Collection ${collectionName}</div>
    <div class="item-tags">${(photo.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join("")}</div>
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
  const items = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
  if (!items.length) return;

  const countTargets = document.querySelectorAll(".js-selected-count");
  const summary = document.querySelector(".js-selection-summary");
  const promptLinks = document.querySelectorAll(".js-open-prompt");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const collectionList = document.querySelector(".js-collection-list");
  const uploadedGrid = document.querySelector(".js-uploaded-grid");
  const uploadedSection = document.querySelector(".js-uploaded-section");
  const uploadedCount = document.querySelector(".js-uploaded-count");
  const uploadModal = document.querySelector(".js-upload-modal");
  const collectionModal = document.querySelector(".js-collection-modal");
  const uploadForm = document.querySelector(".js-upload-form");
  const collectionForm = document.querySelector(".js-collection-form");
  const uploadCollection = document.querySelector(".js-upload-collection");
  const galleryStatus = document.querySelector(".js-gallery-status");

  let selection = readSelection();
  let remoteState = buildFallbackState();

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
    item.addEventListener("click", () => {
      const id = item.dataset.photoId;
      if (!id) return;
      selection = selection.includes(id)
        ? selection.filter((value) => value !== id)
        : [...selection, id];
      renderSelection();
    });
  }

  function renderSelection() {
    const allItems = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
    allItems.forEach((item) => {
      const isSelected = selection.includes(item.dataset.photoId);
      item.classList.toggle("is-selected", isSelected);
    });

    countTargets.forEach((node) => {
      node.textContent = selection.length;
    });

    if (summary) {
      summary.textContent =
        selection.length > 0
          ? `${selection.length} references ready for Prompt Studio.`
          : "Select references to prepare a Lovart prompt set.";
    }

    promptLinks.forEach((link) => {
      const disabled = selection.length === 0;
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

  function renderUploadedVisibility() {
    if (!uploadedSection || !uploadedCount || !uploadedGrid) return;
    const count = uploadedGrid.children.length;
    uploadedSection.classList.toggle("is-visible", count > 0);
    uploadedCount.textContent = `${count} stored upload${count === 1 ? "" : "s"} in your gallery`;
  }

  function renderUploadedPhotos() {
    if (!uploadedGrid) return;
    uploadedGrid.innerHTML = "";
    const defaultIds = new Set(DEFAULT_PHOTOS.map((photo) => photo.id));
    const uploadedPhotos = (remoteState.photos || []).filter((photo) => !defaultIds.has(photo.id));
    uploadedPhotos
      .slice()
      .reverse()
      .forEach((photo) => {
        const card = createUploadedCard(photo, remoteState.collections);
        uploadedGrid.append(card);
        attachSelectionHandler(card);
      });
    renderUploadedVisibility();
  }

  async function syncRemoteState(options = {}) {
    try {
      remoteState = await fetchGalleryState();
      renderCollectionOptions();
      renderCollectionList();
      renderUploadedPhotos();
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
        renderUploadedPhotos();
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
            ? `${titleInput.value.trim()} ${index + 1}`
            : file.name.replace(/\.[^.]+$/, "");
          const dataUrl = await compressImageFile(file);

          const photoResult = await postJson("./api/uploads", {
            title,
            note: noteInput.value.trim() || "Uploaded personal reference.",
            collectionId,
            tags: tags.length ? tags : ["uploaded", "personal-reference"],
            filename: file.name,
            dataUrl
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
        renderUploadedPhotos();
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
  renderUploadedPhotos();
  renderFilter("all");
  renderSelection();
  syncRemoteState({
    failureMessage: "Gallery loaded with local fallback content. Connect Blob storage to persist uploads."
  });
}

function setupPromptStudio() {
  const countTarget = document.querySelector(".js-selected-count");
  if (!countTarget) return;

  let selection = readSelection();
  const helper = document.querySelector(".js-selection-helper");
  const label = document.querySelector(".js-selection-label");
  const cards = Array.from(document.querySelectorAll(".selection-card"));
  const refreshButton = document.querySelector(".js-refresh-selection");
  const toggles = document.querySelectorAll("[data-target]");

  function renderSelection() {
    const count = selection.length || 4;
    countTarget.textContent = formatCount(count);
    if (helper) {
      helper.textContent =
        selection.length > 0
          ? `${selection.length} references were carried over from Gallery selection.`
          : "No saved selection found. Using the current visual set as the default prompt references.";
    }
    if (label) {
      label.textContent =
        selection.length > 0 ? "Gallery selection synced" : "Quiet Luxury / Interior Silence";
    }
    cards.forEach((card, index) => {
      const active = index < count;
      card.classList.toggle("is-active", active);
      card.classList.toggle("is-muted", !active);
    });
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

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      selection = readSelection();
      renderSelection();
    });
  }

  renderSelection();
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

  let state = buildFallbackState();
  try {
    state = await fetchGalleryState();
  } catch (error) {
    console.error("Could not load remote collection state:", error);
  }

  const selectedId = params.get("collection") || readActiveCollection();
  const collection = state.collections.find((item) => item.id === selectedId) || state.collections[0];
  if (!collection) return;

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
    coverNode.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(24,21,18,0.18)), url("${collectionPhotos[0].image}")`;
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
        .map((photo) => `
          <article class="item">
            <div class="shot" style="background-image:url('${photo.image}')"></div>
            <h4>${photo.title}</h4>
            <p>${photo.note || "Uploaded personal reference."}</p>
          </article>
        `)
        .join("");
    }
  }
}

setupGallery();
setupPromptStudio();
setupArchive();
setupCollectionPage();
