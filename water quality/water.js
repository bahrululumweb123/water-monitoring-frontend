// Fungsi Jam Real-Time di Header
function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const clockElements = document.querySelectorAll('#liveClock');
    clockElements.forEach(el => {
        el.innerText = `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
    });
}

setInterval(updateClock, 1000);
updateClock();

// Fungsi interaksi tombol Device Control
function toggleDevice(deviceName) {
    alert(`Mengirim sinyal kontrol untuk perangkat: ${deviceName}`);
}

// Cek Keamanan Sesi Halaman (Wajib Login)
if (window.location.pathname.includes('index.html') ||
    window.location.pathname.includes('datalog.html') ||
    window.location.pathname.includes('control.html') ||
    window.location.pathname.includes('analytics.html')) {

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

// Fungsi Tombol Logout
function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

const pompaStatusEl = document.getElementById('pompaStatus');
const btnPompaEl = document.getElementById('btnPompa');

// Contoh fungsi saat status pompa diperbarui dari server/API
function updatePompaUI(status) {
    if (!pompaStatusEl || !btnPompaEl) return;

    if (status === 'MENYALA' || status === 'ON') {
        pompaStatusEl.innerText = 'MENYALA';
        pompaStatusEl.style.color = '#10b981'; // Hijau

        btnPompaEl.innerText = 'Matikan';
        btnPompaEl.className = 'btn-action btn-nyala'; // Berubah jadi Hijau
    } else {
        pompaStatusEl.innerText = 'MATI';
        pompaStatusEl.style.color = '#ef4444'; // Merah

        btnPompaEl.innerText = 'Nyalakan';
        btnPompaEl.className = 'btn-action btn-mati'; // Berubah jadi Merah
    }
}

// Inisialisasi Grafik Chart.js untuk Suhu, TDS, dan EC
const ctxAnalytics = document.getElementById('waterAnalyticsChart');
let waterAnalyticsChart = null;

if (ctxAnalytics && typeof Chart !== 'undefined') {
    waterAnalyticsChart = new Chart(ctxAnalytics, {
        type: 'line',
        data: {
            labels: [], // Waktu / Tanggal (Sumbu X)
            datasets: [
                {
                    label: 'Suhu (°C)',
                    borderColor: '#f87171', // Merah
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    data: [],
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'TDS (PPM)',
                    borderColor: '#38bdf8', // Biru
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    data: [],
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'EC (µS/cm)',
                    borderColor: '#34d399', // Hijau
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    data: [],
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
}

// ======================================================
// [BARU] KONEKSI MQTT EMQX CLOUD (WEBSOCKET TLS 8084)
// ======================================================
const EMQX_URL = 'wss://weefde7e.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const EMQX_USERNAME = 'Bahrululummqtt';
const EMQX_PASSWORD = 'Bahrulmqtt123';
const EMQX_TOPIC_DATA = 'skripsi/bahrul/sensor/data';
const RIWAYAT_STORAGE_KEY = 'riwayatSensorEMQX';

function tentukanKualitasAir(tds) {
    const nilaiTds = parseFloat(tds);
    if (Number.isNaN(nilaiTds)) return '-';
    if (nilaiTds <= 300) return 'BAIK';
    if (nilaiTds <= 600) return 'CUKUP';
    if (nilaiTds <= 900) return 'KURANG';
    return 'BURUK';
}

function renderDataLogTable() {
    const tbody =
        document.getElementById('dataLogBody') ||
        document.getElementById('logTableBody') ||
        document.getElementById('datalogBody') ||
        document.querySelector('table tbody');

    if (!tbody) return;

    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem(RIWAYAT_STORAGE_KEY) || '[]');
    } catch (e) {
        console.error('Gagal membaca riwayat data log:', e);
        logs = [];
    }

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 16px;">
                    Menunggu data sensor masuk dari EMQX Cloud...
                </td>
            </tr>
        `;
        return;
    }

    const reversedLogs = [...logs].reverse();

    tbody.innerHTML = reversedLogs
        .map((item) => {
            const kualitas = item.status || tentukanKualitasAir(item.tds);
            return `
                <tr>
                    <td>${item.created_at || '-'}</td>
                    <td>${item.tds ?? '-'}</td>
                    <td>${item.suhu ?? '-'}</td>
                    <td>${item.ec ?? '-'}</td>
                    <td>${kualitas}</td>
                </tr>
            `;
        })
        .join('');
}

function muatRiwayatGrafik() {
    if (!waterAnalyticsChart) return;
    try {
        const logs = JSON.parse(localStorage.getItem(RIWAYAT_STORAGE_KEY) || '[]');
        waterAnalyticsChart.data.labels = logs.map(item => item.created_at);
        waterAnalyticsChart.data.datasets[0].data = logs.map(item => item.suhu);
        waterAnalyticsChart.data.datasets[1].data = logs.map(item => item.tds);
        waterAnalyticsChart.data.datasets[2].data = logs.map(item => item.ec);
        waterAnalyticsChart.update();
    } catch (e) {
        console.error('Gagal memuat riwayat grafik:', e);
    }
}

