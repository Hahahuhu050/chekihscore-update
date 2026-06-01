// Database State Utama
let state = {
    pemain: [
        { id: 0, nama: "Pemain A", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 1, nama: "Pemain B", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 2, nama: "Pemain C", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 3, nama: "Pemain D", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" }
    ],
    targetMenang: 1000,
    historyRonde: [], // Isi: array clone dari poin pemain per ronde
    logs: [],
    customColors: { bg: "#0f172a", btn: "#ca8a04", text: "#eab308" },
    isDarkMode: true,
    rondeKe: 0,
    lastNgebakarTiga: null
};

// Undo stack
let undoStack = [];

let chartInstance = null;

// Audio engine via Speech Synthesis AI bawaan browser (Bisa output ke Bluetooth)
function hitSuaraAI(teks) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Potong antrean suara sebelumnya
        let rasan = new SpeechSynthesisUtterance(teks);
        rasan.lang = 'id-ID';
        rasan.rate = 1.0; 
        rasan.pitch = 1.0;
        window.speechSynthesis.speak(rasan);
    }
}

// Inisialisasi awal load web
window.onload = function() {
    let localData = localStorage.getItem('sadewa_cekih_state');
    if (localData) {
        state = JSON.parse(localData);
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('gameplayScreen').classList.remove('hidden');
        inisialisasiUI();
        sinkronisasiWarna();
    }
};

function simpanKeLocalStorage() {
    localStorage.setItem('sadewa_cekih_state', JSON.stringify(state));
}

function mulaiPermainan() {
    state.pemain[0].nama = document.getElementById('setupA').value || "Pemain A";
    state.pemain[1].nama = document.getElementById('setupB').value || "Pemain B";
    state.pemain[2].nama = document.getElementById('setupC').value || "Pemain C";
    state.pemain[3].nama = document.getElementById('setupD').value || "Pemain D";
    state.targetMenang = parseInt(document.getElementById('setupTarget').value) || 1000;
    
    state.historyRonde = [[0, 0, 0, 0]];
    state.logs = ["Game dimulai. Target poin: " + state.targetMenang];
    
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('gameplayScreen').classList.remove('hidden');
    
    inisialisasiUI();
    simpanKeLocalStorage();
    hitSuaraAI("Selamat bertanding bapak bapak. Semoga beruntung dan tidak terbakar.");
}

function inisialisasiUI() {
    document.getElementById('liveTarget').value = state.targetMenang;
    document.getElementById('thA').innerText = state.pemain[0].nama;
    document.getElementById('thB').innerText = state.pemain[1].nama;
    document.getElementById('thC').innerText = state.pemain[2].nama;
    document.getElementById('thD').innerText = state.pemain[3].nama;
    
    renderPapanSkor();
    renderLog();
    renderHistoryTable();
    renderStatistik();
    buatAtauUpdateChart();
}

function renderPapanSkor() {
    const container = document.getElementById('papanSkorContainer');
    container.innerHTML = '';
    
    // Urutkan peringkat berdasarkan poin tertinggi
    let sortedPemain = [...state.pemain].sort((a,b) => b.poin - a.poin);

    state.pemain.forEach((p) => {
        let rank = sortedPemain.findIndex(sp => sp.id === p.id) + 1;
        let pFlg = document.getElementById(`card-${p.id}`)?.classList.contains('fire-effect') ? 'fire-effect' : '';

        container.innerHTML += `
            <div id="card-${p.id}" class="bg-slate-700/40 p-4 rounded-xl border border-slate-600 flex flex-col justify-between shadow transition ${pFlg}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center space-x-1">
                            <input type="text" value="${p.nama}" onchange="editNamaLive(${p.id}, this.value)" class="bg-transparent font-bold text-lg text-slate-100 focus:bg-slate-800 rounded px-1 w-32 sm:w-44 truncate">
                            <span class="text-xs font-mono px-1.5 py-0.5 bg-slate-800 rounded text-yellow-400">#${rank}</span>
                        </div>
                        <div class="text-xs text-amber-400 font-semibold mt-0.5">🎖️ ${p.gelaran}</div>
                        <div class="text-xs text-slate-400 mt-1">Bintang: ${'⭐'.repeat(p.bintang) || '0'}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-black text-yellow-400" id="vpoin-${p.id}">${p.poin}</div>
                        <span class="text-[10px] text-slate-400">pts</span>
                    </div>
                </div>
                
                <!-- Input Manual & Tombol Plus Minus Temp -->
                <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-1">
                    <button onclick="adjustTempPoin(${p.id}, -10)" class="bg-slate-800 text-xs font-bold px-2 py-1 rounded text-red-400 hover:bg-slate-900">-10</button>
                    <button onclick="adjustTempPoin(${p.id}, -1)" class="bg-slate-800 text-xs font-bold px-1.5 py-1 rounded text-red-400 hover:bg-slate-900">-1</button>
                    <input type="number" id="inputPoin-${p.id}" placeholder="0" class="w-14 bg-slate-900 border border-slate-600 rounded text-center text-white py-1 font-bold text-sm">
                    <button onclick="adjustTempPoin(${p.id}, 1)" class="bg-slate-800 text-xs font-bold px-1.5 py-1 rounded text-emerald-400 hover:bg-slate-900">+1</button>
                    <button onclick="adjustTempPoin(${p.id}, 10)" class="bg-slate-800 text-xs font-bold px-2 py-1 rounded text-emerald-400 hover:bg-slate-900">+10</button>
                </div>
            </div>
        `;
    });
}

