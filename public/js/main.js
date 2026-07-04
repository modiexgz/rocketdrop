/* RocketDrop — shared client-side behaviour */
(function () {
  "use strict";

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  }

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

  const flashSeed = document.querySelector(".flash-seed");
  if (flashSeed) {
    showToast(flashSeed.dataset.message, flashSeed.dataset.type || "info");
  }

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

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

  const qtyInput = document.getElementById("orderQty");
  const totalEl = document.getElementById("orderTotal");
  if (qtyInput && totalEl) {
    const unit = Number(totalEl.dataset.unit || 0);
    qtyInput.addEventListener("input", () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      totalEl.textContent = "UGX " + (unit * qty).toLocaleString();
    });
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

  // ---------- Search drawer ----------
  const searchDrawer = document.getElementById("searchDrawer");
  const searchInput = document.getElementById("searchDrawerInput");
  const searchResults = document.getElementById("searchDrawerResults");
  const searchBackdrop = document.getElementById("searchBackdrop");
  const searchClose = document.getElementById("searchClose");
  const openers = [
    document.getElementById("searchTrigger"),
    document.getElementById("searchFab"),
    document.getElementById("heroSearchBtn"),
    document.getElementById("productsSearchBtn"),
    document.getElementById("emptySearchBtn")
  ].filter(Boolean);

  let searchTimer = null;

  function openSearch(prefill) {
    if (!searchDrawer) return;
    searchDrawer.classList.add("open");
    searchDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("search-open");
    if (searchInput) {
      if (prefill) searchInput.value = prefill;
      searchInput.focus();
      runSearch(searchInput.value);
    }
  }

  function closeSearch() {
    if (!searchDrawer) return;
    searchDrawer.classList.remove("open");
    searchDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("search-open");
  }

  async function runSearch(q) {
    if (!searchResults) return;
    searchResults.innerHTML = '<p class="search-hint">Searching…</p>';
    try {
      const res = await fetch("/api/search?q=" + encodeURIComponent(q || ""));
      const data = await res.json();
      if (!data.results.length) {
        searchResults.innerHTML = '<p class="search-hint">No products found. Try another keyword.</p>';
        return;
      }
      searchResults.innerHTML = "";
      data.results.forEach((item) => {
        const row = document.createElement("a");
        row.className = "search-result-item";
        row.href = item.url;
        row.innerHTML = `
          <img src="${item.image}" alt="" />
          <div>
            <strong>${item.name}</strong>
            <span>${item.category}</span>
            <em>UGX ${Number(item.price).toLocaleString()}</em>
          </div>`;
        searchResults.appendChild(row);
      });
    } catch (err) {
      searchResults.innerHTML = '<p class="search-hint">Search unavailable. Please try again.</p>';
    }
  }

  openers.forEach((btn) => btn.addEventListener("click", () => openSearch("")));
  if (searchBackdrop) searchBackdrop.addEventListener("click", closeSearch);
  if (searchClose) searchClose.addEventListener("click", closeSearch);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openSearch("");
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => runSearch(searchInput.value), 220);
    });
  }

  const urlQ = new URLSearchParams(location.search).get("q");
  if (urlQ && searchInput) searchInput.value = urlQ;

  // ---------- Notifications ----------
  const bell = document.getElementById("notifBell");
  const dropdown = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifBadge");
  const list = document.getElementById("notifDropdownList");

  const ICONS = {
    order: "/icons/order.svg",
    payment: "/icons/payment.svg",
    partner: "/icons/partner.svg",
    info: "/icons/bell.svg"
  };

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
      const icon = ICONS[n.type] || ICONS.info;
      item.innerHTML = `<img src="${icon}" alt="" class="notif-type-icon" /><div><h4></h4><p></p><small></small></div>`;
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
      if (popupNew && data.unread > lastUnread && data.notifications.length) {
        const newest = data.notifications[0];
        showToast(newest.message, "info", newest.title);
      }
      lastUnread = data.unread;
    } catch (err) {
      /* ignore */
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
      if (!dropdown.contains(e.target) && e.target !== bell) dropdown.classList.remove("open");
    });
    pollNotifications(false);
    setInterval(() => pollNotifications(true), 12000);
  }
})();
