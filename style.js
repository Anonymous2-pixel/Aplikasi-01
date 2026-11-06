// ===================================================
// YOGA LAUNDRY - CLIENT SCRIPTS & ORDER SYSTEM
// ===================================================
const STORAGE_KEY = "yoga_orders";
const WA_PHONE = "6282320565949";

// ===================================================
// MOBILE NAVIGATION
// ===================================================
const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelector("#navLinks");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuButton.textContent = isOpen ? "TUTUP ✕" : "MENU +";
    menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      menuButton.textContent = "MENU +";
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("is-open") &&
      !navLinks.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      navLinks.classList.remove("is-open");
      menuButton.textContent = "MENU +";
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

// ===================================================
// STORAGE HELPERS
// ===================================================
function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveOrderToStorage(newOrder) {
  const orders = getSavedOrders();
  orders.unshift(newOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// ===================================================
// SERVICE CATEGORY TABS FILTER
// ===================================================
const serviceTabBtns = document.querySelectorAll(".service-tab-btn");
const serviceCards = document.querySelectorAll(".service-card");

serviceTabBtns.forEach((tab) => {
  tab.addEventListener("click", () => {
    serviceTabBtns.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const filter = tab.getAttribute("data-filter");

    serviceCards.forEach((card) => {
      const category = card.getAttribute("data-category");
      if (filter === "all" || category === filter) {
        card.style.display = "flex";
        card.style.animation = "fadeUp 0.35s ease both";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// ===================================================
// GPS / GEOLOCATION PICKER
// ===================================================
// Global state untuk menyimpan data lokasi yang sudah dideteksi
let detectedLocation = {
  lat: null,
  lng: null,
  geoAddress: "",
  gmapsLink: "",
  hasLocation: false
};

const btnGetLocation = document.querySelector("#btnGetLocation");
const btnGetLocationText = document.querySelector("#btnGetLocationText");
const locStatusBadge = document.querySelector("#locStatusBadge");
const locationPreviewCard = document.querySelector("#locationPreviewCard");
const locPreviewAddress = document.querySelector("#locPreviewAddress");
const locPreviewCoords = document.querySelector("#locPreviewCoords");
const locPreviewMapLink = document.querySelector("#locPreviewMapLink");

function setLocState(state) {
  if (!btnGetLocation) return;
  btnGetLocation.classList.remove("loc-loading", "loc-success", "loc-error");
  if (locStatusBadge) locStatusBadge.style.display = "none";

  if (state === "loading") {
    btnGetLocation.classList.add("loc-loading");
    if (btnGetLocationText) btnGetLocationText.textContent = "Mendeteksi lokasi GPS...";
    if (locStatusBadge) {
      locStatusBadge.style.display = "inline-block";
      locStatusBadge.textContent = "TUNGGU...";
      locStatusBadge.style.background = "#fef3c7";
      locStatusBadge.style.color = "#b45309";
    }
  } else if (state === "success") {
    btnGetLocation.classList.add("loc-success");
    if (btnGetLocationText) btnGetLocationText.textContent = "✓ Lokasi GPS Berhasil Terdeteksi — Klik untuk Perbarui";
    if (locStatusBadge) {
      locStatusBadge.style.display = "inline-block";
      locStatusBadge.textContent = "TERDETEKSI ✓";
      locStatusBadge.style.background = "#dcfce7";
      locStatusBadge.style.color = "#15803d";
    }
  } else if (state === "error") {
    btnGetLocation.classList.add("loc-error");
    if (btnGetLocationText) btnGetLocationText.textContent = "⚠ Gagal deteksi. Coba lagi atau ketik alamat manual.";
    if (locStatusBadge) {
      locStatusBadge.style.display = "inline-block";
      locStatusBadge.textContent = "GAGAL ✕";
      locStatusBadge.style.background = "#fee2e2";
      locStatusBadge.style.color = "#b91c1c";
    }
  } else {
    // reset
    if (btnGetLocationText) btnGetLocationText.textContent = "Gunakan Lokasi GPS Saya (Otomatis)";
  }
}

async function reverseGeocode(lat, lng) {
  // Menggunakan Nominatim / OpenStreetMap – gratis, tanpa API key
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "id" }
    });
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (err) {
    // Fallback: hanya tampilkan koordinat
    return `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

if (btnGetLocation) {
  btnGetLocation.addEventListener("click", async () => {
    if (!("geolocation" in navigator)) {
      setLocState("error");
      alert("Browser Anda tidak mendukung fitur GPS. Silakan isi alamat secara manual.");
      return;
    }

    setLocState("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        const gmapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

        // ─── Tolak jika akurasi terlalu buruk (> 500 meter = IP-based) ───
        const MAX_ACCURACY_METERS = 500;
        if (accuracy > MAX_ACCURACY_METERS) {
          setLocState("error");
          detectedLocation.hasLocation = false;
          if (locationPreviewCard) locationPreviewCard.style.display = "none";
          const hint = document.querySelector("#locRequiredHint");
          if (hint) {
            hint.style.display = "block";
            hint.style.color = "#b45309";
            hint.textContent =
              `⚠️ Akurasi GPS terlalu rendah (~${(accuracy / 1000).toFixed(0)} km) — perangkat tidak bisa lock sinyal GPS. ` +
              `Silakan coba di luar ruangan dengan sinyal lebih baik, atau ketik alamat penjemputan secara manual di bawah.`;
          }
          return; // Jangan simpan lokasi yang tidak akurat
        }
        // ─────────────────────────────────────────────────────────────────

        // Reverse geocode (Nominatim)
        const geoAddress = await reverseGeocode(lat, lng);

        // Simpan ke state global
        detectedLocation = { lat, lng, geoAddress, gmapsLink, hasLocation: true };

        // Update hidden inputs
        const custLat = document.querySelector("#custLat");
        const custLng = document.querySelector("#custLng");
        const custGmapsLink = document.querySelector("#custGmapsLink");
        const custGeoAddress = document.querySelector("#custGeoAddress");
        if (custLat) custLat.value = lat;
        if (custLng) custLng.value = lng;
        if (custGmapsLink) custGmapsLink.value = gmapsLink;
        if (custGeoAddress) custGeoAddress.value = geoAddress;

        // Tampilkan preview card dengan indikator warna akurasi
        if (locPreviewAddress) locPreviewAddress.textContent = geoAddress;
        const accLabel = accuracy <= 30 ? `✅ ~${accuracy}m (Sangat Akurat)`
                       : accuracy <= 100 ? `🟢 ~${accuracy}m (Akurat)`
                       : accuracy <= 300 ? `🟡 ~${accuracy}m (Cukup Akurat)`
                       : `🟠 ~${accuracy}m (Kurang Akurat)`;
        if (locPreviewCoords) locPreviewCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)} · ${accLabel}`;
        if (locPreviewMapLink) {
          locPreviewMapLink.href = gmapsLink;
        }
        if (locationPreviewCard) locationPreviewCard.style.display = "block";

        setLocState("success");
      },
      (err) => {
        setLocState("error");
        detectedLocation.hasLocation = false;
        let msg = "Gagal mendapatkan lokasi GPS.";
        if (err.code === 1) msg = "Izin lokasi ditolak. Silakan aktifkan izin GPS di pengaturan browser, lalu coba lagi.";
        else if (err.code === 2) msg = "Lokasi tidak tersedia. Pastikan perangkat Anda memiliki koneksi dan GPS aktif.";
        else if (err.code === 3) msg = "Waktu deteksi lokasi habis. Coba lagi di tempat dengan sinyal lebih baik.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ===================================================
// ORDER MODAL & SUBMISSION
// ===================================================
const orderModal = document.querySelector("#orderModal");
const btnCloseOrderModal = document.querySelector("#btnCloseOrderModal");
const orderForm = document.querySelector("#orderForm");
const custServiceSelect = document.querySelector("#custService");

// Open Order Modal for any trigger button or service card
document.querySelectorAll("[data-open-order='true']").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const preService = btn.getAttribute("data-service");
    if (preService && custServiceSelect) {
      custServiceSelect.value = preService;
    }
    if (orderModal) {
      orderModal.style.display = "flex";
      // Reset location state each time modal opens
      detectedLocation = { lat: null, lng: null, geoAddress: "", gmapsLink: "", hasLocation: false };
      setLocState("reset");
      if (locationPreviewCard) locationPreviewCard.style.display = "none";
      const nameInput = document.querySelector("#custName");
      if (nameInput) nameInput.focus();
    }
  });
});

if (btnCloseOrderModal && orderModal) {
  btnCloseOrderModal.addEventListener("click", () => {
    orderModal.style.display = "none";
  });
}

// Close modal if clicking outside modal dialog
window.addEventListener("click", (e) => {
  if (e.target === orderModal) orderModal.style.display = "none";
  if (e.target === customerReceiptModal) customerReceiptModal.style.display = "none";
  if (e.target === trackingModal) trackingModal.style.display = "none";
});

// Handle Order Form Submit
const customerReceiptModal = document.querySelector("#customerReceiptModal");
const btnCloseCustReceipt = document.querySelector("#btnCloseCustReceipt");
const btnCloseCustReceipt2 = document.querySelector("#btnCloseCustReceipt2");
const custReceiptPrintArea = document.querySelector("#custReceiptPrintArea");
const btnSendWaReceipt = document.querySelector("#btnSendWaReceipt");
const btnPrintCustReceipt = document.querySelector("#btnPrintCustReceipt");

if (orderForm) {
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#custName").value.trim();
    const phone = document.querySelector("#custPhone").value.trim();
    const manualAddress = document.querySelector("#custAddress").value.trim();
    const service = document.querySelector("#custService").value;
    const weight = document.querySelector("#custWeight").value.trim() || "-";
    const note = document.querySelector("#custNote").value.trim() || "-";

    // Ambil data lokasi GPS (jika ada)
    const lat = document.querySelector("#custLat").value;
    const lng = document.querySelector("#custLng").value;
    const gmapsLink = document.querySelector("#custGmapsLink").value;
    const geoAddress = document.querySelector("#custGeoAddress").value;

    // Validasi: minimal harus ada GPS atau alamat manual
    if (!detectedLocation.hasLocation && !manualAddress) {
      const hint = document.querySelector("#locRequiredHint");
      if (hint) {
        hint.style.display = "block";
        hint.textContent = "⚠️ Silakan bagikan lokasi GPS atau ketik alamat penjemputan terlebih dahulu!";
      }
      if (btnGetLocation) btnGetLocation.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Susun alamat gabungan
    const finalAddress = geoAddress
      ? (manualAddress ? `${geoAddress} (${manualAddress})` : geoAddress)
      : manualAddress;

    // Generate Resi ID
    const dateObj = new Date();
    const dayStr = String(dateObj.getDate()).padStart(2, "0");
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    const orderId = `YG-${dayStr}${monthStr}-${rand}`;

    const timeStr =
      dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      ", " +
      dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB";

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
      id: orderId,
      createdAt: timeStr,
      name,
      phone,
      address: finalAddress,
      lat: lat || null,
      lng: lng || null,
      gmapsLink: gmapsLink || null,
      service,
      weight,
      note,
      priceEstimate: priceEst,
      status: "Menunggu Penjemputan"
    };

    // Save to persistent storage (Admin can view this immediately!)
    saveOrderToStorage(newOrder);

    // Close Order Form, Reset
    orderForm.reset();
    setLocState("reset");
    if (locationPreviewCard) locationPreviewCard.style.display = "none";
    detectedLocation = { lat: null, lng: null, geoAddress: "", gmapsLink: "", hasLocation: false };
    orderModal.style.display = "none";

    // Build Receipt HTML
    const locMapHtml = gmapsLink
      ? `<a href="${gmapsLink}" target="_blank" rel="noopener" class="receipt-loc-link">📍 Lihat di Google Maps →</a>`
      : "";

    custReceiptPrintArea.innerHTML = `
      <div class="cust-receipt-head">
        <h4>YOGA LAUNDRY</h4>
        <p>Jl. Toko Laundry • WA: 0823-2056-5949</p>
        <p>Buka Setiap Hari: 08.00 - 23.00 WIB</p>
      </div>

      <div class="cust-receipt-meta">
        <span>NO. RESI: <b>#${orderId}</b></span>
        <span>${timeStr}</span>
      </div>

      <div class="cust-receipt-rows">
        <div class="cust-receipt-row">
          <span>Pelanggan</span>
          <span>${escapeHtml(name)} (${escapeHtml(phone)})</span>
        </div>
        <div class="cust-receipt-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
          <span>📍 Lokasi Jemput</span>
          <span style="font-size: 11px; line-height: 1.4; text-align: left; max-width: 100%;">${escapeHtml(finalAddress)}</span>
          ${locMapHtml}
        </div>
        <div class="cust-receipt-row">
          <span>Layanan Dipilih</span>
          <span>${escapeHtml(service)}</span>
        </div>
        <div class="cust-receipt-row">
          <span>Estimasi Jumlah</span>
          <span>${escapeHtml(weight)}</span>
        </div>
        <div class="cust-receipt-row">
          <span>Catatan Khusus</span>
          <span>${escapeHtml(note)}</span>
        </div>
        <div class="cust-receipt-row">
          <span>Estimasi Biaya</span>
          <span><b>${escapeHtml(priceEst)}</b></span>
        </div>
        <div class="cust-receipt-row" style="margin-top: 6px;">
          <span>Status Pesanan</span>
          <span style="color: #d97706; font-weight: 800;">[ Menunggu Penjemputan ]</span>
        </div>
      </div>

      <div class="cust-receipt-foot">
        <p>Pesanan telah tersimpan di sistem Yoga Laundry.<br>
        Klik tombol WhatsApp di bawah untuk konfirmasi jadwal penjemputan dengan tim kami.</p>
      </div>
    `;

    // Setup WhatsApp Link — sertakan link Google Maps jika ada
    const locationLine = gmapsLink
      ? `📍 *Lokasi Jemput (GPS):*\n${finalAddress}\n🗺 ${gmapsLink}`
      : `📍 *Alamat Jemput:* ${finalAddress}`;

    const waText = encodeURIComponent(
      `Halo Yoga Laundry, saya ingin konfirmasi pesanan laundry:\n\n` +
      `🧾 *NO. RESI:* #${orderId}\n` +
      `👤 *Nama:* ${name}\n` +
      `📱 *No. WA:* ${phone}\n` +
      `${locationLine}\n` +
      `🧺 *Layanan:* ${service}\n` +
      `⚖️ *Estimasi:* ${weight}\n` +
      `📝 *Catatan:* ${note}\n\n` +
      `Mohon dibantu konfirmasi penjemputan cucian saya. Terima kasih! 🙏`
    );

    btnSendWaReceipt.href = `https://wa.me/${WA_PHONE}?text=${waText}`;

    // Show Receipt Modal
    customerReceiptModal.style.display = "flex";
  });
}

// Close Receipt Modal
[btnCloseCustReceipt, btnCloseCustReceipt2].forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", () => {
      customerReceiptModal.style.display = "none";
    });
  }
});

