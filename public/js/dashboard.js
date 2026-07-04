/* RocketDrop — dashboard helpers */
(function () {
  "use strict";

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.openModal);
      if (modal) modal.hidden = false;
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modern-modal");
      if (modal) modal.hidden = true;
    });
  });

  document.querySelectorAll(".modern-modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      const modal = backdrop.closest(".modern-modal");
      if (modal) modal.hidden = true;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modern-modal:not([hidden])").forEach((m) => {
        m.hidden = true;
      });
    }
  });
})();
