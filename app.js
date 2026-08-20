// ============================================================
// APP.JS - Aplikasi Utama Web GIS
// ============================================================

// ============================================================
// 1. FUNGSI UTILITY
// ============================================================

function getGoogleDriveImageUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function getImageUrl(namaFile) {
    if (!namaFile || namaFile === "") return null;
    
    // Cek mapping langsung
    const fileData = googleDriveFiles[namaFile];
    if (fileData && fileData.fileId) {
        return getGoogleDriveImageUrl(fileData.fileId);
    }
    
    // Fallback: cari berdasarkan kemiripan nama
    const searchKey = namaFile.toLowerCase().replace(/\s+/g, ' ');
    for (const [key, value] of Object.entries(googleDriveFiles)) {
        const keyClean = key.toLowerCase().replace(/\s+/g, ' ');
        if (keyClean.includes(searchKey) || searchKey.includes(keyClean)) {
            if (value.fileId) {
                return getGoogleDriveImageUrl(value.fileId);
            }
        }
    }
    
    return null;
}

// ============================================================
// 2. KATEGORI & WARNA
// ============================================================

const colorMap = {
    "Pengukuran Topografi": "#D2B48C",
    "Pengukuran Fotogrametri": "#38BDF8",
    "Pengukuran Batimetri": "#1E3A8A",
    "Pengukuran BM / Kontrol Geodetik": "#8B4513",
    "Pengolahan Data Spasial": "#4ADE80"
};

function getCategory(pekerjaan) {
    const p = pekerjaan.toLowerCase();
    if (p.includes('topografi') || p.includes('detail desain')) return "Pengukuran Topografi";
    if (p.includes('foto udara') || p.includes('lidar') || p.includes('video') || 
        p.includes('pemotretan') || p.includes('peta foto') || p.includes('foto tegak') ||
        p.includes('uav')) return "Pengukuran Fotogrametri";
    if (p.includes('hidrografi') || p.includes('batimetri') || p.includes('usv')) return "Pengukuran Batimetri";
    if (p.includes('stake out') || p.includes('stakeout') || p.includes('soil test')) return "Pengukuran BM / Kontrol Geodetik";
    if (p.includes('lod 1') || p.includes('dem') || p.includes('pos')) return "Pengolahan Data Spasial";
    return "Pengukuran Topografi";
}

// ============================================================
// 3. BUAT PIN MARKER
// ============================================================

function createPinIcon(color) {
    const svgHtml = `
        <svg class="pin-svg" width="28" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
            <path fill="${color}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                  d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
            <circle cx="12" cy="11" r="4" fill="#FFFFFF" stroke="${color}" stroke-width="1.5"/>
        </svg>
    `;
    return L.divIcon({
        className: 'custom-pin-icon',
        html: svgHtml,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36]
    });
}

// ============================================================
// 4. INISIALISASI PETA
// ============================================================

const map = L.map('map', {
    center: [-2.548926, 118.014863],
    zoom: 5,
    zoomControl: true
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors | PT Geoarta Sinar Mandala'
}).addTo(map);

// ============================================================
// 5. BUAT MARKER DENGAN POPUP
// ============================================================

let totalData = 0;

dataPengalaman.forEach((item) => {
    totalData++;
    const kategori = getCategory(item.pekerjaan);
    const warna = colorMap[kategori] || "#718096";
    
    // Bangun HTML popup
    let imageHTML = '';
    
    if (item.foto && item.foto !== "") {
        const imageUrl = getImageUrl(item.foto);
        
        if (imageUrl) {
            imageHTML = `
                <div class="popup-img-container">
                    <img src="${imageUrl}" alt="${item.pekerjaan}" loading="lazy"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="img-placeholder" style="display:none; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;">
                        <span class="icon">❌</span>
                        <span>Gambar gagal dimuat</span>
                        <br><small style="font-size:9px; color:#a0aec0;">Pastikan file ID sudah benar</small>
                    </div>
                </div>
            `;
        } else {
            imageHTML = `
                <div class="popup-img-container">
                    <div class="img-placeholder">
                        <span class="icon">📁</span>
                        <span>File ID belum diisi</span>
                        <br><small style="font-size:9px; color:#a0aec0;">${item.foto.substring(0, 35)}...</small>
                    </div>
                </div>
            `;
        }
    } else {
        imageHTML = `
            <div class="popup-img-container">
                <div class="img-placeholder">
                    <span class="icon">🖼️</span>
                    <span>Dokumentasi belum tersedia</span>
                </div>
            </div>
        `;
    }

    const popupContent = `
        <div class="popup-card">
            <div class="popup-header">
                <strong>${item.pekerjaan}</strong>
                <span class="badge-year">${item.tahun}</span>
            </div>
            <div class="popup-body">
                <div class="popup-info">
                    <strong>📍 Lokasi:</strong> ${item.lokasi}<br>
                    <strong>🏢 Instansi:</strong> ${item.instansi}<br>
                    <strong>📂 Kategori:</strong> ${kategori}
                </div>
            </div>
            ${imageHTML}
        </div>
    `;

    L.marker([item.lat, item.lng], {
        icon: createPinIcon(warna),
        title: `${item.pekerjaan} - ${item.lokasi}`
    })
    .addTo(map)
    .bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 280
    });
});

// Update counter
document.getElementById('totalPoints').textContent = totalData;

// ============================================================
// 6. LEGENDA PETA
// ============================================================

const legend = L.control({ position: 'topright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<h4>📋 Legenda Pekerjaan</h4>';
    
    for (const [kategori, warna] of Object.entries(colorMap)) {
        const miniPinSvg = `
            <svg class="legend-pin-icon" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
                <path fill="${warna}" stroke="#999" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
                <circle cx="12" cy="11" r="4.5" fill="#FFFFFF"/>
            </svg>
        `;
        div.innerHTML += `
            <div class="legend-item">
                ${miniPinSvg}
                <span>${kategori}</span>
            </div>
        `;
    }
    return div;
};

legend.addTo(map);

// ============================================================
// 7. INFORMASI