function simpanKeRiwayatGrafik(suhu, tds, ec, statusCustom) {
    try {
        const logs = JSON.parse(localStorage.getItem(RIWAYAT_STORAGE_KEY) || '[]');
        const waktu = new Date().toLocaleString('id-ID');
        const statusFinal = statusCustom || tentukanKualitasAir(tds);
        logs.push({ created_at: waktu, suhu: suhu, tds: tds, ec: ec, status: statusFinal });
        if (logs.length > 50) logs.shift();
        localStorage.setItem(RIWAYAT_STORAGE_KEY, JSON.stringify(logs));
        muatRiwayatGrafik();
        renderDataLogTable();
    } catch (e) {
        console.error('Gagal menyimpan riwayat grafik:', e);
    }
}

function terapkanDataSensorMQTT(rawPayload) {
    const sensorData = rawPayload.data || rawPayload;
    const tds = parseFloat(sensorData.tds);
    const suhu = parseFloat(sensorData.temperature ?? sensorData.suhu);
    const ec = parseFloat(sensorData.ec);
    const statusPayload = sensorData.status;

    const tdsEl = document.getElementById('tdsVal');
    const suhuEl = document.getElementById('suhuVal');
    const ecEl = document.getElementById('ecVal');

    if (tdsEl && !Number.isNaN(tds)) tdsEl.innerHTML = `${tds} <span class="unit">ppm</span>`;
    if (suhuEl && !Number.isNaN(suhu)) suhuEl.innerHTML = `${suhu} <span class="unit">°C</span>`;
    if (ecEl && !Number.isNaN(ec)) ecEl.innerHTML = `${ec} <span class="unit">µS/cm</span>`;

    const statusElem = document.getElementById('statusKualitas');
    const cardStatusElem = document.getElementById('cardStatus');

    if (statusElem && cardStatusElem && !Number.isNaN(tds)) {
        cardStatusElem.classList.remove('card-bad', 'card-warning', 'card-good');

        if (tds <= 300) {
            statusElem.innerText = 'BAIK';
            cardStatusElem.classList.add('card-good');
        } else if (tds <= 600) {
            statusElem.innerText = 'CUKUP';
            cardStatusElem.classList.add('card-warning');
        } else if (tds <= 900) {
            statusElem.innerText = 'KURANG';
            cardStatusElem.classList.add('card-warning');
        } else {
            statusElem.innerText = 'BURUK';
            cardStatusElem.classList.add('card-bad');
        }
    }

    if (!Number.isNaN(suhu) && !Number.isNaN(tds) && !Number.isNaN(ec)) {
        simpanKeRiwayatGrafik(suhu, tds, ec, statusPayload);
    }
}

function hubungkanEMQXCloud() {
    if (typeof mqtt === 'undefined') {
        console.error('Library MQTT.js belum dimuat di HTML!');
        return;
    }

    const clientId = 'web_bahrul_' + Math.random().toString(16).substring(2, 8);
    const client = mqtt.connect(EMQX_URL, {
        clientId: clientId,
        username: EMQX_USERNAME,
        password: EMQX_PASSWORD,
        clean: true,
        reconnectPeriod: 3000
    });

    const mqttBadge = document.getElementById('mqttStatus');

    client.on('connect', () => {
        console.log('Terhubung ke EMQX Cloud:', clientId);
        if (mqttBadge) mqttBadge.textContent = 'MQTT: Terhubung';
        client.subscribe(EMQX_TOPIC_DATA, { qos: 0 }, (err) => {
            if (err) {
                console.error('Gagal subscribe topik:', EMQX_TOPIC_DATA, err);
            } else {
                console.log('Subscribe topik:', EMQX_TOPIC_DATA);
            }
        });
    });

    client.on('reconnect', () => {
        if (mqttBadge) mqttBadge.textContent = 'MQTT: Menyambung ulang...';
    });

    client.on('offline', () => {
        if (mqttBadge) mqttBadge.textContent = 'MQTT: Terputus';
    });

    client.on('message', (topic, message) => {
        if (topic === EMQX_TOPIC_DATA) {
            try {
                const payload = JSON.parse(message.toString());
                terapkanDataSensorMQTT(payload);
            } catch (err) {
                console.error('Payload MQTT bukan JSON valid:', message.toString(), err);
            }
        }
    });

    client.on('error', (err) => {
        console.error('Koneksi MQTT error:', err);
        if (mqttBadge) mqttBadge.textContent = 'MQTT: Error';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderDataLogTable();
    muatRiwayatGrafik();
    hubungkanEMQXCloud();
});