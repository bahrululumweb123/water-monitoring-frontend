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

// Fungsi Simulasi Ambil Data Sensor untuk Dashboard
function fetchDataSensor() {
    fetch('http://192.168.1.8:8000/api/sensor/latest')
        .then(response => response.json())
        .then(data => {

            const sensorData = data.data || data;

            const tdsEl = document.getElementById('tdsVal');
            const suhuEl = document.getElementById('suhuVal');
            const ecEl = document.getElementById('ecVal');
            
            if(tdsEl) tdsEl.innerHTML = `${data.tds} <span class="unit">ppm</span>`;
            if(suhuEl) suhuEl.innerHTML = `${data.suhu} <span class="unit">°C</span>`;
            if(ecEl) ecEl.innerHTML = `${data.ec} <span class="unit">µS/cm</span>`;
            
            const statusElem = document.getElementById('statusKualitas');
            const cardStatusElem = document.getElementById('cardStatus');

            if (statusElem && cardStatusElem) {
                // Hapus semua class status lama agar bersih
                cardStatusElem.classList.remove('card-bad', 'card-warning', 'card-good');

                // Ubah data.tds menjadi angka menggunakan parseFloat
                const nilaiTds = parseFloat(sensorData.tds);



                if (nilaiTds <= 300) {
                    statusElem.innerText = "BAIK";
                } else if (nilaiTds <= 600) {
                    statusElem.innerText = "CUKUP";
                } else if (nilaiTds <= 900) {
                    statusElem.innerText = "KURANG";
                } else {
                    statusElem.innerText = "BURUK";
                    cardStatusElem.classList.add('card-bad');
                }
            }

        })
        .catch(error => {
            console.log("Menunggu koneksi data dari ESP32...", error);
        });
}

// Jalankan auto-update jika berada di halaman Dashboard
if (document.getElementById('tdsVal')) {
    setInterval(fetchDataSensor, 3000);
}

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

function fetchSensorData() {
    // Ganti URL sesuai dengan alamat API Laravel kamu
    fetch('http://192.168.1.8:8000/api/sensor/latest')
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data) {
                let d = result.data;
                
                // Masukkan data dari database ke elemen HTML dashboard
                document.getElementById('tdsVal').innerText = d.tds;
                document.getElementById('suhuVal').innerText = d.suhu;
                document.getElementById('ecVal').innerText = d.ec;
            }
        })
        .catch(error => console.error('Gagal mengambil data:', error));
}

// Jalankan fungsi setiap 2 detik secara otomatis
setInterval(fetchSensorData, 2000);

// Jalankan sekali saat halaman pertama kali dibuka
fetchSensorData();

const pompaStatusEl = document.getElementById('pompaStatus');
const btnPompaEl = document.getElementById('btnPompa');

// Contoh fungsi saat status pompa diperbarui dari server/API
function updatePompaUI(status) {
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

if (ctxAnalytics) {
    const waterAnalyticsChart = new Chart(ctxAnalytics, {
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

    // Fungsi untuk mengambil data riwayat dari backend Laravel
    function fetchAnalyticsChartData() {
        fetch('http://192.168.1.8:8000/api/sensor/history') // Sesuaikan endpoint history kamu
            .then(response => response.json())
            .then(result => {
                const logs = result.data || result;
                
                // Ambil waktu, suhu, tds, dan ec dari data database
                const labels = logs.map(item => item.created_at);
                const suhuValues = logs.map(item => item.suhu);
                const tdsValues = logs.map(item => item.tds);
                const ecValues = logs.map(item => item.ec); // Parameter EC ditambahkan kembali

                // Masukkan data ke chart
                waterAnalyticsChart.data.labels = labels;
                waterAnalyticsChart.data.datasets[0].data = suhuValues;
                waterAnalyticsChart.data.datasets[1].data = tdsValues;
                waterAnalyticsChart.data.datasets[2].data = ecValues; // Set data EC
                
                waterAnalyticsChart.update();
            })
            .catch(error => console.error('Gagal memuat grafik:', error));
    }

    // Jalankan saat halaman dimuat
    fetchAnalyticsChartData();

    // Refresh otomatis setiap 5 detik
    setInterval(fetchAnalyticsChartData, 5000);
}