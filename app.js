const STORAGE_KEY = "galleryArtSelection";

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

function formatCount(count) {
  return String(count).padStart(2, "0");
}

function setupGallery() {
  const items = Array.from(document.querySelectorAll(".gallery-item[data-photo-id]"));
  if (!items.length) return;

  const countTargets = document.querySelectorAll(".js-selected-count");
  const summary = document.querySelector(".js-selection-summary");
  const promptLinks = document.querySelectorAll(".js-open-prompt");
  const filterButtons = document.querySelectorAll("[data-filter]");
  let selection = readSelection();

  function renderSelection() {
    items.forEach((item) => {
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

    items.forEach((item) => {
      const tags = item.dataset.tags || "";
      const visible = tag === "all" || tags.includes(tag);
      item.classList.toggle("is-hidden", !visible);
    });
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.dataset.photoId;
      if (!id) return;
      selection = selection.includes(id)
        ? selection.filter((value) => value !== id)
        : [...selection, id];
      renderSelection();
    });
  });

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

setupGallery();
setupPromptStudio();
setupArchive();