function adjustTempPoin(id, val) {
    let input = document.getElementById(`inputPoin-${id}`);
    let cur = parseInt(input.value) || 0;
    input.value = cur + val;
}

function editNamaLive(id, namaBaru) {
    if(!namaBaru.trim()) return;
    state.pemain[id].nama = namaBaru;
    document.getElementById(`th${String.fromCharCode(65+id)}`).innerText = namaBaru;
    simpanKeLocalStorage();
    renderPapanSkor();
    renderStatistik();
}

function ubahTargetLive() {
    state.targetMenang = parseInt(document.getElementById('liveTarget').value) || 1000;
    pushLog("⚙️ Target kemenangan diubah di tengah permainan menjadi " + state.targetMenang + " poin.");
    simpanKeLocalStorage();
}

// ALGORITMA UTAMA: HITUNG RONDE & BAKARAN SALIP OTOMATIS
function prosesRondeBerikutnya() {
    // Save history buat undo
    undoStack.push(JSON.stringify(state));
    
    let poinRondeIni = [];
    let adaMinus = false;
    let daftarMinusPemain = [];

    // Baca input
    for(let i=0; i<4; i++) {
        let ipt = parseInt(document.getElementById(`inputPoin-${i}`).value) || 0;
        poinRondeIni.push(ipt);
        if(ipt < 0) {
            adaMinus = true;
            state.pemain[i].hitMinus++;
            daftarMinusPemain.push(state.pemain[i].nama);
        }
    }

    let poinLama = state.pemain.map(p => p.poin);
    let poinBaru = [];

    // Tambah poin sementara
    for(let i=0; i<4; i++) {
        state.pemain[i].poin += poinRondeIni[i];
        poinBaru.push(state.pemain[i].poin);
        
        let aksi = poinRondeIni[i] >= 0 ? "bertambah " + poinRondeIni[i] : "berkurang " + Math.abs(poinRondeIni[i]);
        pushLog(`🔹 Poin ${state.pemain[i].nama} ${aksi}. Total: ${state.pemain[i].poin}`);
    }

    // Deteksi Bakaran Saling Terhubung (Salip-Menyalip)
    let suaraBakaranTeks = "";
    let korbanKebakarRondeIni = [];
    let pembakarRondeIni = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i !== j) {
                // Syarat: J di atas I di ronde sebelumnya, tapi disalip di ronde ini
                if (poinLama[j] > poinLama[i] && poinBaru[i] > poinBaru[j] && poinLama[j] > 0) {
                    korbanKebakarRondeIni.push(j);
                    pembakarRondeIni.push(i);
                }
            }
        }
    }

    // Eksekusi pembersihan korban bakaran (Reset ke 0)
    // Gunakan Set agar tidak double reset kalau disalip 2 orang sekaligus
    let unikKorban = [...new Set(korbanKebakarRondeIni)];
    unikKorban.forEach(kId => {
        state.pemain[kId].poin = 0;
        state.pemain[kId].hitBakaran++;
        pushLog(`💥 ${state.pemain[kId].nama} DISALIP! Kebakar balik ke 0!`);
        efekApiHancur(kId);
    });

    // Cek achievement tukang bakar 3 orang sekaligus
    if(unikKorban.length === 3) {
        let siPembakar = pembakarRondeIni[0];
        state.lastNgebakarTiga = siPembakar;
        pushLog(`🔥 GOKIL! ${state.pemain[siPembakar].nama} ngebakar semua orang sekaligus!`);
    }

    // Cek Kemenangan / Tutup Target (Mencapai batas target poin)
    let adaJuara = false;
    let namaJuara = "";
    let idJuara = null;

    state.pemain.forEach(p => {
        if(p.poin >= state.targetMenang) {
            adaJuara = true;
            namaJuara = p.nama;
            idJuara = p.id;
        }
    });

    // Update Achievement / Gelaran Titel Tokoh
    hitungGelarAchievement();

    // Simpan data history
    state.rondeKe++;
    state.historyRonde.push(state.pemain.map(p => p.poin));

    // AUDIO VOCAL LOGIC
    let narasiSuara = "";
    // 1. Beritahu skor ronde ini
    state.pemain.forEach(p => {
        narasiSuara += `${p.nama} sekarang ${p.poin} poin. `;
    });

    // 2. Tambah gimmick suara khusus sesuai prioritas kejadian
    if(adaJuara) {
        state.pemain[idJuara].bintang++;
        // Reset poin turnamen untuk babak bintang selanjutnya
        state.pemain.forEach(p => p.poin = 0);
        state.historyRonde = [[0,0,0,0]];
        narasiSuara += `SELAMAT KEPADA ${namaJuara} dapat bintang 1. `;
        efekBintangJatuh();
        pushLog(`🎉 ${namaJuara} MEMENANGI GAME DAN MENDAPATKAN BINTANG!`);
    } else if(unikKorban.length > 0) {
        narasiSuara += "mulai dari nol ya. ";
    } else if(adaMinus) {
        narasiSuara += "CIEEE MINUS! ";
        efekJempolPecundang();
    }

    // Mainkan suara gabungan
    hitSuaraAI(narasiSuara);

    // Refresh Komponen
    state.pemain.forEach((p, idx) => {
        document.getElementById(`inputPoin-${idx}`).value = '';
    });

    inisialisasiUI();
    simpanKeLocalStorage();
}

