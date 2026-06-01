    // ... (kode bagian atas fungsi prosesRondeBerikutnya tetap sama)

    // --- LOGIKA PENGATURAN SUARA BARU ---
    if (adaJuara) {
        // Jika ada yang menang tembus target poin
        state.pemain[idJuara].bintang++;
        state.pemain.forEach(p => p.poin = 0); 
        state.historyRonde = [[0,0,0,0]];
        
        hitSuaraAI(`SELAMAT KEPADA ${namaJuara} dapat bintang 1.`);
        
        efekBintangJatuh();
        efekIconMenang();
        pushLog(`🎉 ${namaJuara} MEMENANGI GAME DAN MENDAPATKAN BINTANG!`);
    } else {
        // Jika ronde biasa
        if (unikKorban.length > 0) {
            // Kasus ada yang KEBACAR: AI sebut nama korban + "kebakar", lalu putar 0.mp3
            let namaKorban = unikKorban.map(kId => state.pemain[kId].nama).join(' dan ');
            let teksAI = `${namaKorban} kebakar.`;
            
            hitSuaraLaluPutarMP3(teksAI, "0.mp3");
        } else {
            // Kondisi normal tanpa kebakar: sebut poin satu-satu seperti biasa
            let narasiNormal = "";
            state.pemain.forEach(p => {
                narasiNormal += `${p.nama} sekarang ${p.poin} poin. `;
            });
            if (adaMinus) {
                // REVISI: Mengganti CIEEE MINUS sesuai request kamu
                narasiNormal += "semangat ngocok kartunya.";
                efekJempolPecundang();
            }
            hitSuaraAI(narasiNormal);
        }
    }

    state.rondeKe++;
    state.historyRonde.push(state.pemain.map(p => p.poin));
    hitungGelarAchievement();
    inisialisasiUI();
    simpanKeLocalStorage();
}

// ==========================================
// PENGAMAN AUDIO BARU (Mencegah Audio Macet)
// ==========================================
let audioCache = null;

// Fungsi untuk memaksa browser mengizinkan audio saat user berinteraksi pertama kali
function pancingAudioBrowser() {
    if (!audioCache) {
        audioCache = new Audio("0.mp3");
        audioCache.load(); // Paksa download file ke memori HP
    }
}

// Daftarkan pancingan ke layar aplikasi agar otomatis aktif saat di-klik
document.addEventListener('click', pancingAudioBrowser, { once: true });
document.addEventListener('touchstart', pancingAudioBrowser, { once: true });

function hitSuaraLaluPutarMP3(teks, fileMP3) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        let rasan = new SpeechSynthesisUtterance(teks);
        rasan.lang = 'id-ID';
        rasan.rate = 0.95; 
        rasan.pitch = 0.5; 

        let voices = window.speechSynthesis.getVoices();
        let indoVoice = voices.find(v => v.lang.startsWith('id'));
        if (indoVoice) rasan.voice = indoVoice;

        // Ketika AI selesai ngomong, putar MP3
        rasan.onend = function() {
            try {
                // Gunakan cache yang sudah dipancing tadi agar tidak diblokir browser
                if (audioCache) {
                    audioCache.currentTime = 0; // Reset durasi ke awal
                    audioCache.play().catch(e => {
                        // Jalur alternatif jika cache macet
                        let altAudio = new Audio(fileMP3);
                        altAudio.play();
                    });
                } else {
                    let audio = new Audio(fileMP3);
                    audio.play();
                }
            } catch (e) {
                console.log("Audio gagal berbunyi:", e);
            }
        };

        window.speechSynthesis.speak(rasan);
    }
}
