/* RocketDrop — dashboard tabs, modals and CRUD helpers */
(function () {
  "use strict";

  // ---------- Tabs ----------
  const tabs = document.querySelectorAll(".dash-tabs [data-tab]");
  const panels = document.querySelectorAll(".panel");

  function activateTab(name, updateHash) {
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
    if (updateHash) history.replaceState(null, "", "#" + name);
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

  activateTab((location.hash || "#orders").slice(1), false);

  // ---------- Modals (native <dialog>) ----------
  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.openModal);
      if (modal) modal.showModal();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  });

  document.querySelectorAll("dialog.modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
  });

  // ---------- Generic edit-modal helpers ----------
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
      openEditModal("editCategoryModal", "editCategoryForm", btn.dataset.id, (form) => {
        form.elements.name.value = btn.dataset.name || "";
        form.elements.description.value = btn.dataset.description || "";
        form.elements.image.value = btn.dataset.image || "";
      });
    });
  });

  document.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditModal("editProductModal", "editProductForm", btn.dataset.id, (form) => {
        form.elements.name.value = btn.dataset.name || "";
        form.elements.price.value = btn.dataset.price || "";
        form.elements.categoryId.value = btn.dataset.categoryId || "";
        form.elements.image.value = btn.dataset.image || "";
        form.elements.description.value = btn.dataset.description || "";
      });
    });
  });

  document.querySelectorAll("[data-edit-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditModal("editOrderModal", "editOrderForm", btn.dataset.id, (form) => {
        form.elements.quantity.value = btn.dataset.quantity || 1;
        form.elements.address.value = btn.dataset.address || "";
      });
    });
  });

  document.querySelectorAll("[data-approve-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditModal("approveOrderModal", "approveOrderForm", btn.dataset.id, () => {
        const label = document.getElementById("approveOrderItem");
        if (label) label.textContent = `#${btn.dataset.id} · ${btn.dataset.item}`;
      });
    });
  });

  document.querySelectorAll("[data-reject-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditModal("rejectOrderModal", "rejectOrderForm", btn.dataset.id, () => {
        const label = document.getElementById("rejectOrderItem");
        if (label) label.textContent = `#${btn.dataset.id} · ${btn.dataset.item}`;
      });
    });
  });

  document.querySelectorAll("[data-reject-partner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditModal("rejectPartnerModal", "rejectPartnerForm", btn.dataset.id, () => {
        const label = document.getElementById("rejectPartnerName");
        if (label) label.textContent = btn.dataset.name || "";
      });
    });
  });
})();
