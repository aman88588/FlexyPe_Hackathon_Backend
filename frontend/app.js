const API_BASE = "http://localhost:4000/api/v1";

const fetchForm = document.getElementById("fetch-form");
const reserveForm = document.getElementById("reserve-form");
const confirmForm = document.getElementById("confirm-form");
const cancelForm = document.getElementById("cancel-form");

const inventoryResult = document.getElementById("inventory-result");
const reserveResult = document.getElementById("reserve-result");
const confirmResult = document.getElementById("confirm-result");
const cancelResult = document.getElementById("cancel-result");
const expiryTimer = document.getElementById("expiry-timer");

let countdownInterval = null;

// Generate UUID v4 compatible ID
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const render = (el, message, type = "info") => {
  el.classList.remove("success", "error", "info");
  if (type === "success") el.classList.add("success");
  if (type === "error") el.classList.add("error");
  if (type === "info") el.classList.add("info");
  el.textContent = message;
};

const toJson = async (res) => {
  try {
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, status: res.status, data: {} };
  }
};

const onlyIf = (val, predicate) => (predicate ? val : undefined);

const formatInventory = (inv) => {
  if (!inv) return "No inventory found.";
  const left = inv.availableQuantity ?? "—";
  const indicator =
    typeof left === "number"
      ? left > 0
        ? `✅ ${left} item(s) available`
        : "❌ Out of stock"
      : "No quantity info";
  return [
    `SKU: ${inv.sku ?? "—"}`,
    `Name: ${inv.productName ?? "—"}`,
    `Available: ${left}`,
    indicator,
  ].join("\n");
};

const startCountdown = (expiresAt) => {
  if (!expiresAt) {
    expiryTimer.classList.add("hidden");
    return;
  }

  const expiryDate = new Date(expiresAt);
  expiryTimer.classList.remove("hidden");

  const update = () => {
    const msLeft = expiryDate.getTime() - Date.now();
    if (msLeft <= 0) {
      expiryTimer.textContent = "⏰ Reservation expired.";
      expiryTimer.style.borderColor = "rgba(248, 113, 113, 0.4)";
      expiryTimer.style.background = "rgba(248, 113, 113, 0.08)";
      expiryTimer.style.color = "#fecdd3";
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      return;
    }
    const totalSeconds = Math.floor(msLeft / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    expiryTimer.textContent = `⏰ Expires in ${mins}m ${secs}s`;
    expiryTimer.style.borderColor = "rgba(56, 189, 248, 0.4)";
    expiryTimer.style.background = "rgba(56, 189, 248, 0.08)";
    expiryTimer.style.color = "#bae6fd";
  };

  if (countdownInterval) clearInterval(countdownInterval);
  update();
  countdownInterval = setInterval(update, 1000);
};

// ============================================
// 1) FETCH INVENTORY
// ============================================
fetchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sku = new FormData(fetchForm).get("sku")?.trim();

  if (!sku) {
    render(inventoryResult, "⚠️ Please enter a SKU", "error");
    return;
  }

  render(inventoryResult, "🔍 Loading...", "info");

  try {
    const res = await fetch(`${API_BASE}/inventory/${encodeURIComponent(sku)}`);
    const { ok, data } = await toJson(res);

    if (ok && data?.data) {
      render(inventoryResult, formatInventory(data.data), "success");
      
      // Auto-populate SKU in reserve form for convenience
      const reserveSkuInput = reserveForm.querySelector('input[name="sku"]');
      if (reserveSkuInput && !reserveSkuInput.value) {
        reserveSkuInput.value = sku;
      }
    } else {
      render(
        inventoryResult,
        `❌ ${data?.message || "Failed to fetch inventory"}`,
        "error"
      );
    }
  } catch (error) {
    render(
      inventoryResult,
      "❌ Network error. Please check if the server is running.",
      "error"
    );
    console.error("Fetch error:", error);
  }
});

