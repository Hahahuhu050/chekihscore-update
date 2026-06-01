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
            
            // Nama file langsung diset ke 0.mp3 sesuai request kamu
            hitSuaraLaluPutarMP3(teksAI, "0.mp3");
        } else {
            // Kondisi normal tanpa kebakar: sebut poin satu-satu seperti biasa
            let narasiNormal = "";
            state.pemain.forEach(p => {
                narasiNormal += `${p.nama} sekarang ${p.poin} poin. `;
            });
            if (adaMinus) {
                narasiNormal += "CIEEE MINUS!";
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