if (btnPrintCustReceipt) {
  btnPrintCustReceipt.addEventListener("click", () => {
    window.print();
  });
}

// ===================================================
// TRACKING / CEK STATUS RESI
// ===================================================
const trackingModal = document.querySelector("#trackingModal");
const btnCloseTracking = document.querySelector("#btnCloseTracking");
const btnOpenTrackingNav = document.querySelector("#btnOpenTrackingNav");
const btnOpenTrackingHero = document.querySelector("#btnOpenTrackingHero");
const trackingInput = document.querySelector("#trackingInput");
const btnSubmitTracking = document.querySelector("#btnSubmitTracking");
const trackingResult = document.querySelector("#trackingResult");

function openTrackingModal() {
  if (trackingModal) {
    trackingModal.style.display = "flex";
    if (trackingInput) {
      trackingInput.value = "";
      trackingInput.focus();
    }
    if (trackingResult) {
      trackingResult.style.display = "none";
      trackingResult.innerHTML = "";
    }
  }
}

if (btnOpenTrackingNav) {
  btnOpenTrackingNav.addEventListener("click", (e) => {
    e.preventDefault();
    openTrackingModal();
  });
}

if (btnOpenTrackingHero) {
  btnOpenTrackingHero.addEventListener("click", (e) => {
    e.preventDefault();
    openTrackingModal();
  });
}

