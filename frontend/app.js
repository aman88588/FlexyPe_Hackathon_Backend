const API_BASE = "/api/v1";

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

const render = (el, message, type = "info") => {
  el.classList.remove("success", "error");
  if (type === "success") el.classList.add("success");
  if (type === "error") el.classList.add("error");
  el.textContent = message;
};

const toJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

const onlyIf = (val, predicate) => (predicate ? val : undefined);

const formatInventory = (inv) => {
  if (!inv) return "No inventory found.";
  const left = inv.availableQuantity ?? "—";
  const indicator =
    typeof left === "number" ? `Only ${left} item(s) left` : "No quantity info";
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
      expiryTimer.textContent = "Reservation expired.";
      clearInterval(countdownInterval);
      return;
    }
    const totalSeconds = Math.floor(msLeft / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    expiryTimer.textContent = `Expires in ${mins}m ${secs}s`;
  };

  if (countdownInterval) clearInterval(countdownInterval);
  update();
  countdownInterval = setInterval(update, 1000);
};

fetchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sku = new FormData(fetchForm).get("sku");
  render(inventoryResult, "Loading...");
  const res = await fetch(`${API_BASE}/inventory/${encodeURIComponent(sku)}`);
  const { ok, data } = await toJson(res);
  if (ok && data?.data) {
    render(inventoryResult, formatInventory(data.data), "success");
  } else {
    render(inventoryResult, data?.message || "Failed to fetch inventory", "error");
  }
});

reserveForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(reserveForm);
  const body = {
    sku: fd.get("sku"),
    userId: fd.get("userId"),
    quantity: Number(fd.get("quantity")),
  };

  const idemKey = fd.get("idempotencyKey") || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  body.idempotencyKey = idemKey;

  render(reserveResult, "Reserving...");
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
        "Reservation created:",
        `reservationId: ${reservation.reservationId}`,
        `sku: ${reservation.sku}`,
        `quantity: ${reservation.quantity}`,
        `status: ${reservation.status}`,
        onlyIf(`expiresAt: ${reservation.expiresAt}`, reservation.expiresAt),
      ]
        .filter(Boolean)
        .join("\n"),
      "success"
    );
    startCountdown(reservation.expiresAt);
    // Prefill confirm/cancel forms for convenience
    confirmForm.querySelector('input[name="reservationId"]').value =
      reservation.reservationId || "";
    cancelForm.querySelector('input[name="reservationId"]').value =
      reservation.reservationId || "";
  } else {
    render(
      reserveResult,
      data?.message || `Failed to reserve (status ${status})`,
      "error"
    );
    expiryTimer.classList.add("hidden");
  }
});

confirmForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reservationId = new FormData(confirmForm).get("reservationId");
  render(confirmResult, "Confirming...");
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
        "Checkout confirmed:",
        `reservationId: ${data.data.reservationId}`,
        `status: ${data.data.status}`,
      ].join("\n"),
      "success"
    );
    expiryTimer.classList.add("hidden");
  } else {
    render(
      confirmResult,
      data?.message || `Unable to confirm (status ${status})`,
      "error"
    );
  }
});

cancelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reservationId = new FormData(cancelForm).get("reservationId");
  render(cancelResult, "Cancelling...");
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
        "Checkout cancelled:",
        `reservationId: ${data.data.reservationId}`,
        `status: ${data.data.status}`,
      ].join("\n"),
      "success"
    );
    expiryTimer.classList.add("hidden");
  } else {
    render(
      cancelResult,
      data?.message || `Unable to cancel (status ${status})`,
      "error"
    );
  }
});