function hitungGelarAchievement() {
    // Cari status ekstrem
    let tertinggi = [...state.pemain].sort((a,b)=>b.poin - a.poin)[0];
    let terbanyakMinus = [...state.pemain].sort((a,b)=>b.hitMinus - a.hitMinus)[0];
    let terbanyakKebakar = [...state.pemain].sort((a,b)=>b.hitBakaran - a.hitBakaran)[0];

    state.pemain.forEach(p => {
        if (p.bintang > 1) {
            p.gelaran = "dewa dari segala dewa 👑";
        } else if (state.lastNgebakarTiga === p.id) {
            p.gelaran = "tukang bakar 🧑‍🍳🔥";
        } else if (p.id === tertinggi.id && p.poin > 0) {
            p.gelaran = "dewa kartu 🃏";
        } else if (p.id === terbanyakKebakar.id && p.hitBakaran > 0) {
            p.gelaran = "hari apes gaada yang tau 🪵";
        } else if (p.id === terbanyakMinus.id && p.hitMinus > 0) {
            p.gelaran = "tukang kocok kartu 🔀";
        } else {
            p.gelaran = "Pemain Biasa";
        }
    });
}

function eksekusiUndo() {
    if(undoStack.length === 0) {
        alert("Belum ada data ronde yang bisa di-undo!");
        return;
    }
    let dataSebelumnya = undoStack.pop();
    state = JSON.parse(dataSebelumnya);
    pushLog("↩️ Tindakan terakhir dibatalkan (Undo dijalankan).");
    inisialisasiUI();
    simpanKeLocalStorage();
    hitSuaraAI("Data di undo");
}

function pemicuResetTotal() {
    if(confirm("Apakah kamu yakin mau reset total? Semua poin, bintang, dan statistik akan dihapus.")) {
        localStorage.removeItem('sadewa_cekih_state');
        state.pemain.forEach(p => {
            p.poin = 0; p.bintang = 0; p.hitBakaran = 0; p.hitMinus = 0; p.gelaran = "Pemula";
        });
        state.historyRonde = [[0,0,0,0]];
        state.logs = ["Game direset total oleh juri tulis."];
        state.rondeKe = 0;
        state.lastNgebakarTiga = null;
        
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('gameplayScreen').classList.add('hidden');
        hitSuaraAI("Data berhasil di hapus dari awal");
    }
}

// LOG DAN TABLE RENDERER
function pushLog(txt) {
    state.logs.unshift(`[R-${state.rondeKe}] ${txt}`);
}