if (btnCloseTracking && trackingModal) {
  btnCloseTracking.addEventListener("click", () => {
    trackingModal.style.display = "none";
  });
}

function performTracking() {
  const query = trackingInput.value.trim().toUpperCase().replace("#", "");
  if (!query) {
    alert("Silakan masukkan Nomor Resi Anda.");
    return;
  }

  const orders = getSavedOrders();
  const order = orders.find(
    (o) => o.id.toUpperCase() === query || o.id.toUpperCase() === `YG-${query}`
  );

  if (!order) {
    trackingResult.style.display = "block";
    trackingResult.innerHTML = `
      <div style="text-align: center; padding: 20px 10px; color: #ef4444;">
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔍</span>
        <b>Nomor Resi #${escapeHtml(query)} tidak ditemukan.</b>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Pastikan format nomor resi sudah benar (Contoh: YG-0511-101) atau hubungi admin via WhatsApp.
        </p>
      </div>
    `;
    return;
  }

  const steps = [
    "Menunggu Penjemputan",
    "Sedang Dijemput",
    "Sedang Dicuci",
    "Sedang Disetrika",
    "Siap Diantar",
    "Selesai"
  ];

  const currentIdx = steps.indexOf(order.status);
  const locMapHtml = order.gmapsLink
    ? `<a href="${order.gmapsLink}" target="_blank" rel="noopener" class="receipt-loc-link" style="margin-top:8px;">🗺 Buka Lokasi Jemput di Maps →</a>`
    : "";

  trackingResult.style.display = "block";
  trackingResult.innerHTML = `
    <div style="margin-bottom: 14px;">
      <span style="font-family: var(--mono); font-size: 11px; color: var(--muted);">NO. RESI</span>
      <h4 style="margin: 2px 0 0; color: var(--navy); font-size: 18px;">#${order.id}</h4>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">
        Pelanggan: <b>${escapeHtml(order.name)}</b> · Layanan: <b>${escapeHtml(order.service)}</b>
      </div>
      <div class="tracking-badge-status" style="background: #e0f2fe; color: #0284c7;">
        STATUS: ${escapeHtml(order.status)}
      </div>
      ${locMapHtml}
    </div>

    <div class="tracking-timeline">
      ${steps.map((step, idx) => {
        const isActive = currentIdx >= idx;
        return `
          <div class="timeline-step ${isActive ? "active" : ""}">
            <b>${step}</b>
            ${order.status === step
              ? '<span style="color: #2563eb; font-size: 11px; display: block;">(Tahap saat ini)</span>'
              : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

if (btnSubmitTracking) {
  btnSubmitTracking.addEventListener("click", performTracking);
}

if (trackingInput) {
  trackingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performTracking();
  });
}

// ===================================================
// XSS SAFETY HELPER
// ===================================================
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
