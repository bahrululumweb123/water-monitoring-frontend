// --- 1. SCRIPT JAM DIGITAL REAL-TIME DI HEADER ---
function updateLiveClock() {
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timeString = now.toTimeString().split(' ')[0]; // Format HH:MM:SS

        clockElement.innerText = `${year}-${month}-${day} | ${timeString}`;
    }
}

// Jalankan jam setiap detik
setInterval(updateLiveClock, 1000);
updateLiveClock();


// --- 2. SCRIPT RIWAYAT DATA SENSOR DARI EMQX (LOCALSTORAGE) ---
const KEY_RIWAYAT_LOG = 'riwayatSensorEMQX';

function fetchSensorHistory() {
    let dataArray = [];

    try {
        const raw = localStorage.getItem(KEY_RIWAYAT_LOG);
        dataArray = raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Gagal membaca riwayat data log:', error);
        dataArray = [];
    }

    const tableBody = document.getElementById('logTableBody');
    if (!tableBody) return;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 16px;">
                    Menunggu data sensor masuk dari EMQX Cloud...
                </td>
            </tr>
        `;
        return;
    }

    // Tampilkan data terbaru di paling atas
    const dataTerbaru = [...dataArray].reverse();

    let html = '';
    dataTerbaru.forEach(row => {
        const nilaiTds = parseFloat(row.tds);
        let statusText = row.status || "BAIK";
        let statusClass = "text-success";

        // Logika 4 kategori status kualitas air yang konsisten
        if (isNaN(nilaiTds)) {
            statusText = "MENUNGGU...";
            statusClass = "text-muted";
        } else if (nilaiTds <= 300) {
            statusText = row.status || "BAIK";
            statusClass = "text-success";
        } else if (nilaiTds <= 600) {
            statusText = row.status || "CUKUP";
            statusClass = "text-warning";
        } else if (nilaiTds <= 900) {
            statusText = row.status || "KURANG";
            statusClass = "text-orange";
        } else {
            statusText = row.status || "BURUK";
            statusClass = "text-danger";
        }

        html += `
            <tr>
                <td>${row.created_at || '-'}</td>
                <td>${row.tds ?? '-'} ppm</td>
                <td>${row.suhu ?? '-'} °C</td>
                <td>${row.ec ?? '-'} µS/cm</td>
                <td><strong class="${statusClass}">${statusText}</strong></td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Perbarui otomatis jika localStorage berubah atau tiap 3 detik
window.addEventListener('storage', (event) => {
    if (event.key === KEY_RIWAYAT_LOG) {
        fetchSensorHistory();
    }
});

setInterval(fetchSensorHistory, 3000);
fetchSensorHistory();