/* RocketDrop — shared client-side behaviour */
(function () {
  "use strict";

  // ---------- Mobile nav ----------
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  }

  // ---------- Toasts ----------
  const toastStack = document.getElementById("toastStack");

  function showToast(message, type = "info", title = "") {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = title
      ? `<div><strong></strong><p></p></div>`
      : `<div><p style="color:#fff;"></p></div>`;
    if (title) toast.querySelector("strong").textContent = title;
    toast.querySelector("p").textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 450);
    }, 5200);
  }
  window.showToast = showToast;

  // Server flash message → toast popup
  const flashSeed = document.querySelector(".flash-seed");
  if (flashSeed) {
    showToast(flashSeed.dataset.message, flashSeed.dataset.type || "info");
  }

  // ---------- Confirm dialogs on destructive forms ----------
  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  // ---------- Reveal-on-scroll animations ----------
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // ---------- Order page: live total + mobile money phone toggle ----------
  const qtyInput = document.getElementById("orderQty");
  const totalEl = document.getElementById("orderTotal");
  if (qtyInput && totalEl) {
    const unit = Number(totalEl.dataset.unit || 0);
    const update = () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      totalEl.textContent = "UGX " + (unit * qty).toLocaleString();
    };
    qtyInput.addEventListener("input", update);
  }

  const phoneField = document.getElementById("paymentPhoneField");
  const phoneInput = document.getElementById("paymentPhone");
  const payRadios = document.querySelectorAll('input[name="paymentMethod"][type="radio"]');
  if (phoneField && payRadios.length) {
    const sync = () => {
      const selected = document.querySelector('input[name="paymentMethod"]:checked');
      const isMobileMoney = selected && selected.value !== "cod";
      phoneField.style.display = isMobileMoney ? "" : "none";
      if (phoneInput) phoneInput.required = isMobileMoney;
    };
    payRadios.forEach((r) => r.addEventListener("change", sync));
    sync();
  }

  // ---------- Notification bell: dropdown + live polling ----------
  const bell = document.getElementById("notifBell");
  const dropdown = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifBadge");
  const list = document.getElementById("notifDropdownList");

  const ICONS = { order: "📦", payment: "💰", partner: "🤝", info: "🔔" };

  function renderNotifications(data) {
    if (!list) return;
    if (!data.notifications.length) {
      list.innerHTML = '<p class="notif-empty">No notifications yet.</p>';
      return;
    }
    list.innerHTML = "";
    data.notifications.forEach((n) => {
      const item = document.createElement("div");
      item.className = "notif-dropdown-item" + (n.read ? "" : " unread");
      item.innerHTML = "<span></span><div><h4></h4><p></p><small></small></div>";
      item.querySelector("span").textContent = ICONS[n.type] || ICONS.info;
      item.querySelector("h4").textContent = n.title;
      item.querySelector("p").textContent = n.message;
      item.querySelector("small").textContent = new Date(n.createdAt).toLocaleString();
      list.appendChild(item);
    });
  }

  let lastUnread = badge ? Number(badge.textContent) || 0 : 0;

  async function pollNotifications(popupNew) {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (badge) {
        badge.textContent = data.unread;
        badge.classList.toggle("show", data.unread > 0);
      }
      renderNotifications(data);
      // Pop up a toast when something new arrives (order approvals,
      // delivery man details, payment confirmations, partner decisions).
      if (popupNew && data.unread > lastUnread && data.notifications.length) {
        const newest = data.notifications[0];
        showToast(newest.message, "info", newest.title);
      }
      lastUnread = data.unread;
    } catch (err) {
      /* offline — ignore */
    }
  }

  if (bell && dropdown) {
    bell.addEventListener("click", async (e) => {
      e.stopPropagation();
      const opening = !dropdown.classList.contains("open");
      dropdown.classList.toggle("open");
      if (opening) {
        await pollNotifications(false);
        fetch("/api/notifications/read", { method: "POST" }).then(() => {
          if (badge) {
            badge.textContent = "0";
            badge.classList.remove("show");
          }
          lastUnread = 0;
        });
      }
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
    });

    pollNotifications(false);
    setInterval(() => pollNotifications(true), 12000);
  }
})();
