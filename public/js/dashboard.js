/* RocketDrop — dashboard tabs, modals and CRUD helpers */
(function () {
  "use strict";

  function parsePayload(el) {
    try {
      return JSON.parse(el.getAttribute("data-payload") || "{}");
    } catch (e) {
      console.error("Invalid data-payload", e);
      return {};
    }
  }

  const tabs = document.querySelectorAll(".dash-tabs [data-tab]");
  const panels = document.querySelectorAll(".panel");

  function activateTab(name, updateQuery) {
    let found = false;
    panels.forEach((p) => {
      const match = p.id === name;
      p.classList.toggle("active", match);
      if (match) found = true;
    });
    if (!found && panels.length) {
      panels[0].classList.add("active");
      name = panels[0].id;
    }
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    if (updateQuery) {
      const url = new URL(location.href);
      url.searchParams.set("tab", name);
      url.hash = "";
      history.replaceState(null, "", url.pathname + url.search);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab, true));
  });

  document.querySelectorAll("[data-tab-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab(link.dataset.tabLink, true);
    });
  });

  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || (location.hash || "#orders").slice(1) || "orders";
  activateTab(initialTab, false);

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.openModal);
      if (modal && typeof modal.showModal === "function") modal.showModal();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dialog = btn.closest("dialog");
      if (dialog) dialog.close();
    });
  });

  document.querySelectorAll("dialog.modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
  });

  function openEditModal(modalId, formId, id, fill) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    if (!modal || !form) return;
    form.action = form.dataset.actionTemplate.replace("{id}", id);
    fill(form);
    modal.showModal();
  }

  document.querySelectorAll("[data-edit-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("editCategoryModal", "editCategoryForm", data.id, (form) => {
        form.elements.name.value = data.name || "";
        form.elements.description.value = data.description || "";
        form.elements.image.value = data.image || "";
      });
    });
  });

  document.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("editProductModal", "editProductForm", data.id, (form) => {
        form.elements.name.value = data.name || "";
        form.elements.price.value = data.price || "";
        form.elements.categoryId.value = data.categoryId || "";
        form.elements.image.value = data.image || "";
        form.elements.description.value = data.description || "";
      });
    });
  });

  document.querySelectorAll("[data-edit-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("editOrderModal", "editOrderForm", data.id, (form) => {
        form.elements.quantity.value = data.quantity || 1;
        form.elements.address.value = data.address || "";
      });
    });
  });

  document.querySelectorAll("[data-approve-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("approveOrderModal", "approveOrderForm", data.id, () => {
        const label = document.getElementById("approveOrderItem");
        if (label) label.textContent = `#${data.id} · ${data.item || ""}`;
      });
    });
  });

  document.querySelectorAll("[data-reject-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("rejectOrderModal", "rejectOrderForm", data.id, () => {
        const label = document.getElementById("rejectOrderItem");
        if (label) label.textContent = `#${data.id} · ${data.item || ""}`;
      });
    });
  });

  document.querySelectorAll("[data-reject-partner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = parsePayload(btn);
      openEditModal("rejectPartnerModal", "rejectPartnerForm", data.id, () => {
        const label = document.getElementById("rejectPartnerName");
        if (label) label.textContent = data.name || "";
      });
    });
  });
})();