function renderLog() {
    const box = document.getElementById('tab-log');
    box.innerHTML = state.logs.map(l => `<div>${l}</div>`).join('');
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    state.historyRonde.forEach((r, idx) => {
        tbody.innerHTML += `
            <tr class="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td class="p-1 text-slate-400 font-bold">R-${idx}</td>
                <td class="p-1">${r[0]}</td>
                <td class="p-1">${r[1]}</td>
                <td class="p-1">${r[2]}</td>
                <td class="p-1">${r[3]}</td>
            </tr>
        `;
    });
}

function renderStatistik() {
    const box = document.getElementById('statsContainer');
    box.innerHTML = '';
    state.pemain.forEach(p => {
        box.innerHTML += `
            <div class="bg-slate-700/20 p-2 rounded border border-slate-700">
                <div class="font-bold text-yellow-500 truncate">${p.nama}</div>
                <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mt-1">
                    <div>🔥 Kebakar: <b class="text-white">${p.hitBakaran}x</b></div>
                    <div>⭐ Bintang: <b class="text-white">${p.bintang}</b></div>
                    <div>📉 Sering Minus: <b class="text-white">${p.hitMinus}x</b></div>
                </div>
            </div>
        `;
    });
}

// VISUAL CHART ENGINE
function buatAtauUpdateChart() {
    const ctx = document.getElementById('remiChart').getContext('2d');
    let labels = state.historyRonde.map((_, i) => `R-${i}`);
    
    let datasets = state.pemain.map((p, idx) => {
        let colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'];
        return {
            label: p.nama,
            data: state.historyRonde.map(r => r[idx]),
            borderColor: colors[idx],
            backgroundColor: colors[idx] + '22',
            tension: 0.2,
            fill: false
        };
    });

    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets = datasets;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
                scales: {
                    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}

// TAB MANAGEMENT
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-yellow-500', 'border-b-2', 'border-yellow-500');
        b.classList.add('text-slate-400');
    });
    
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById('btn-' + tabId).classList.add('text-yellow-500', 'border-b-2', 'border-yellow-500');
}

// EFEK ANIMASI DAN GRAFIS KHUSUS
function efekBintangJatuh() {
    for (let i = 0; i < 40; i++) {
        let el = document.createElement('div');
        el.className = 'falling-star';
        el.innerText = '⭐';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 2 + 1) + 's';
        el.style.delay = Math.random() * 0.5 + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
}

function efekJempolPecundang() {
    for (let i = 0; i < 5; i++) {
        let el = document.createElement('div');
        el.className = 'floating-emoji';
        el.innerText = '👎';
        el.style.left = (Math.random() * 60 + 20) + 'vw';
        el.style.animationDuration = '2s';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }
}

function efekApiHancur(id) {
    let card = document.getElementById(`card-${id}`);
    if (card) {
        card.classList.add('fire-effect');
        setTimeout(() => { card.classList.remove('fire-effect'); }, 3000);
    }
}

// SCREENSHOT CAPTURE ENGINE
function ambilScreenshot() {
    let target = document.getElementById('captureArea');
    html2canvas(target, { backgroundColor: '#1e293b' }).then(canvas => {
        let link = document.createElement('a');
        link.download = `Skor-Remi-SadewaCorp-Ronde-${state.rondeKe}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// THEME & CUSTOMIZER WARNA SYSTEM
function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    let b = document.getElementById('mainBody');
    if(!state.isDarkMode) {
        b.classList.replace('bg-slate-900', 'bg-slate-100');
        b.classList.replace('text-slate-100', 'text-slate-900');
        document.getElementById('btnTheme').innerText = "☀️ Terang";
    } else {
        b.classList.replace('bg-slate-100', 'bg-slate-900');
        b.classList.replace('text-slate-900', 'text-slate-100');
        document.getElementById('btnTheme').innerText = "🌙 Gelap";
    }
    simpanKeLocalStorage();
}

function openCustomizer() { document.getElementById('customizerModal').classList.remove('hidden'); }
function tutupCustomizer() { document.getElementById('customizerModal').classList.add('hidden'); }

function simpanCustomWarna() {
    state.customColors.bg = document.getElementById('cfgBg').value;
    state.customColors.btn = document.getElementById('cfgBtn').value;
    state.customColors.text = document.getElementById('cfgText').value;
    
    sinkronisasiWarna();
    tutupCustomizer();
    simpanKeLocalStorage();
}

function sinkronisasiWarna() {
    document.getElementById('mainBody').style.backgroundColor = state.customColors.bg;
    document.getElementById('appTitleText').style.color = state.customColors.text;
    document.getElementById('btnNext').style.backgroundColor = state.customColors.btn;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}
