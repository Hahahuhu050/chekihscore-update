let state = {
    pemain: [
        { id: 0, nama: "Pemain A", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 1, nama: "Pemain B", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 2, nama: "Pemain C", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" },
        { id: 3, nama: "Pemain D", poin: 0, bintang: 0, hitBakaran: 0, hitMinus: 0, gelaran: "Pemula" }
    ],
    targetMenang: 1000,
    historyRonde: [],
    logs: [],
    customColors: { bg: "#0f172a", btn: "#ca8a04", text: "#eab308" },
    isDarkMode: true,
    rondeKe: 0,
    lastNgebakarTiga: null
};

let undoStack = [];
let chartInstance = null;

function hitSuaraAI(teks) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let rasan = new SpeechSynthesisUtterance(teks);
        rasan.lang = 'id-ID';
        rasan.rate = 1.0; 
        rasan.pitch = 1.0;
        window.speechSynthesis.speak(rasan);
    }
}

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
    input.value = (parseInt(input.value) || 0) + val;
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
    pushLog("⚙️ Target kemenangan diubah menjadi " + state.targetMenang);
    simpanKeLocalStorage();
}

function prosesRondeBerikutnya() {
    undoStack.push(JSON.stringify(state));
    
    let poinRondeIni = [];
    let adaMinus = false;

    for(let i=0; i<4; i++) {
        let ipt = parseInt(document.getElementById(`inputPoin-${i}`).value) || 0;
        poinRondeIni.push(ipt);
        if(ipt < 0) {
            adaMinus = true;
            state.pemain[i].hitMinus++;
        }
    }

    let poinLama = state.pemain.map(p => p.poin);
    let poinBaru = [];

    for(let i=0; i<4; i++) {
        state.pemain[i].poin += poinRondeIni[i];
        poinBaru.push(state.pemain[i].poin);
        let aksi = poinRondeIni[i] >= 0 ? "bertambah " + poinRondeIni[i] : "berkurang " + Math.abs(poinRondeIni[i]);
        pushLog(`🔹 Poin ${state.pemain[i].nama} ${aksi}. Total: ${state.pemain[i].poin}`);
    }

    let korbanKebakarRondeIni = [];
    let pembakarRondeIni = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i !== j && poinLama[j] > poinLama[i] && poinBaru[i] > poinBaru[j] && poinLama[j] > 0) {
                korbanKebakarRondeIni.push(j);
                pembakarRondeIni.push(i);
            }
        }
    }

    let unikKorban = [...new Set(korbanKebakarRondeIni)];
    unikKorban.forEach(kId => {
        state.pemain[kId].poin = 0;
        state.pemain[kId].hitBakaran++;
        pushLog(`💥 ${state.pemain[kId].nama} DISALIP! Kebakar balik ke 0!`);
        efekApiHancur(kId);
    });

    if(unikKorban.length === 3) {
        state.lastNgebakarTiga = pembakarRondeIni[0];
    }

    // KOREKSI UTAMA: Cek Kemenangan Sebelum Menyusun Narasi Suara
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

    // Reset Input Box
    for(let i=0; i<4; i++) document.getElementById(`inputPoin-${i}`).value = '';

    // BANGUN NARASI SUARA AI SESUAI REVISI KORBAN
    let narasiSuara = "";

    if (adaJuara) {
        // JIKA ADA YANG MENANG: Langsung sebut selamat, skip penyebutan poin lain!
        state.pemain[idJuara].bintang++;
        state.pemain.forEach(p => p.poin = 0); // Reset game ke babak baru
        state.historyRonde = [[0,0,0,0]];
        
        narasiSuara = `SELAMAT KEPADA ${namaJuara} dapat bintang 1.`;
        
        efekBintangJatuh();
        efekIconMenang(); // Putar Icon Header
        pushLog(`🎉 ${namaJuara} MEMENANGI GAME DAN MENDAPATKAN BINTANG!`);
    } else {
        // JIKA BIASA: Urutkan penyebutan skor satu per satu seperti semula
        state.pemain.forEach(p => {
            narasiSuara += `${p.nama} sekarang ${p.poin} poin. `;
        });

        // Tambahan gimmick kondisi ronde normal
        if (unikKorban.length > 0) {
            narasiSuara += "mulai dari nol ya.";
        } else if (adaMinus) {
            narasiSuara += "CIEEE MINUS!";
            efekJempolPecundang();
        }
    }

    // Eksekusi Suara
    hitSuaraAI(narasiSuara);

    state.rondeKe++;
    state.historyRonde.push(state.pemain.map(p => p.poin));
    hitungGelarAchievement();
    inisialisasiUI();
    simpanKeLocalStorage();
}

function hitungGelarAchievement() {
    let tertinggi = [...state.pemain].sort((a,b)=>b.poin - a.poin)[0];
    let terbanyakMinus = [...state.pemain].sort((a,b)=>b.hitMinus - a.hitMinus)[0];
    let terbanyakKebakar = [...state.pemain].sort((a,b)=>b.hitBakaran - a.hitBakaran)[0];

    state.pemain.forEach(p => {
        if (p.bintang > 1) p.gelaran = "dewa dari segala dewa 👑";
        else if (state.lastNgebakarTiga === p.id) p.gelaran = "tukang bakar 🧑‍🍳🔥";
        else if (p.id === tertinggi.id && p.poin > 0) p.gelaran = "dewa kartu 🃏";
        else if (p.id === terbanyakKebakar.id && p.hitBakaran > 0) p.gelaran = "hari apes gaada yang tau 🪵";
        else if (p.id === terbanyakMinus.id && p.hitMinus > 0) p.gelaran = "tukang kocok kartu 🔀";
        else p.gelaran = "Pemain Biasa";
    });
}

