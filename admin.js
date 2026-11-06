// Admin Dashboard Logic for Yoga Laundry
const STORAGE_KEY = "yoga_orders";
const PIN_CODE = "1234";

// Initial Seed Data if empty
function initStorage() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing || JSON.parse(existing).length === 0) {
    const demoData = [
      {
        id: "YG-0511-101",
        createdAt: "05/11/2026, 14:15 WIB",
        name: "Ahmad Fauzi",
        phone: "081234567890",
        address: "Jl. Melati No. 45, RT 02/03",
        service: "Cuci Setrika (Reguler)",
        weight: "4 kg",
        note: "Pisahkan kemeja kerja putih, jemput jam 3 sore",
        priceEstimate: "Rp7.000 / kg",
        status: "Menunggu Penjemputan"
      },
      {
        id: "YG-0511-102",
        createdAt: "05/11/2026, 16:30 WIB",
        name: "Siti Rahma",
        phone: "085799887766",
        address: "Kost Griya Asri Kamar 12, Gg. Kenanga",
        service: "Cuci Setrika (Express 24 Jam)",
        weight: "3 kg",
        note: "Harap cepat karena besok mau dinas luar kota",
        priceEstimate: "Rp10.000 / kg",
        status: "Sedang Dicuci"
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  }
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// Authentication Check
const loginOverlay = document.querySelector("#loginOverlay");
const adminApp = document.querySelector("#adminApp");
const loginForm = document.querySelector("#loginForm");
const adminPinInput = document.querySelector("#adminPin");
const loginError = document.querySelector("#loginError");
const btnLogout = document.querySelector("#btnLogout");

function checkAuth() {
  if (sessionStorage.getItem("yoga_admin_auth") === "true") {
    loginOverlay.style.display = "none";
    adminApp.style.display = "flex";
    renderDashboard();
  } else {
    loginOverlay.style.display = "flex";
    adminApp.style.display = "none";
    adminPinInput.value = "";
    adminPinInput.focus();
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (adminPinInput.value.trim() === PIN_CODE) {
    sessionStorage.setItem("yoga_admin_auth", "true");
    loginError.style.display = "none";
    checkAuth();
  } else {
    loginError.style.display = "block";
    adminPinInput.select();
  }
});

btnLogout.addEventListener("click", () => {
  if (confirm("Apakah kamu yakin ingin keluar dari panel admin?")) {
    sessionStorage.removeItem("yoga_admin_auth");
    checkAuth();
  }
});

// Live Clock
function updateClock() {
  const clockEl = document.querySelector("#liveClock");
  if (!clockEl) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  clockEl.textContent = `${timeStr} WIB`;
}
setInterval(updateClock, 1000);
updateClock();

// Status Class Mapping
function getStatusClass(status) {
  switch (status) {
    case "Menunggu Penjemputan": return "status-pending";
    case "Sedang Dijemput": return "status-pickup";
    case "Sedang Dicuci": return "status-wash";
    case "Sedang Disetrika": return "status-iron";
    case "Siap Diantar": return "status-deliver";
    case "Selesai": return "status-done";
    case "Dibatalkan": return "status-cancel";
    default: return "status-pending";
  }
}

// Render Dashboard & Table
function renderDashboard() {
  const orders = getOrders();
  const search = document.querySelector("#searchInput").value.toLowerCase().trim();
  const statusFilter = document.querySelector("#filterStatus").value;

  // Calculate Metrics
  let total = orders.length;
  let pending = 0;
  let inProcess = 0;
  let completed = 0;

  orders.forEach(o => {
    if (o.status === "Menunggu Penjemputan") pending++;
    else if (["Sedang Dijemput", "Sedang Dicuci", "Sedang Disetrika", "Siap Diantar"].includes(o.status)) inProcess++;
    else if (o.status === "Selesai") completed++;
  });

  document.querySelector("#metricTotal").textContent = total;
  document.querySelector("#metricPending").textContent = pending;
  document.querySelector("#metricProcess").textContent = inProcess;
  document.querySelector("#metricCompleted").textContent = completed;

  // Filter Orders
  const filtered = orders.filter(o => {
    const matchSearch = (
      o.id.toLowerCase().includes(search) ||
      o.name.toLowerCase().includes(search) ||
      o.phone.toLowerCase().includes(search) ||
      o.address.toLowerCase().includes(search) ||
      o.service.toLowerCase().includes(search)
    );
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tableBody = document.querySelector("#ordersTableBody");
  const emptyState = document.querySelector("#emptyState");

  if (filtered.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tableBody.innerHTML = filtered.map(order => {
    const waClean = order.phone.replace(/[^0-9]/g, "");
    const waLink = waClean.startsWith("0") ? `62${waClean.substring(1)}` : waClean;

    return `
      <tr data-id="${order.id}">
        <td>
          <span class="resi-badge" onclick="showReceiptModal('${order.id}')" title="Klik untuk lihat struk">
            #${order.id}
          </span>
        </td>
        <td style="font-family: var(--mono); font-size: 11px; color: var(--muted); white-space: nowrap;">
          ${order.createdAt}
        </td>
        <td>
          <span class="cust-name">${escapeHtml(order.name)}</span>
          <a class="cust-phone" href="https://wa.me/${waLink}" target="_blank" rel="noopener">
            📱 ${escapeHtml(order.phone)}
          </a>
        </td>
        <td style="max-width: 220px; font-size: 12px; line-height: 1.4;">
          ${escapeHtml(order.address)}
          ${order.gmapsLink ? `<a href="${order.gmapsLink}" target="_blank" rel="noopener" class="admin-loc-link" title="Buka Lokasi di Google Maps">📍 Buka di Maps</a>` : ""}
        </td>
        <td>
          <span class="order-service-name">${escapeHtml(order.service)}</span>
          <span class="order-weight">${escapeHtml(order.weight || "-")} · ${order.priceEstimate || "Tanya Harga"}</span>
        </td>
        <td style="max-width: 180px; font-size: 11px; color: var(--muted);">
          ${escapeHtml(order.note || "-")}
        </td>
        <td>
          <select 
            class="status-dropdown ${getStatusClass(order.status)}" 
            onchange="updateStatus('${order.id}', this.value)"
          >
            <option value="Menunggu Penjemputan" ${order.status === 'Menunggu Penjemputan' ? 'selected' : ''}>Menunggu Penjemputan</option>
            <option value="Sedang Dijemput" ${order.status === 'Sedang Dijemput' ? 'selected' : ''}>Sedang Dijemput</option>
            <option value="Sedang Dicuci" ${order.status === 'Sedang Dicuci' ? 'selected' : ''}>Sedang Dicuci</option>
            <option value="Sedang Disetrika" ${order.status === 'Sedang Disetrika' ? 'selected' : ''}>Sedang Disetrika</option>
            <option value="Siap Diantar" ${order.status === 'Siap Diantar' ? 'selected' : ''}>Siap Diantar</option>
            <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            <option value="Dibatalkan" ${order.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn-icon" onclick="showReceiptModal('${order.id}')" title="Cetak Struk">🖨 Struk</button>
            <a 
              class="btn-icon btn-icon-wa" 
              href="https://wa.me/${waLink}?text=Halo%20Kak%20${encodeURIComponent(order.name)}%2C%20update%20pesanan%20Yoga%20Laundry%20%23${order.id}%3A%20Status%20saat%20ini%20*${encodeURIComponent(order.status)}*." 
              target="_blank"
              title="Kirim Update ke WhatsApp"
            >
              WA
            </a>
            <button class="btn-icon btn-icon-del" onclick="deleteOrder('${order.id}')" title="Hapus Pesanan">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Update Status Function
window.updateStatus = function(orderId, newStatus) {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = newStatus;
    saveOrders(orders);
    renderDashboard();
  }
};

// Delete Order Function
window.deleteOrder = function(orderId) {
  if (confirm(`Hapus pesanan No. Resi #${orderId}? Data tidak dapat dikembalikan.`)) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    renderDashboard();
  }
};

// Receipt Modal Handling
const receiptModal = document.querySelector("#receiptModal");
const receiptPrintArea = document.querySelector("#receiptPrintArea");
const btnCloseReceipt = document.querySelector("#btnCloseReceipt");
const btnCloseReceipt2 = document.querySelector("#btnCloseReceipt2");
const btnPrintReceipt = document.querySelector("#btnPrintReceipt");

window.showReceiptModal = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  receiptPrintArea.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h4>YOGA LAUNDRY</h4>
        <p>Jl. Raya Toko Laundry • WhatsApp: 0823-2056-5949</p>
        <p>Buka Setiap Hari: 08.00 - 23.00 WIB</p>
      </div>

      <div class="receipt-meta">
        <span>NO. RESI: <b>#${order.id}</b></span>
        <span>${order.createdAt}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-details">
        <div class="receipt-row">
          <span>Pelanggan</span>
          <span>${escapeHtml(order.name)} (${escapeHtml(order.phone)})</span>
        </div>
        <div class="receipt-row">
          <span>Alamat</span>
          <span>${escapeHtml(order.address)}</span>
        </div>
        ${order.gmapsLink ? `
        <div class="receipt-row">
          <span>📍 Lokasi GPS</span>
          <span><a href="${order.gmapsLink}" target="_blank" rel="noopener" class="receipt-loc-link">Buka di Google Maps →</a></span>
        </div>` : ""}
        <div class="receipt-row">
          <span>Paket Layanan</span>
          <span>${escapeHtml(order.service)}</span>
        </div>
        <div class="receipt-row">
          <span>Estimasi Jumlah</span>
          <span>${escapeHtml(order.weight || "-")}</span>
        </div>
        <div class="receipt-row">
          <span>Catatan Khusus</span>
          <span>${escapeHtml(order.note || "-")}</span>
        </div>
        <div class="receipt-row">
          <span>Estimasi Biaya</span>
          <span><b>${escapeHtml(order.priceEstimate || "Sesuai Timbangan")}</b></span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row" style="align-items: center;">
          <span>Status Cucian</span>
          <span class="receipt-status-pill">${escapeHtml(order.status)}</span>
        </div>
      </div>

      <div class="receipt-footer">
        <p>Terima kasih telah mempercayakan cucian Anda kepada Yoga Laundry.<br>
        Simpan struk ini sebagai bukti pengambilan atau pelacakan pesanan Anda.</p>
      </div>
    </div>
  `;

  receiptModal.style.display = "flex";
};

[btnCloseReceipt, btnCloseReceipt2].forEach(btn => {
  btn.addEventListener("click", () => {
    receiptModal.style.display = "none";
  });
});

btnPrintReceipt.addEventListener("click", () => {
  window.print();
});

// Manual Order Modal
const manualModal = document.querySelector("#manualOrderModal");
const btnNewManualOrder = document.querySelector("#btnNewManualOrder");
const btnCloseManual = document.querySelector("#btnCloseManual");
const btnCancelManual = document.querySelector("#btnCancelManual");
const manualOrderForm = document.querySelector("#manualOrderForm");

btnNewManualOrder.addEventListener("click", () => {
  manualOrderForm.reset();
  manualModal.style.display = "flex";
});

[btnCloseManual, btnCancelManual].forEach(btn => {
  btn.addEventListener("click", () => {
    manualModal.style.display = "none";
  });
});

manualOrderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.querySelector("#manualName").value.trim();
  const phone = document.querySelector("#manualPhone").value.trim();
  const address = document.querySelector("#manualAddress").value.trim();
  const service = document.querySelector("#manualService").value;
  const weight = document.querySelector("#manualWeight").value.trim() || "-";
  const note = document.querySelector("#manualNote").value.trim() || "-";

  // Generate unique Resi ID
  const dateObj = new Date();
  const dayStr = String(dateObj.getDate()).padStart(2, "0");
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  const newId = `YG-${dayStr}${monthStr}-${rand}`;

  const timeStr = dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }) + ", " + dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

  let priceEst = "Sesuai Timbangan";
  switch (service) {
    case "Cuci Lipat (Reguler)": priceEst = "Rp5.000 / kg"; break;
    case "Cuci Setrika (Reguler)": priceEst = "Rp7.000 / kg"; break;
    case "Setrika Saja (Reguler)": priceEst = "Rp5.000 / kg"; break;
    case "Cuci Lipat (Express 24 Jam)": priceEst = "Rp7.000 / kg"; break;
    case "Cuci Setrika (Express 24 Jam)": priceEst = "Rp10.000 / kg"; break;
    case "Setrika Saja (Express 24 Jam)": priceEst = "Rp7.000 / kg"; break;
    case "Cuci Lipat (Express 6 Jam)": priceEst = "Rp10.000 / kg"; break;
    case "Cuci Setrika (Express 6 Jam)": priceEst = "Rp14.000 / kg"; break;
    case "Setrika Saja (Express 6 Jam)": priceEst = "Rp10.000 / kg"; break;
    default: priceEst = "Sesuai Timbangan";
  }

  const newOrder = {
    id: newId,
    createdAt: timeStr,
    name,
    phone,
    address,
    service,
    weight,
    note,
    priceEstimate: priceEst,
    status: "Menunggu Penjemputan"
  };

  const orders = getOrders();
  orders.unshift(newOrder);
  saveOrders(orders);

  manualModal.style.display = "none";
  renderDashboard();
  showReceiptModal(newId);
});

// Search & Filter Events
document.querySelector("#searchInput").addEventListener("input", renderDashboard);
document.querySelector("#filterStatus").addEventListener("change", renderDashboard);
document.querySelector("#btnRefreshData").addEventListener("click", renderDashboard);

// Helper for XSS safety
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial Boot
initStorage();
checkAuth();

