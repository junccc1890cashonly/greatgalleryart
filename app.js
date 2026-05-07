const STORAGE_KEY = "galleryArtSelection";
const PHOTO_STORAGE_KEY = "galleryArtPhotos";
const COLLECTION_STORAGE_KEY = "galleryArtCollections";
const SESSION_UPLOAD_STORAGE_KEY = "galleryArtSessionUploads";

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

const DEFAULT_PHOTOS = [
  {
    id: "quiet-figure",
    title: "Quiet Figure",
    note: "柔和人物姿态与较大的呼吸区，适合提炼 editorial 人像方向。",
    collectionId: "quiet-luxury",
    tags: ["portrait", "editorial", "quietluxury", "softlight"],
    image: ""
  },
  {
    id: "textural-living",
    title: "Textural Living",
    note: "带材质层次的室内生活图像，适合生成空间与品牌氛围 prompt。",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "quietluxury"],
    image: ""
  },
  {
    id: "curated-room",
    title: "Curated Room",
    note: "安静、克制、结构感强的空间构图，强调留白与柔和质地。",
    collectionId: "interior-silence",
    tags: ["interior", "neutral", "negativespace"],
    image: ""
  },
  {
    id: "soft-portrait-notes",
    title: "Soft Portrait Notes",
    note: "轻柔色阶与时尚感人物构图，适合人像类 prompt 的审美参考。",
    collectionId: "soft-portrait-notes",
    tags: ["portrait", "editorial", "fashion"],
    image: ""
  },
  {
    id: "slow-detail",
    title: "Slow Detail",
    note: "偏生活化的特写与局部构图，适合更安静的品牌内容表达。",
    collectionId: "muted-objects",
    tags: ["neutral", "detail", "lifestyle"],
    image: ""
  },
  {
    id: "quiet-window-light",
    title: "Quiet Window Light",
    note: "以光感和留白为主的画面，适合生成 calm atmosphere 方向的 prompt。",
    collectionId: "quiet-luxury",
    tags: ["quietluxury", "light", "neutral"],
    image: ""
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

function readData(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readSessionUploads() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_UPLOAD_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSessionUploads(value) {
  sessionStorage.setItem(SESSION_UPLOAD_STORAGE_KEY, JSON.stringify(value));
}

function ensureCollections() {
  const existing = readData(COLLECTION_STORAGE_KEY, []);
  if (!existing.length) {
    writeData(COLLECTION_STORAGE_KEY, DEFAULT_COLLECTIONS);
    return DEFAULT_COLLECTIONS;
  }
  return existing;
}

function ensurePhotos() {
  const existing = readData(PHOTO_STORAGE_KEY, []);
  if (!existing.length) {
    writeData(PHOTO_STORAGE_KEY, DEFAULT_PHOTOS);
    return DEFAULT_PHOTOS;
  }
  return existing;
}

function getCollectionName(collections, collectionId) {
  const found = collections.find((collection) => collection.id === collectionId);
  return found ? found.name : "Unsorted Collection";
}

function formatCount(count) {
  return String(count).padStart(2, "0");
}

function setupGallery() {
  const items = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
  if (!items.length) return;

  let collections = ensureCollections();
  let savedPhotos = ensurePhotos();
  let sessionUploads = readSessionUploads();
  const countTargets = document.querySelectorAll(".js-selected-count");
  const summary = document.querySelector(".js-selection-summary");
  const promptLinks = document.querySelectorAll(".js-open-prompt");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const collectionList = document.querySelector(".js-collection-list");
  const galleryGrid = document.querySelector(".gallery-grid");
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

  function createUserPhotoCard(photo) {
    const card = document.createElement("article");
    card.className = "gallery-item is-user-photo";
    card.dataset.photoId = photo.id;
    card.dataset.tags = photo.tags.join(" ");
    const collectionName = getCollectionName(collections, photo.collectionId);
    card.innerHTML = `
      <div class="gallery-cover" style="background-image:url('${photo.image}')"></div>
      <h4>${photo.title}</h4>
      <p>${photo.note || "Uploaded personal reference."}</p>
      <div class="meta">Saved just now · Collection ${collectionName}</div>
      <div class="item-tags">${photo.tags.map((tag) => `<span class="tag">#${tag}</span>`).join("")}</div>
    `;
    attachSelectionHandler(card);
    if (uploadedGrid) {
      uploadedGrid.prepend(card);
    } else {
      galleryGrid.prepend(card);
    }
    return card;
  }

  function renderUploadedVisibility() {
    if (!uploadedSection || !uploadedCount) return;
    const count = uploadedGrid ? uploadedGrid.children.length : 0;
    uploadedSection.classList.toggle("is-visible", count > 0);
    uploadedCount.textContent = `${count} upload${count === 1 ? "" : "s"} in this browser session`;
  }

  function refreshGalleryStatus(message) {
    if (galleryStatus) {
      galleryStatus.textContent = message;
    }
  }

  function renderSessionUploads() {
    sessionUploads.forEach((photo) => {
      if (!document.querySelector(`[data-photo-id="${photo.id}"]`)) {
        createUserPhotoCard(photo);
      }
    });
    renderUploadedVisibility();
  }

  function renderCollectionOptions() {
    if (!uploadCollection) return;
    uploadCollection.innerHTML = collections
      .map((collection) => `<option value="${collection.id}">${collection.name}</option>`)
      .join("");
  }

  function renderCollectionList() {
    if (!collectionList) return;
    collectionList.innerHTML = collections
      .map((collection) => `<a href="./collection.html?collection=${collection.id}">${collection.name}</a>`)
      .join("");
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

  function attachSelectionHandler(item) {
    item.addEventListener("click", () => {
      const id = item.dataset.photoId;
      if (!id) return;
      selection = selection.includes(id)
        ? selection.filter((value) => value !== id)
        : [...selection, id];
      renderSelection();
    });
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
    collectionForm.addEventListener("submit", (event) => {
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
      const collection = {
        id: `collection-${Date.now()}`,
        name,
        description: descriptionInput.value.trim(),
        tags: tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean),
        updatedAt: "Just now"
      };
      collections = [collection, ...collections];
      writeData(COLLECTION_STORAGE_KEY, collections);
      renderCollectionOptions();
      renderCollectionList();
      refreshGalleryStatus(`${name} created and ready for uploads.`);
      status.textContent = "Collection created.";
      collectionForm.reset();
      closeModal(collectionModal);
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", (event) => {
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

      const baseTags = tagsInput.value
        .split(",")
        .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean);

      Promise.all(
        files.map((file, index) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onerror = () => {
            resolve(null);
          };
          reader.onload = () => {
            const title = titleInput.value.trim()
              ? `${titleInput.value.trim()} ${index + 1}`
              : file.name.replace(/\.[^.]+$/, "");
            resolve({
              id: `upload-${Date.now()}-${index}`,
              title,
              note: noteInput.value.trim() || "Uploaded personal reference.",
              collectionId: collectionSelect.value,
              tags: baseTags.length ? baseTags : ["uploaded", "personal-reference"],
              image: reader.result
            });
          };
          reader.readAsDataURL(file);
        }))
      ).then((photos) => {
        const successfulPhotos = photos.filter(Boolean);
        if (!successfulPhotos.length) {
          status.textContent = "Images could not be read. Please try a different file.";
          return;
        }

        const lightweightPhotos = successfulPhotos.map((photo) => ({
          id: photo.id,
          title: photo.title,
          note: photo.note,
          collectionId: photo.collectionId,
          tags: photo.tags,
          image: ""
        }));

        savedPhotos = [...lightweightPhotos, ...savedPhotos];
        sessionUploads = [...successfulPhotos, ...sessionUploads];

        try {
          writeData(PHOTO_STORAGE_KEY, savedPhotos);
          writeSessionUploads(sessionUploads);
        } catch (error) {
          console.error("Upload persistence failed:", error);
          successfulPhotos.slice().reverse().forEach((photo) => createUserPhotoCard(photo));
          renderUploadedVisibility();
          renderSelection();
          renderFilter(document.querySelector("[data-filter].active")?.dataset.filter || "all");
          closeModal(uploadModal);
          uploadForm.reset();
          status.textContent = "Saved for this page view only. Browser storage limit was reached.";
          refreshGalleryStatus("Upload previewed, but it could not be stored permanently in this browser.");
          return;
        }

        successfulPhotos.slice().reverse().forEach((photo) => createUserPhotoCard(photo));
        renderUploadedVisibility();
        renderSelection();
        renderFilter(document.querySelector("[data-filter].active")?.dataset.filter || "all");
        refreshGalleryStatus(`${successfulPhotos.length} photo${successfulPhotos.length > 1 ? "s" : ""} added to your gallery.`);
        closeModal(uploadModal);
        uploadForm.reset();
        status.textContent = "Upload complete.";
      }).catch((error) => {
        console.error("Upload failed:", error);
        status.textContent = "Something went wrong while saving the upload.";
        refreshGalleryStatus("Upload did not finish. Please try again.");
      });
    });
  }

  renderCollectionOptions();
  renderCollectionList();
  renderSessionUploads();

  renderFilter("all");
  renderSelection();
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

function setupCollectionPage() {
  const nameNode = document.querySelector(".js-collection-name");
  if (!nameNode) return;

  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get("collection");
  const collections = ensureCollections();
  const photos = [...readSessionUploads(), ...ensurePhotos()];
  const collection = collections.find((item) => item.id === selectedId) || collections[0];
  if (!collection) return;

  const descriptionNode = document.querySelector(".js-collection-description");
  const countNode = document.querySelector(".js-collection-count");
  const updatedNode = document.querySelector(".js-collection-updated");
  const moodNode = document.querySelector(".js-collection-mood");
  const tagsNode = document.querySelector(".js-collection-tags");
  const gridNode = document.querySelector(".js-collection-grid");

  nameNode.textContent = collection.name;
  if (descriptionNode) {
    descriptionNode.textContent = collection.description || "A personal collection of visual references.";
  }
  const collectionPhotos = photos.filter((photo) => photo.collectionId === collection.id);
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
  if (gridNode && collectionPhotos.length) {
    gridNode.innerHTML = collectionPhotos
      .map((photo) => {
        const visual = photo.image
          ? `style="background-image:url('${photo.image}')" `
          : "";
        return `
          <article class="item">
            <div class="shot" ${visual}></div>
            <h4>${photo.title}</h4>
            <p>${photo.note}</p>
          </article>
        `;
      })
      .join("");
  }
}

setupGallery();
setupPromptStudio();
setupArchive();
setupCollectionPage();