function eksekusiUndo() {
    if(undoStack.length === 0) return;
    state = JSON.parse(undoStack.pop());
    pushLog("↩️ Tindakan terakhir di-Undo.");
    inisialisasiUI();
    simpanKeLocalStorage();
    hitSuaraAI("Data di undo");
}

function pemicuResetTotal() {
    if(confirm("Apakah kamu yakin mau reset total?")) {
        localStorage.removeItem('sadewa_cekih_state');
        state.pemain.forEach(p => {
            p.poin = 0; p.bintang = 0; p.hitBakaran = 0; p.hitMinus = 0; p.gelaran = "Pemula";
        });
        state.historyRonde = [[0,0,0,0]];
        state.logs = ["Game direset total."];
        state.rondeKe = 0;
        state.lastNgebakarTiga = null;
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('gameplayScreen').classList.add('hidden');
        renderPapanSkor();
        hitSuaraAI("Data berhasil di hapus dari awal");
    }
}

function pushLog(txt) { state.logs.unshift(`[R-${state.rondeKe}] ${txt}`); }
function renderLog() { document.getElementById('tab-log').innerHTML = state.logs.map(l => `<div>${l}</div>`).join(''); }

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    state.historyRonde.forEach((r, idx) => {
        tbody.innerHTML += `<tr class="border-b border-slate-700/50"><td>R-${idx}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`;
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
                    <div>🔥 Kebakar: <b>${p.hitBakaran}x</b></div>
                    <div>⭐ Bintang: <b>${p.bintang}</b></div>
                    <div>📉 Minus: <b>${p.hitMinus}x</b></div>
                </div>
            </div>`;
    });
}

function buatAtauUpdateChart() {
    const ctx = document.getElementById('remiChart').getContext('2d');
    let labels = state.historyRonde.map((_, i) => `R-${i}`);
    let datasets = state.pemain.map((p, idx) => {
        let colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'];
        return {
            label: p.nama,
            data: state.historyRonde.map(r => r[idx]),
            borderColor: colors[idx],
            tension: 0.2,
            fill: false
        };
    });
    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets = datasets;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('text-yellow-500', 'border-b-2', 'border-yellow-500'));
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById('btn-' + tabId).classList.add('text-yellow-500', 'border-b-2', 'border-yellow-500');
}

function efekBintangJatuh() {
    for (let i = 0; i < 40; i++) {
        let el = document.createElement('div');
        el.className = 'falling-star'; el.innerText = '⭐';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 2 + 1) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
}

function efekJempolPecundang() {
    for (let i = 0; i < 5; i++) {
        let el = document.createElement('div');
        el.className = 'floating-emoji'; el.innerText = '👎';
        el.style.left = (Math.random() * 60 + 20) + 'vw';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }
}

function efekApiHancur(id) {
    let card = document.getElementById(`card-${id}`);
    if (card) { card.classList.add('fire-effect'); setTimeout(() => { card.classList.remove('fire-effect'); }, 3000); }
}

function efekIconMenang() {
    let logo = document.getElementById('appLogo');
    if(logo) {
        logo.classList.replace('logo-animasi', 'logo-menang');
        setTimeout(() => {
            logo.classList.replace('logo-menang', 'logo-animasi');
        }, 5000); // Efek putar kencang selama 5 detik setelah menang
    }
}

function ambilScreenshot() {
    let target = document.getElementById('captureArea');
    html2canvas(target, { backgroundColor: '#1e293b' }).then(canvas => {
        let link = document.createElement('a');
        link.download = `Skor-Cekih-SadewaCorp.png`;
        link.href = canvas.toDataURL(); link.click();
    });
}

function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    let b = document.getElementById('mainBody');
    b.className = state.isDarkMode ? "bg-slate-900 text-slate-100 min-h-screen font-sans transition-colors duration-300" : "bg-slate-100 text-slate-900 min-h-screen font-sans transition-colors duration-300";
    document.getElementById('btnTheme').innerText = state.isDarkMode ? "🌙 Gelap" : "☀️ Terang";
    simpanKeLocalStorage();
}

function openCustomizer() { document.getElementById('customizerModal').classList.remove('hidden'); }
function tutupCustomizer() { document.getElementById('customizerModal').classList.add('hidden'); }
function simpanCustomWarna() {
    state.customColors.bg = document.getElementById('cfgBg').value;
    state.customColors.btn = document.getElementById('cfgBtn').value;
    state.customColors.text = document.getElementById('cfgText').value;
    sinkronisasiWarna(); tutupCustomizer(); simpanKeLocalStorage();
}
function sinkronisasiWarna() {
    document.getElementById('mainBody').style.backgroundColor = state.customColors.bg;
    document.getElementById('appTitleText').style.color = state.customColors.text;
    document.getElementById('btnNext').style.backgroundColor = state.customColors.btn;
}
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
}
