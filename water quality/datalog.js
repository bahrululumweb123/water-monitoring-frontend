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


// --- 2. SCRIPT FETCH RIWAYAT DATA SENSOR ---
function fetchSensorHistory() {
    fetch('http://192.168.1.8:8000/api/sensor/history')
        .then(response => response.json())
        .then(result => {
            // Menyesuaikan dengan struktur data Laravel (bisa result.data atau langsung result)
            const dataArray = result.data || result;
            
            let tableBody = document.getElementById('logTableBody'); 
            if (!tableBody) return;
            
            let html = '';
            dataArray.forEach(row => {
                let nilaiTds = parseFloat(row.tds);
                let statusText = "BAIK";
                let statusClass = "text-success";

                // Logika 4 kategori status kualitas air yang konsisten
                if (isNaN(nilaiTds)) {
                    statusText = "MENUNGGU...";
                    statusClass = "text-muted";
                } else if (nilaiTds <= 300) {
                    statusText = "BAIK";
                    statusClass = "text-success";
                } else if (nilaiTds <= 600) {
                    statusText = "CUKUP";
                    statusClass = "text-warning";
                } else if (nilaiTds <= 900) {
                    statusText = "KURANG";
                    statusClass = "text-orange";
                } else {
                    statusText = "BURUK";
                    statusClass = "text-danger";
                }

                html += `
                    <tr>
                        <td>${row.created_at}</td>
                        <td>${row.tds} ppm</td>
                        <td>${row.suhu} °C</td>
                        <td>${row.ec} µS/cm</td>
                        <td><strong class="${statusClass}">${statusText}</strong></td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch(error => console.error('Gagal memuat data log:', error));
}

// Jalankan fungsi fetch data saat halaman dimuat dan perbarui tiap 3 detik
setInterval(fetchSensorHistory, 3000);
fetchSensorHistory();