// ============================================
// 2) RESERVE INVENTORY
// ============================================
reserveForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(reserveForm);

  const sku = fd.get("sku")?.trim();
  const userId = fd.get("userId")?.trim();
  const quantity = Number(fd.get("quantity"));

  // Validation
  if (!sku || !userId) {
    render(reserveResult, "⚠️ SKU and User ID are required", "error");
    return;
  }

  if (!quantity || quantity < 1) {
    render(reserveResult, "⚠️ Quantity must be at least 1", "error");
    return;
  }

  const idemKey = fd.get("idempotencyKey")?.trim() || generateUUID();

  const body = {
    sku,
    userId,
    quantity,
    idempotencyKey: idemKey,
  };

  render(reserveResult, "🔒 Reserving...", "info");

  try {
    const res = await fetch(`${API_BASE}/inventory/reserve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify(body),
    });

    const { ok, data, status } = await toJson(res);

    if (ok && data?.data) {
      const reservation = data.data;
      render(
        reserveResult,
        [
          "✅ Reservation created successfully!",
          `Reservation ID: ${reservation.reservationId}`,
          `SKU: ${reservation.sku}`,
          `Quantity: ${reservation.quantity}`,
          `Status: ${reservation.status}`,
          onlyIf(
            `Expires: ${new Date(reservation.expiresAt).toLocaleString()}`,
            reservation.expiresAt
          ),
        ]
          .filter(Boolean)
          .join("\n"),
        "success"
      );

      startCountdown(reservation.expiresAt);

      // Auto-populate confirm/cancel forms
      const reservationId = reservation.reservationId || "";
      confirmForm.querySelector('input[name="reservationId"]').value = reservationId;
      cancelForm.querySelector('input[name="reservationId"]').value = reservationId;

      // Clear the reserve form for next use
      reserveForm.querySelector('input[name="userId"]').value = "";
      reserveForm.querySelector('input[name="quantity"]').value = "1";
      reserveForm.querySelector('input[name="idempotencyKey"]').value = "";
    } else {
      render(
        reserveResult,
        `❌ ${data?.message || `Failed to reserve (status ${status})`}`,
        "error"
      );
      expiryTimer.classList.add("hidden");
    }
  } catch (error) {
    render(
      reserveResult,
      "❌ Network error. Please check if the server is running.",
      "error"
    );
    expiryTimer.classList.add("hidden");
    console.error("Reserve error:", error);
  }
});

// ============================================
// 3) CONFIRM CHECKOUT
// ============================================
confirmForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reservationId = new FormData(confirmForm).get("reservationId")?.trim();

  if (!reservationId) {
    render(confirmResult, "⚠️ Reservation ID is required", "error");
    return;
  }

  render(confirmResult, "✅ Confirming...", "info");

  try {
    const res = await fetch(`${API_BASE}/checkout/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });

    const { ok, data, status } = await toJson(res);

    if (ok && data?.data) {
      render(
        confirmResult,
        [
          "✅ Checkout confirmed successfully!",
          `Reservation ID: ${data.data.reservationId}`,
          `Status: ${data.data.status}`,
          "",
          "🎉 Purchase completed!",
        ].join("\n"),
        "success"
      );

      // Hide timer and clear forms
      expiryTimer.classList.add("hidden");
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      // Clear both forms
      confirmForm.querySelector('input[name="reservationId"]').value = "";
      cancelForm.querySelector('input[name="reservationId"]').value = "";
    } else {
      render(
        confirmResult,
        `❌ ${data?.message || `Unable to confirm (status ${status})`}`,
        "error"
      );
    }
  } catch (error) {
    render(
      confirmResult,
      "❌ Network error. Please check if the server is running.",
      "error"
    );
    console.error("Confirm error:", error);
  }
});

// ============================================
// 4) CANCEL CHECKOUT
// ============================================
cancelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reservationId = new FormData(cancelForm).get("reservationId")?.trim();

  if (!reservationId) {
    render(cancelResult, "⚠️ Reservation ID is required", "error");
    return;
  }

  render(cancelResult, "🔄 Cancelling...", "info");

  try {
    const res = await fetch(`${API_BASE}/checkout/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });

    const { ok, data, status } = await toJson(res);

    if (ok && data?.data) {
      render(
        cancelResult,
        [
          "✅ Checkout cancelled successfully!",
          `Reservation ID: ${data.data.reservationId}`,
          `Status: ${data.data.status}`,
          "",
          "♻️ Inventory has been restored.",
        ].join("\n"),
        "success"
      );

      // Hide timer and clear forms
      expiryTimer.classList.add("hidden");
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      // Clear both forms
      confirmForm.querySelector('input[name="reservationId"]').value = "";
      cancelForm.querySelector('input[name="reservationId"]').value = "";
    } else {
      render(
        cancelResult,
        `❌ ${data?.message || `Unable to cancel (status ${status})`}`,
        "error"
      );
    }
  } catch (error) {
    render(
      cancelResult,
      "❌ Network error. Please check if the server is running.",
      "error"
    );
    console.error("Cancel error:", error);
  }
});

// ============================================
// UTILITY: Clear all results when starting fresh
// ============================================
const clearAllResults = () => {
  [inventoryResult, reserveResult, confirmResult, cancelResult].forEach((el) => {
    el.textContent = "";
    el.classList.remove("success", "error", "info");
  });
  expiryTimer.classList.add("hidden");
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

// Add keyboard shortcut for convenience (Ctrl/Cmd + K to clear)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    clearAllResults();
    console.log("All results cleared!");
  }
});

console.log("%c🚀 Smart Inventory Reservation System", "color: #38bdf8; font-size: 16px; font-weight: bold");
console.log("%cAPI Base:", "color: #22c55e", API_BASE);
console.log("%cPress Ctrl/Cmd + K to clear all results", "color: #94a3b8");