document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) e.preventDefault(); });

if (window.location.pathname.endsWith('.html')) window.history.replaceState(null, '', window.location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '') + window.location.search + window.location.hash);
document.querySelectorAll('a').forEach(a => { let h = a.getAttribute('href'); if (h && h.includes('.html')) a.setAttribute('href', h.replace('index.html', '/').replace(/\.html$/, '')); });

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOAHFZyhAd4h8lpWi1lCB4j94iio5Yu-_qf5XYHUP2dxDBlMfr0_h-wBCdsE4p56yL/exec";

let pollingInterval = null;
window.adminMembersData = [];

function t(en, id) {
    return document.body.classList.contains('lang-en') ? en : id;
}

function parseLangDB(text) {
    if (!text) return "";
    let parts = text.split("|||");
    let isEn = document.body.classList.contains('lang-en');
    if (isEn) return parts[0] ? parts[0].trim() : "";
    return (parts.length > 1 && parts[1].trim() !== "") ? parts[1].trim() : parts[0].trim();
}

function toggleLang() {
    const body = document.body;
    if (body.classList.contains('lang-id')) {
        body.classList.remove('lang-id');
        body.classList.add('lang-en');
        localStorage.setItem('heraclaus_lang', 'en');
    } else {
        body.classList.remove('lang-en');
        body.classList.add('lang-id');
        localStorage.setItem('heraclaus_lang', 'id');
    }
    updateDynamicTexts();

    const session = sessionStorage.getItem("heraclaus_session");
    if (session) {
        const data = JSON.parse(session);
        if (data.role === "user") {
            fetchMemberServers();
            fetchGlobalChat();

            const keyEl = document.getElementById("display-key");
            if (keyEl && keyEl.classList.contains("empty")) {
                keyEl.innerText = t("License pending generation...", "Lisensi sedang menunggu dibuat...");
            }

            if (data.addonHistory) renderUserHistoryTable(data.addonHistory);

        } else if (data.role === "admin") {
            fetchAdminDatabase();
            fetchAdminMembers();
            fetchMemberServers();
            fetchGlobalChat();
        }
    }
}

function updateDynamicTexts() {
    const setPh = (id, en, idLang) => { const el = document.getElementById(id); if (el) el.placeholder = t(en, idLang); };

    setPh('login-email', 'Registered email', 'Email terdaftar');
    setPh('login-key', 'HRC-XXXXX', 'HRC-XXXXX');
    setPh('admin-key', 'Enter admin password', 'Masukkan kata sandi admin');

    setPh('srv-name', 'e.g., Heraclaus SMP', 'contoh: Heraclaus SMP');
    setPh('srv-link', 'https://...', 'https://...');
    setPh('srv-ip', 'play.your-server.com', 'play.server-anda.com');
    setPh('srv-port', '19132', '19132');
    setPh('srv-desc', 'Describe the gameplay or features of your server...', 'Jelaskan gameplay atau fitur dari server Anda...');

    setPh('user-chat-input', 'Type a message to everyone...', 'Ketik pesan untuk semua orang...');
    setPh('admin-chat-input', 'Send message as Admin...', 'Kirim pesan peringatan sebagai Admin...');

    setPh('cp-old', 'HRC-XXXXX', 'HRC-XXXXX');
    setPh('cp-new', 'Enter new password', 'Masukkan kata sandi baru');

    setPh('p-version', 'e.g. v6.2.0', 'contoh: v6.2.0');
    setPh('p-mcversion', 'e.g. 1.20.70+', 'contoh: 1.20.70+');
    setPh('p-link-realms', 'Direct Link (Discord CDN)', 'Tautan Langsung (Discord CDN)');
    setPh('p-link-bds', 'Direct Link (Discord CDN)', 'Tautan Langsung (Discord CDN)');

    setPh('e-version', 'e.g. v6.2.0', 'contoh: v6.2.0');
    setPh('e-mcversion', 'e.g. 1.20.70+', 'contoh: 1.20.70+');

    setPh('f-version', 'e.g. v2.1.0 (Free)', 'contoh: v2.1.0 (Gratis)');
    setPh('f-link', 'Direct Link / MediaFire / CurseForge', 'Tautan Langsung / MediaFire / CurseForge');
}

function safelyAttachListener(elementId, eventType, callback) {
    const el = document.getElementById(elementId);
    if (el) { el.addEventListener(eventType, callback); }
}

window.toggleVisibility = function (id, icon) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.innerText === el.getAttribute('data-hidden');
    if (isHidden) {
        el.innerText = el.getAttribute('data-full');
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        el.innerText = el.getAttribute('data-hidden');
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem('heraclaus_lang') || 'en';
    document.body.className = `lang-${savedLang}`;
    updateDynamicTexts();

    const session = sessionStorage.getItem("heraclaus_session");
    if (session) {
        const data = JSON.parse(session);
        if (data.role === "admin") showAdminDashboard(data);
        else showUserDashboard(data);
    }
    const pDate = document.getElementById('p-date');
    if (pDate) pDate.valueAsDate = new Date();

    safelyAttachListener("login-form", "submit", function (e) {
        e.preventDefault();
        const btn = document.getElementById("btn-login"), msgBox = document.getElementById("login-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Checking...', 'Memeriksa...');
        msgBox.style.display = "none"; msgBox.className = "msg-box msg-error";

        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "login", email: document.getElementById("login-email").value.trim(), licenseKey: document.getElementById("login-key").value.trim() }) })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    data.role = "user"; sessionStorage.setItem("heraclaus_session", JSON.stringify(data)); showUserDashboard(data);
                    showToast(t('Welcome back, ', 'Selamat datang kembali, ') + data.gamertag + '!');
                } else throw new Error(data.message);
            }).catch(err => { msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ' + t('Login to Dashboard', 'Masuk ke Dasbor'); });
    });

    safelyAttachListener("admin-login-form", "submit", function (e) {
        e.preventDefault();
        const btn = document.getElementById("btn-admin-login"), msgBox = document.getElementById("admin-login-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Verifying...', 'Memverifikasi...');
        msgBox.style.display = "none"; msgBox.className = "msg-box msg-error";

        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "admin_login", adminPassword: document.getElementById("admin-key").value.trim() }) })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    data.role = "admin"; data.adminPassword = document.getElementById("admin-key").value.trim();
                    sessionStorage.setItem("heraclaus_session", JSON.stringify(data)); showAdminDashboard(data);
                    showToast(t('Access Granted', 'Akses Diizinkan'));
                } else throw new Error(data.message);
            }).catch(err => { msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> ' + t('Authenticate', 'Otentikasi Sistem'); });
    });

    safelyAttachListener("add-server-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!session || session.role !== 'user') return;

        const btn = document.getElementById("btn-add-server");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + t('Processing...', 'Memproses...');

        const payload = {
            action: "add_server", role: "user", email: session.email, gamertag: session.gamertag,
            name: document.getElementById("srv-name").value.trim(),
            desc: document.getElementById("srv-desc").value.trim(),
            ip: document.getElementById("srv-ip").value.trim(),
            port: document.getElementById("srv-port").value.trim(),
            isPortPublic: document.getElementById("srv-port-public").checked,
            linkType: document.getElementById("srv-link-type").value,
            link: document.getElementById("srv-link").value.trim()
        };

        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify(payload) })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    document.getElementById("add-server-form").reset();
                    showToast(t("Server added successfully!", "Server berhasil didaftarkan!"));
                    fetchMemberServers();
                } else { showToast(data.message, true); }
            }).finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ' + t('Register Server', 'Kirim & Daftarkan Server'); });
    });

    safelyAttachListener("user-chat-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        const input = document.getElementById('user-chat-input');
        const text = input.value.trim();
        const btn = document.getElementById('btn-user-chat');

        if (!text) return;
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        input.value = "";

        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "send_global_chat", email: session.email, gamertag: session.gamertag, role: "user", msg: text }) })
            .then(res => res.json()).then(data => { if (data.status === "success") renderChatBox('user-chat-box', data.chat, session); })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; });
    });

    safelyAttachListener("admin-chat-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        const input = document.getElementById('admin-chat-input');
        const text = input.value.trim();
        const btn = document.getElementById('btn-admin-chat');

        if (!text) return;
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        input.value = "";

        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "send_global_chat", adminPassword: session.adminPassword, role: "admin", msg: text }) })
            .then(res => res.json()).then(data => { if (data.status === "success") renderChatBox('admin-chat-box', data.chat, session); })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; });
    });

    safelyAttachListener("btn-download-realms", "click", function () {
        const s = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!s || !s.addonHistory || s.addonHistory.length === 0) return;
        let l = s.addonHistory[0].link;
        try { l = JSON.parse(l).realms; } catch (e) { }
        triggerDownload(l, s.addonHistory[0].versionName);
    });

    safelyAttachListener("btn-download-bds", "click", function () {
        const s = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!s || !s.addonHistory || s.addonHistory.length === 0) return;
        let l = s.addonHistory[0].link;
        try { l = JSON.parse(l).bds; } catch (e) { }
        triggerDownload(l, s.addonHistory[0].versionName);
    });

    safelyAttachListener("admin-publish-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!session || session.role !== 'admin') return logout();
        const btn = document.getElementById("btn-publish-release"), msgBox = document.getElementById("publish-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Publishing...', 'Mengunggah...'); msgBox.style.display = "none";

        const linkObj = { realms: convertDriveLink(document.getElementById("p-link-realms").value.trim()), bds: convertDriveLink(document.getElementById("p-link-bds").value.trim()) };

        const packedSpecial = document.getElementById("p-special-en").value.trim() + "|||" + document.getElementById("p-special-id").value.trim();
        const packedAdded = document.getElementById("p-added-en").value.trim() + "|||" + document.getElementById("p-added-id").value.trim();
        const packedFixed = document.getElementById("p-fixed-en").value.trim() + "|||" + document.getElementById("p-fixed-id").value.trim();
        const packedRemoved = document.getElementById("p-removed-en").value.trim() + "|||" + document.getElementById("p-removed-id").value.trim();
        const packedMaintenance = document.getElementById("p-maintenance-en").value.trim() + "|||" + document.getElementById("p-maintenance-id").value.trim();

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({
                action: "admin_publish_release", adminPassword: session.adminPassword,
                versionName: document.getElementById("p-version").value.trim(), mcVersion: document.getElementById("p-mcversion").value.trim(),
                date: document.getElementById("p-date").value, link: JSON.stringify(linkObj),
                special: packedSpecial,
                added: packedAdded, fixed: packedFixed,
                removed: packedRemoved, maintenance: packedMaintenance, sendEmail: document.getElementById("p-send-email").checked
            })
        })
            .then(res => res.json()).then(data => { if (data.status === "success") { document.getElementById("admin-publish-form").reset(); document.getElementById('p-date').valueAsDate = new Date(); session.history = data.history; sessionStorage.setItem("heraclaus_session", JSON.stringify(session)); renderAdminDatabase(data.history); showToast(t('Published to all users!', 'Pembaruan berhasil dikirim ke semua Klien!')); } else throw new Error(data.message); })
            .catch(err => { msgBox.className = "msg-box msg-error"; msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> ' + t('Publish & Update All', 'Terbitkan & Perbarui Semua'); });
    });

    safelyAttachListener("admin-announcement-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        const btn = document.getElementById("btn-send-announce"), msgBox = document.getElementById("announce-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Processing...', 'Memproses...'); msgBox.style.display = "none";

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow",
            body: JSON.stringify({
                action: "admin_send_announcement",
                adminPassword: session.adminPassword,
                subject: document.getElementById("announce-subject").value,
                body: document.getElementById("announce-body").value,
                imageUrl: document.getElementById("announce-image").value.trim()
            })
        })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    document.getElementById("admin-announcement-form").reset();
                    showToast(t("Announcement sent to all emails!", "Pengumuman berhasil dikirim ke semua email!"));
                } else throw new Error(data.message);
            })
            .catch(err => { msgBox.className = "msg-box msg-error"; msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ' + t('Send Announcement', 'Kirim Pengumuman'); });
    });

    safelyAttachListener("admin-regen-global-form", "submit", function (e) {
        e.preventDefault();
        if (!confirm(t("WARNING! This will reset all players' licenses. Proceed?", "PERINGATAN! Ini akan mereset lisensi semua pemain secara global. Lanjutkan?"))) return;

        const fileInput = document.getElementById('val-file-upload');
        if (!fileInput.files.length) return alert(t("Please select validation.js file first.", "Pilih file validation.js terlebih dahulu."));

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (evt) {
            let fileContent = evt.target.result;

            const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
            const btn = document.getElementById("btn-regen-global");
            btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Resetting Database...', 'Mereset Database...');

            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow",
                body: JSON.stringify({ action: "admin_regenerate_global_keys", adminPassword: session.adminPassword })
            })
                .then(res => res.json()).then(data => {
                    if (data.status === "success") {
                        fileContent = fileContent.replace(/const\s+SECRET_SALT\s*=\s*["'].*?["']\s*;/g, `const SECRET_SALT = "${data.newSalt}";`);

                        const blob = new Blob([fileContent], { type: 'text/javascript' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = "validation.js";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        showToast(t("Database reset & File downloaded successfully!", "Database direset & File berhasil diunduh!"));
                        fileInput.value = "";
                        if (window.fetchAdminMembers) fetchAdminMembers();
                    } else throw new Error(data.message);
                })
                .catch(err => alert("Error: " + err.message))
                .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> ' + t('Reset Database & Modify File', 'Reset Database & Modifikasi File'); });
        };
        reader.readAsText(file);
    });

    safelyAttachListener("admin-free-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!session || session.role !== 'admin') return logout();

        const btn = document.getElementById("btn-update-free"), msgBox = document.getElementById("free-msg");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Processing...', 'Memproses...');
        msgBox.style.display = "none";

        const packedSpecial = document.getElementById("f-special-en").value.trim() + "|||" + document.getElementById("f-special-id").value.trim();

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow",
            body: JSON.stringify({
                action: "admin_update_free_version", adminPassword: session.adminPassword,
                version: document.getElementById("f-version").value.trim(),
                link: document.getElementById("f-link").value.trim(),
                special: packedSpecial,
                sendEmail: document.getElementById("f-send-email").checked
            })
        })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    document.getElementById("admin-free-form").reset();
                    showToast(t('Free version updated & published!', 'Versi gratis berhasil diperbarui!'));
                } else throw new Error(data.message);
            })
            .catch(err => {
                msgBox.className = "msg-box msg-error"; msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block";
            })
            .finally(() => {
                btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> ' + t('Update Free Version', 'Perbarui Versi Gratis');
            });
    });

    safelyAttachListener("edit-release-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!session || session.role !== 'admin') return;
        const btn = document.getElementById("btn-save-edit"), msgBox = document.getElementById("edit-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Saving...', 'Menyimpan...'); msgBox.style.display = "none";

        const linkObj = { realms: convertDriveLink(document.getElementById("e-link-realms").value.trim()), bds: convertDriveLink(document.getElementById("e-link-bds").value.trim()) };

        const packedSpecial = document.getElementById("e-special-en").value.trim() + "|||" + document.getElementById("e-special-id").value.trim();
        const packedAdded = document.getElementById("e-added-en").value.trim() + "|||" + document.getElementById("e-added-id").value.trim();
        const packedFixed = document.getElementById("e-fixed-en").value.trim() + "|||" + document.getElementById("e-fixed-id").value.trim();
        const packedRemoved = document.getElementById("e-removed-en").value.trim() + "|||" + document.getElementById("e-removed-id").value.trim();
        const packedMaintenance = document.getElementById("e-maintenance-en").value.trim() + "|||" + document.getElementById("e-maintenance-id").value.trim();

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({
                action: "admin_edit_release", adminPassword: session.adminPassword, logId: document.getElementById("e-logid").value,
                versionName: document.getElementById("e-version").value.trim(), mcVersion: document.getElementById("e-mcversion").value.trim(),
                date: document.getElementById("e-date").value, link: JSON.stringify(linkObj),
                special: packedSpecial, added: packedAdded, fixed: packedFixed, removed: packedRemoved, maintenance: packedMaintenance
            })
        })
            .then(res => res.json()).then(data => { if (data.status === "success") { session.history = data.history; sessionStorage.setItem("heraclaus_session", JSON.stringify(session)); renderAdminDatabase(data.history); closeEditReleaseModal(); showToast(t('Release updated successfully!', 'Riwayat rilis berhasil diubah!')); } else throw new Error(data.message); })
            .catch(err => { msgBox.className = "msg-box msg-error"; msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> ' + t('Save Changes', 'Simpan Perubahan'); });
    });

    safelyAttachListener("change-pwd-form", "submit", function (e) {
        e.preventDefault(); const session = JSON.parse(sessionStorage.getItem("heraclaus_session")); if (!session) return logout();
        const btn = document.getElementById("btn-change-pwd"), msgBox = document.getElementById("cp-msg");
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Processing...', 'Memproses...'); msgBox.style.display = "none";
        fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "change_password", email: session.email, oldKey: document.getElementById("cp-old").value.trim(), newKey: document.getElementById("cp-new").value.trim() }) })
            .then(res => res.json()).then(data => { if (data.status === "success") { session.licenseKey = document.getElementById("cp-new").value.trim(); sessionStorage.setItem("heraclaus_session", JSON.stringify(session)); document.getElementById("change-pwd-form").reset(); showToast(t('Security updated!', 'Sandi Portal berhasil diperbarui!')); } else throw new Error(data.message); })
            .catch(err => { msgBox.className = "msg-box msg-error"; msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message; msgBox.style.display = "block"; })
            .finally(() => { btn.disabled = false; btn.innerHTML = t('Update Password', 'Perbarui Kata Sandi'); });
    });

    safelyAttachListener("admin-generator-form", "submit", function (e) {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
        if (!session || session.role !== 'admin') return;

        const btn = document.getElementById("btn-generate-lic"), msgBox = document.getElementById("gen-msg");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('Processing...', 'Memproses...');
        msgBox.style.display = "none";

        const gt = document.getElementById("gen-gamertag").value.trim();

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({
                action: "admin_generate_license", adminPassword: session.adminPassword, gamertag: gt
            })
        })
            .then(res => res.json()).then(data => {
                if (data.status === "success") {
                    document.getElementById("gen-result-box").style.display = "block";
                    document.getElementById("gen-display-key").innerText = data.license;
                    showToast(t('License generated successfully!', 'Lisensi berhasil dibuat!'));
                } else throw new Error(data.message);
            })
            .catch(err => {
                msgBox.className = "msg-box msg-error";
                msgBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + err.message;
                msgBox.style.display = "block";
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-gears"></i> ' + t('Generate License', 'Generate Lisensi');
            });
    });
});

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.style.background = 'rgba(244, 63, 94, 0.95)';
    toast.innerHTML = isError ? `<i class="fa-solid fa-circle-exclamation"></i> ${message}` : `<i class="fa-solid fa-circle-check"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { container.removeChild(toast); }, 300); }, 3000);
}

function copyLicenseKey() {
    const keyText = document.getElementById("display-key").innerText;
    if (keyText && keyText !== t("Loading...", "Memuat...") && keyText !== t("License pending generation...", "Lisensi sedang menunggu dibuat...")) {
        const el = document.createElement('textarea'); el.value = keyText; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); showToast(t('License Key copied to clipboard!', 'Kunci Lisensi berhasil disalin!'));
    }
}

window.copyGeneratedKey = function () {
    const keyText = document.getElementById("gen-display-key").innerText;
    if (keyText) {
        const el = document.createElement('textarea');
        el.value = keyText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast(t('License Key copied to clipboard!', 'Kunci Lisensi berhasil disalin!'));
    }
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function toggleAuthMode(mode) {
    document.getElementById('user-login-box').classList.toggle('active', mode === 'user');
    document.getElementById('admin-login-box').classList.toggle('active', mode === 'admin');
}

function renderUserHistoryTable(history) {
    const tbody = document.querySelector("#user-history-table tbody");
    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan='4' style='text-align:center; padding: 2rem;'><i class='fa-regular fa-folder-open' style='font-size: 2rem; color: var(--border-light); display:block; margin-bottom: 0.5rem;'></i><span style='color: var(--text-muted); font-size: 0.85rem;'>${t("No releases available yet.", "Belum ada rilis sistem yang tersedia.")}</span></td></tr>`;
        return;
    }
    tbody.innerHTML = "";
    history.forEach((h, index) => {
        const specialText = parseLangDB(h.special);
        const specialBadge = specialText ? `<div style="color: #f59e0b; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem;"><i class="fa-solid fa-star"></i> ${specialText}</div>` : '';

        const maintText = parseLangDB(h.maintenance);
        const maintBadge = maintText ? `<div style="color: #a855f7; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.2rem;"><i class="fa-solid fa-person-digging"></i> ${maintText}</div>` : '';

        const addedText = parseLangDB(h.added) || parseLangDB(h.fixed) || parseLangDB(h.removed) || maintText;
        const noteStr = addedText ? addedText.split('\n')[0].substring(0, 50) + "..." : t("System patch.", "Patch Sistem.");
        const mcBadge = h.mcVersion ? `<span style="font-size: 0.6rem; color: var(--accent-secondary); background: rgba(59, 130, 246, 0.1); padding: 0.1rem 0.3rem; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2); margin-left: 0.3rem;">MC ${h.mcVersion}</span>` : '';
        let linkData = { realms: '#', bds: '#' }; try { linkData = JSON.parse(h.link); } catch (e) { linkData = { realms: h.link, bds: h.link }; }

        tbody.innerHTML += `<tr>
            <td><span class="version-badge">${h.versionName}</span> ${mcBadge} ${index === 0 ? `<span style="color:var(--accent-success); font-size:0.65rem; margin-left:0.3rem; font-weight:700;">${t('LATEST', 'TERBARU')}</span>` : ''}</td>
            <td>${new Date(h.date).toLocaleDateString(t('en-US', 'id-ID'), { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            <td style="font-size: 0.8rem;">${specialBadge}${maintBadge}<span style="opacity:0.8">${noteStr}</span></td>
            <td style="text-align:right;">
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; height: 100%;">
                    <button onclick="triggerDownload('${linkData.realms}', '${h.versionName}')" class="btn btn-sm btn-outline" title="${t('Download Realms', 'Unduh Realms')}" style="padding: 0 0.5rem;"><i class="fa-solid fa-cube"></i></button>
                    <button onclick="triggerDownload('${linkData.bds}', '${h.versionName}')" class="btn btn-sm btn-outline" style="color: var(--accent-success); border-color: rgba(16, 185, 129, 0.3);" title="${t('Download BDS', 'Unduh Server BDS')}" style="padding: 0 0.5rem;"><i class="fa-solid fa-server"></i></button>
                </div>
            </td>
        </tr>`;
    });
}

function showUserDashboard(data) {
    document.getElementById("main-navbar").style.display = "none"; document.getElementById("auth-section").style.display = "none"; document.getElementById("user-dashboard").classList.add("active");
    const cleanGamertag = data.gamertag ? data.gamertag.trim() : "Player";
    document.getElementById("top-gamertag").innerText = cleanGamertag; document.getElementById("top-avatar").innerText = cleanGamertag.charAt(0).toUpperCase();
    document.getElementById("welcome-name").innerText = cleanGamertag; document.getElementById("profile-email").innerText = data.email || "-";
    document.getElementById("profile-gamertag").innerText = cleanGamertag;

    const keyEl = document.getElementById("display-key");
    if (data.addonLicense) { keyEl.innerText = data.addonLicense; keyEl.classList.remove("empty"); }
    else { keyEl.innerText = t("License pending generation...", "Lisensi sedang menunggu dibuat..."); keyEl.classList.add("empty"); }

    if (data.addonHistory && data.addonHistory.length > 0) {
        document.getElementById("latest-ver-text").innerText = data.addonHistory[0].versionName;
        document.getElementById("addon-badge-version").innerText = data.addonHistory[0].versionName;
    }
    renderUserHistoryTable(data.addonHistory || []);
}

function showAdminDashboard(data) {
    document.getElementById("main-navbar").style.display = "none"; document.getElementById("auth-section").style.display = "none"; document.getElementById("admin-dashboard").classList.add("active");
    renderAdminDatabase(data.history || []);
    fetchAdminDatabase();
}

function fetchMemberServers() {
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "get_servers" }) })
        .then(res => res.json()).then(data => {
            if (data.status === "success") {
                const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
                if (session.role === 'user') renderUserServers(data.servers, session.email);
                if (session.role === 'admin') renderAdminServers(data.servers);
            }
        });
}

function renderUserServers(servers, email) {
    const list = document.getElementById("user-server-list");
    list.innerHTML = "";
    const myServers = servers.filter(s => s.ownerEmail === email);
    if (myServers.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">${t("You haven't registered any servers yet.", "Anda belum pernah mendaftarkan server apapun.")}</div>`;
        return;
    }
    myServers.forEach(s => {
        list.innerHTML += `
        <div class="list-item" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="color:#fff; font-size:1.05rem; font-family: 'Outfit'; margin:0;">${s.name}</h4>
                <button onclick="deleteMemberServer('${s.id}')" class="btn-icon danger" style="width: 2rem; height: 2rem;" title="Hapus Data"><i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i></button>
            </div>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin:0;">${s.ip}:${s.port}</p>
            <p style="color:var(--text-muted); font-size:0.8rem; margin:0; font-style:italic; display:inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.desc}</p>
        </div>`;
    });
}

function renderAdminServers(servers) {
    const list = document.getElementById("admin-server-list");
    list.innerHTML = "";
    if (servers.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">${t("No community servers registered yet.", "Belum ada server komunitas yang terdaftar.")}</div>`;
        return;
    }
    servers.forEach(s => {
        list.innerHTML += `
        <div class="list-item" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="color:#fff; font-size:1.05rem; font-family: 'Outfit'; margin:0;">${s.name} <span style="font-size: 0.7rem; color: var(--accent-primary); background: rgba(139, 92, 246, 0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'Inter'; margin-left: 0.5rem;">By ${s.ownerGamertag}</span></h4>
                <button onclick="deleteMemberServer('${s.id}')" class="btn-icon danger" style="width: 2rem; height: 2rem;"><i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i></button>
            </div>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin:0;">${s.ip}:${s.port}</p>
        </div>`;
    });
}

window.deleteMemberServer = function (id) {
    if (!confirm(t("Are you sure you want to delete this server from the public list?", "Apakah Anda yakin ingin menghapus server ini dari halaman publik?"))) return;
    const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
    const payload = { action: "delete_server", serverId: id, role: session.role };
    if (session.role === 'user') payload.email = session.email;
    if (session.role === 'admin') payload.adminPassword = session.adminPassword;

    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify(payload) })
        .then(res => res.json()).then(data => {
            if (data.status === "success") {
                showToast(t("Server deleted successfully.", "Server berhasil dihapus dari sistem."));
                if (session.role === 'user') renderUserServers(data.servers, session.email);
                if (session.role === 'admin') renderAdminServers(data.servers);
            } else { showToast(data.message, true); }
        });
}

function fetchGlobalChat() {
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "get_global_chat" }) })
        .then(res => res.json()).then(data => {
            if (data.status === "success") {
                const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
                if (session) {
                    if (session.role === 'user') renderChatBox('user-chat-box', data.chat, session);
                    if (session.role === 'admin') renderChatBox('admin-chat-box', data.chat, session);
                }
            }
        });
}

function renderChatBox(boxId, messages, session) {
    const box = document.getElementById(boxId);
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 50;
    box.innerHTML = "";
    if (!messages || messages.length === 0) {
        box.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">${t("No messages yet. Start the conversation!", "Belum ada pesan. Ayo mulai percakapan sekarang!")}</div>`;
        return;
    }
    messages.forEach(m => {
        const isMe = (session.role === 'user' && m.senderEmail === session.email) || (session.role === 'admin' && m.role === 'admin');
        const isAdmin = (session.role === 'admin');
        const canDelete = isMe || isAdmin;

        const bubbleClass = isMe ? 'chat-me' : 'chat-them';
        const adminBadge = m.role === 'admin' ? '<i class="fa-solid fa-shield-halved" style="color:var(--accent-admin); margin-right: 4px;"></i>' : '';
        const senderName = isMe ? t('You', 'Anda') : m.senderGamertag;
        const timeStr = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let deleteBtn = '';
        if (canDelete) {
            deleteBtn = `<button onclick="deleteChatMessage('${m.id}')" title="${t('Delete', 'Hapus')}" style="background:none; border:none; color:inherit; opacity:0.6; cursor:pointer; font-size:0.75rem; margin-left:8px; padding:0; transition: opacity 0.2s;"><i class="fa-solid fa-trash"></i></button>`;
        }

        box.innerHTML += `
        <div class="chat-bubble ${bubbleClass}">
            <div style="font-size:0.75rem; font-weight:700; margin-bottom:0.25rem; opacity:0.9; display:flex; align-items:center;">
                ${adminBadge}${senderName}
            </div>
            ${m.text}
            <div class="chat-time" style="display:flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'}; align-items:center;">
                ${timeStr} ${deleteBtn}
            </div>
        </div>`;
    });
    if (isAtBottom) box.scrollTop = box.scrollHeight;
}

window.deleteChatMessage = function (msgId) {
    if (!confirm(t("Are you sure you want to delete this message?", "Yakin ingin menghapus obrolan ini dari chat global?"))) return;
    const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
    const payload = { action: "delete_global_chat", messageId: msgId, role: session.role };
    if (session.role === 'user') payload.email = session.email;
    if (session.role === 'admin') payload.adminPassword = session.adminPassword;

    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify(payload) })
        .then(res => res.json()).then(data => {
            if (data.status === "success") {
                if (session.role === 'user') renderChatBox('user-chat-box', data.chat, session);
                if (session.role === 'admin') renderChatBox('admin-chat-box', data.chat, session);
            }
        });
}

function fetchAdminDatabase() {
    fetch(GOOGLE_SCRIPT_URL + "?action=get_changelog", { redirect: "follow" })
        .then(res => res.json()).then(data => {
            if (data.status === "success") {
                const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
                if (session) { session.history = data.changelogs; sessionStorage.setItem("heraclaus_session", JSON.stringify(session)); }
                renderAdminDatabase(data.changelogs);
            }
        });
}

function renderAdminDatabase(history) {
    const tbody = document.querySelector("#admin-history-table tbody"); tbody.innerHTML = "";
    if (history.length === 0) return tbody.innerHTML = `<tr><td colspan='5' style='text-align:center; padding: 2rem;'><span style='color: var(--text-muted); font-size: 0.85rem;'>${t("Database is empty.", "Daftar riwayat rilis masih kosong.")}</span></td></tr>`;
    history.forEach(h => {
        let linkDisplay = h.link; try { let parsed = JSON.parse(h.link); linkDisplay = `R: ${parsed.realms}\nB: ${parsed.bds}`; } catch (e) { }
        let dlCount = h.downloads || 0;
        const mcBadge = h.mcVersion ? `<div style="font-size:0.65rem; color: var(--text-muted); margin-top: 0.2rem;">MC: ${h.mcVersion}</div>` : '';

        tbody.innerHTML += `<tr>
            <td><span class="version-badge" style="border-color: rgba(245, 158, 11, 0.4); color: #fcd34d;">${h.versionName}</span> ${mcBadge}</td>
            <td>${new Date(h.date).toLocaleDateString(t('en-US', 'id-ID'), { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            <td><textarea readonly style="background:transparent; border:none; color:var(--text-muted); width:100%; font-size:0.75rem; font-family: monospace; resize:none;" rows="2" onclick="this.select()">${linkDisplay}</textarea></td>
            <td style="text-align: center; font-weight: 600; color: #fff;">${dlCount} <span style="font-size: 0.65rem; font-weight: normal; color: var(--text-muted);">x</span></td>
            <td style="text-align:right;">
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; height: 100%;">
                    <button onclick="openEditReleaseModal(${h.id})" class="btn-icon" title="${t('Edit Release', 'Ubah File Rilis')}" style="color: var(--accent-primary); border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.05);"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteRelease(${h.id})" class="btn-icon danger" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    });
}

window.openEditReleaseModal = function (id) {
    const session = JSON.parse(sessionStorage.getItem("heraclaus_session")); const release = session.history.find(h => h.id === id); if (!release) return;
    document.getElementById("e-logid").value = release.id; document.getElementById("e-version").value = release.versionName;
    document.getElementById("e-mcversion").value = release.mcVersion || ""; document.getElementById("e-date").value = release.date;
    let linkData = { realms: '', bds: '' }; try { linkData = JSON.parse(release.link); } catch (e) { linkData = { realms: release.link, bds: release.link }; }
    document.getElementById("e-link-realms").value = linkData.realms || ""; document.getElementById("e-link-bds").value = linkData.bds || "";

    const splitText = (text) => { if (!text) return ["", ""]; let p = text.split("|||"); return [p[0] || "", p[1] || ""]; };

    const [spEn, spId] = splitText(release.special);
    document.getElementById("e-special-en").value = spEn.trim();
    document.getElementById("e-special-id").value = spId.trim();

    const [addEn, addId] = splitText(release.added);
    document.getElementById("e-added-en").value = addEn.trim();
    document.getElementById("e-added-id").value = addId.trim();

    const [fixEn, fixId] = splitText(release.fixed);
    document.getElementById("e-fixed-en").value = fixEn.trim();
    document.getElementById("e-fixed-id").value = fixId.trim();

    const [rmEn, rmId] = splitText(release.removed);
    document.getElementById("e-removed-en").value = rmEn.trim();
    document.getElementById("e-removed-id").value = rmId.trim();

    const [maintEn, maintId] = splitText(release.maintenance);
    document.getElementById("e-maintenance-en").value = maintEn.trim();
    document.getElementById("e-maintenance-id").value = maintId.trim();

    document.getElementById("edit-release-modal").classList.add("show");
}
window.closeEditReleaseModal = function () { document.getElementById("edit-release-modal").classList.remove("show"); }

function fetchAdminMembers() {
    const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "admin_get_members", adminPassword: session.adminPassword }) })
        .then(res => res.json()).then(data => { if (data.status === "success") { window.adminMembersData = data.members; renderAdminMembers(data.members); } });
}

function renderAdminMembers(members) {
    const tbody = document.querySelector("#admin-members-table tbody"); tbody.innerHTML = "";
    if (!members || members.length === 0) return tbody.innerHTML = `<tr><td colspan='4' style='text-align:center; padding: 2rem;'><span style='color: var(--text-muted); font-size: 0.85rem;'>${t("No members found in database.", "Tidak ada anggota klien di dalam basis data.")}</span></td></tr>`;

    members.forEach((m, index) => {
        let statusBadge = '';
        if (m.status === 'APPROVED') statusBadge = `<span class="badge success">ACTIVE</span>`;
        else if (m.status === 'PENDING') statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fcd34d; border-color: rgba(245, 158, 11, 0.25);">PENDING</span>`;
        else statusBadge = `<span class="badge" style="background: rgba(244, 63, 94, 0.15); color: #fda4af; border-color: rgba(244, 63, 94, 0.25);">${m.status}</span>`;

        let lastActiveStr = t("Never logged in", "Belum pernah login");
        if (m.lastActive && m.lastActive !== "Never") { const d = new Date(m.lastActive); lastActiveStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

        let dlStatsHtml = "";
        try { const dlObj = JSON.parse(m.downloadHistory); for (let v in dlObj) { dlStatsHtml += `<span style="display:inline-block; margin-right: 0.4rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; border:1px solid var(--border-light);">${v}: <span style="color:#fff; font-weight:bold;">${dlObj[v]}x</span></span>`; } } catch (e) { }
        if (!dlStatsHtml) dlStatsHtml = t("No downloads yet", "Belum pernah mengunduh");

        let maskedEmail = m.email || "-";
        if (m.email && m.email.includes('@')) {
            let parts = m.email.split('@');
            maskedEmail = parts[0].substring(0, 3) + '***@' + parts[1];
        }

        let maskedLicense = m.license || "-";
        if (m.license && m.license.length > 10) {
            maskedLicense = '****-****-****-****';
        }

        const emailEye = m.email ? `<i class="fa-solid fa-eye mask-toggle" onclick="toggleVisibility('em-${index}', this)"></i>` : '';
        const licEye = (m.license && m.license.length > 10) ? `<i class="fa-solid fa-eye mask-toggle" onclick="toggleVisibility('lc-${index}', this)"></i>` : '';

        tbody.innerHTML += `<tr>
            <td>
                <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">${m.gamertag}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); display:flex; align-items:center; gap:0.4rem; margin-top:0.2rem;">
                    <span id="em-${index}" data-full="${m.email}" data-hidden="${maskedEmail}">${maskedEmail}</span> ${emailEye}
                </div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.2rem;">${t('Joined: ', 'Bergabung: ')}${new Date(m.date).toLocaleDateString()}</div>
            </td>
            <td>
                ${statusBadge}
                <div style="font-family: monospace; color: var(--accent-primary); font-size: 0.75rem; margin-top: 0.4rem; display:flex; align-items:center; gap:0.4rem;">
                    <span id="lc-${index}" data-full="${m.license || '-'}" data-hidden="${maskedLicense}">${maskedLicense}</span> ${licEye}
                </div>
            </td>
            <td>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.3rem;"><i class="fa-solid fa-clock-rotate-left"></i> ${t('Last:', 'Terakhir:')} ${lastActiveStr}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); display:flex; flex-wrap:wrap; gap:0.2rem; margin-top: 0.25rem;">${dlStatsHtml}</div>
            </td>
            <td style="text-align:right;">
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; height: 100%;">
                    <button onclick="viewInvoice(${index})" class="btn-icon" title="View Invoice" style="width: 2rem; height: 2rem; color: var(--accent-primary); border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.05);"><i class="fa-solid fa-file-invoice-dollar" style="font-size: 0.8rem;"></i></button>
                    <button onclick="adminToggleMemberStatus(${m.row}, '${m.status}')" class="btn-icon" title="Toggle Status (Approve/Suspend)" style="width: 2rem; height: 2rem;"><i class="fa-solid fa-power-off" style="font-size: 0.8rem;"></i></button>
                    <button onclick="adminDeleteMember(${m.row})" class="btn-icon danger" title="Delete Member" style="width: 2rem; height: 2rem;"><i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i></button>
                </div>
            </td>
        </tr>`;
    });
}

window.viewInvoice = function (index) {
    const m = window.adminMembersData[index]; if (!m) return;
    let receiptHtml = '';
    if (m.receipt && m.receipt !== "-" && m.receipt !== "") {
        const match = m.receipt.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) receiptHtml = `<div style="width: 100%; border-radius: 8px; border: 1px solid var(--border-light); margin-top: 0.5rem; background: rgba(0,0,0,0.5); overflow: hidden;"><iframe src="https://drive.google.com/file/d/${match[1]}/preview" width="100%" height="250" style="border:none; display:block;"></iframe></div>`;
        else receiptHtml = `<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center;">External link detected.</p>`;
    } else receiptHtml = `<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-light);">${t('No payment receipt provided.', 'Klien ini tidak mengirimkan bukti transfer apa pun.')}</p>`;

    let maskedEmail = m.email || "-";
    if (m.email && m.email.includes('@')) {
        let parts = m.email.split('@');
        maskedEmail = parts[0].substring(0, 3) + '***@' + parts[1];
    }

    let maskedLicense = m.license || "-";
    if (m.license && m.license.length > 10) {
        maskedLicense = '****-****-****-****';
    }

    const emailEye = m.email ? `<i class="fa-solid fa-eye mask-toggle" onclick="toggleVisibility('inv-em-${index}', this)" style="margin-left:0.4rem;"></i>` : '';
    const licEye = (m.license && m.license.length > 10) ? `<i class="fa-solid fa-eye mask-toggle" onclick="toggleVisibility('inv-lc-${index}', this)" style="margin-left:0.4rem;"></i>` : '';

    const modalBody = document.getElementById('invoice-content');
    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--text-muted); font-size: 0.8rem;">Gamertag</span><span style="color: #fff; font-weight: 600; font-size: 0.85rem;">${m.gamertag}</span></div>
            <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--text-muted); font-size: 0.8rem;">Email</span><span style="color: #fff; font-weight: 500; font-size: 0.85rem; display:flex; align-items:center;"><span id="inv-em-${index}" data-full="${m.email}" data-hidden="${maskedEmail}">${maskedEmail}</span> ${emailEye}</span></div>
            <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--text-muted); font-size: 0.8rem;">Date Joined</span><span style="color: #fff; font-size: 0.85rem;">${new Date(m.date).toLocaleString()}</span></div>
            <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--text-muted); font-size: 0.8rem;">License Key</span><span style="color: var(--accent-primary); font-family: monospace; font-weight: 600; font-size: 0.85rem; padding: 0.1rem 0.4rem; background: rgba(139,92,246,0.1); border-radius: 4px; display:flex; align-items:center;"><span id="inv-lc-${index}" data-full="${m.license || '-'}" data-hidden="${maskedLicense}">${maskedLicense}</span> ${licEye}</span></div>
            <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--text-muted); font-size: 0.8rem;">Status</span><span style="color: ${m.status === 'APPROVED' ? 'var(--accent-success)' : (m.status === 'PENDING' ? '#fcd34d' : 'var(--accent-danger)')}; font-weight: 700; font-size: 0.85rem;">${m.status}</span></div>
        </div>
        <h4 style="font-family: 'Outfit'; color: #fff; font-size: 1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-image" style="color: var(--text-muted); margin-right: 0.4rem;"></i> ${t('Payment Receipt', 'Bukti Pembayaran')}</h4>
        ${receiptHtml}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem;">
            <a href="${m.receipt}" target="_blank" class="btn btn-outline w-full" style="font-size: 0.8rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Image</a>
            <button onclick="exportInvoiceImage(${index}, this)" class="btn btn-gradient w-full" style="font-size: 0.8rem;"><i class="fa-solid fa-file-export"></i> Export Data</button>
        </div>`;
    document.getElementById('invoice-modal').classList.add('show');
}

window.exportInvoiceImage = function (index, btnEl) {
    const m = window.adminMembersData[index]; if (!m) return;
    const originalText = btnEl.innerHTML; btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering...'; btnEl.disabled = true;

    let maskedEmail = m.email || "-";
    if (m.email && m.email.includes('@')) {
        let parts = m.email.split('@');
        maskedEmail = parts[0].substring(0, 3) + '***@' + parts[1];
    }

    let maskedLicense = m.license || "-";
    if (m.license && m.license.length > 10) {
        maskedLicense = '****-****-****-****';
    }

    document.getElementById('ex-gamertag').innerText = m.gamertag;
    document.getElementById('ex-email').innerText = maskedEmail;
    document.getElementById('ex-date').innerText = new Date(m.date).toLocaleString();
    if (document.getElementById('ex-license')) document.getElementById('ex-license').innerText = maskedLicense;

    const exStatusEl = document.getElementById('ex-status'); exStatusEl.innerText = m.status; exStatusEl.style.color = m.status === 'APPROVED' ? '#10b981' : (m.status === 'PENDING' ? '#fcd34d' : '#f43f5e');
    const imgEl = document.getElementById('ex-image'); let imgSrc = m.receipt;
    const match = m.receipt ? m.receipt.match(/\/d\/([a-zA-Z0-9_-]+)/) : null;
    if (match && match[1]) imgSrc = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://drive.google.com/uc?id=' + match[1])}`;

    const renderAndDownload = () => {
        const template = document.getElementById('export-template');
        html2canvas(template, { useCORS: true, allowTaint: true, backgroundColor: '#050505', scale: 2 }).then(canvas => {
            const link = document.createElement('a'); link.download = `Invoice_Heraclaus_${m.gamertag.replace(/[^a-zA-Z0-9]/g, '')}.png`; link.href = canvas.toDataURL('image/png'); link.click();
            btnEl.innerHTML = originalText; btnEl.disabled = false; showToast(t('Invoice exported securely!', 'Invoice gambar berhasil diekspor!'));
        }).catch(e => { showToast(t('Failed to render image. Check console.', 'Gagal melakukan render gambar.'), true); btnEl.innerHTML = originalText; btnEl.disabled = false; });
    };
    if (imgSrc && imgSrc !== "-" && imgSrc !== "") { imgEl.style.display = "block"; imgEl.onload = renderAndDownload; imgEl.onerror = () => { imgEl.style.display = "none"; renderAndDownload(); }; imgEl.src = imgSrc; }
    else { imgEl.style.display = "none"; renderAndDownload(); }
}

window.closeInvoiceModal = function () { document.getElementById('invoice-modal').classList.remove('show'); }
window.adminToggleMemberStatus = function (row, currentStatus) { const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED'; if (!confirm(`Change member status to ${newStatus}?`)) return; const session = JSON.parse(sessionStorage.getItem("heraclaus_session")); fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "admin_toggle_member", adminPassword: session.adminPassword, targetRow: row, newStatus: newStatus }) }).then(res => res.json()).then(data => { if (data.status === "success") { showToast(`Member updated to ${newStatus}`); fetchAdminMembers(); } }); }
window.adminDeleteMember = function (row) { if (!confirm("Warning: This will permanently delete this member's account and license! Proceed?")) return; const session = JSON.parse(sessionStorage.getItem("heraclaus_session")); fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "admin_delete_member", adminPassword: session.adminPassword, targetRow: row }) }).then(res => res.json()).then(data => { if (data.status === "success") { showToast('Member deleted.'); fetchAdminMembers(); } }); }

function switchTab(role, tabId, element) {
    const dash = document.getElementById(`${role}-dashboard`);
    dash.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    dash.querySelectorAll('.sidebar-nav .nav-item').forEach(item => { item.classList.remove('active'); item.classList.remove('admin-active'); });
    document.getElementById(`tab-${role}-${tabId}`).classList.add('active');
    element.classList.add(role === 'admin' ? 'admin-active' : 'active');
    if (window.innerWidth <= 768) toggleSidebar(`${role}-sidebar`);

    if (pollingInterval) clearInterval(pollingInterval);

    if (role === 'user' && tabId === 'social') { fetchGlobalChat(); pollingInterval = setInterval(fetchGlobalChat, 5000); }
    if (role === 'admin' && tabId === 'social') { fetchGlobalChat(); pollingInterval = setInterval(fetchGlobalChat, 5000); }

    if (role === 'user' && tabId === 'server') fetchMemberServers();
    if (role === 'admin' && tabId === 'servers') fetchMemberServers();

    if (role === 'admin' && tabId === 'members') { fetchAdminMembers(); pollingInterval = setInterval(fetchAdminMembers, 10000); }
    if (role === 'admin' && tabId === 'database') { fetchAdminDatabase(); pollingInterval = setInterval(fetchAdminDatabase, 10000); }
}

function triggerDownload(url, versionName) {
    const overlay = document.getElementById('download-overlay');
    const statusText = document.getElementById('dl-status-text');
    overlay.classList.add('show'); statusText.innerText = t("Connecting to secure server...", "Menghubungkan ke server rahasia...");

    if (versionName) recordDownloadStat(versionName);

    setTimeout(() => { statusText.innerText = t("Authenticating license key...", "Mengesahkan kunci lisensi game..."); }, 1500);
    setTimeout(() => { statusText.innerText = t("Requesting file from database...", "Meminta file paket dari database pusat..."); }, 3000);
    setTimeout(() => {
        overlay.classList.remove('show');
        if (url.includes('drive.google.com')) { window.open(url, '_blank'); showToast(t('Download request sent to browser.', 'Permintaan unduh dikirim ke browser.')); }
        else { const tempLink = document.createElement('a'); tempLink.style.display = 'none'; tempLink.href = url; tempLink.setAttribute('download', ''); document.body.appendChild(tempLink); tempLink.click(); document.body.removeChild(tempLink); showToast(t('Download started securely.', 'Proses unduhan aman telah dimulai.')); }
    }, 4500);
}

function recordDownloadStat(versionName) {
    const session = JSON.parse(sessionStorage.getItem("heraclaus_session"));
    if (!session || !versionName) return;
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "record_download", email: session.email, versionName: versionName }) });
}

function convertDriveLink(url) { const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/); return (match && match[1]) ? `https://drive.google.com/uc?export=download&confirm=t&id=${match[1]}` : url; }

window.deleteRelease = function (id) { if (!confirm(t("Delete this release permanently?", "Hapus rilis pembaruan ini selamanya?"))) return; const session = JSON.parse(sessionStorage.getItem("heraclaus_session")); fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", body: JSON.stringify({ action: "admin_delete_release", adminPassword: session.adminPassword, logId: id }) }).then(res => res.json()).then(data => { if (data.status === "success") { session.history = data.history; sessionStorage.setItem("heraclaus_session", JSON.stringify(session)); renderAdminDatabase(data.history); showToast(t('Release deleted.', 'File rilis berhasil dihapus dari database.')); } else alert(data.message); }); }
window.toggleSidebar = function (sidebarId) { const sidebar = document.getElementById(sidebarId), overlay = sidebar.previousElementSibling; sidebar.classList.toggle('show'); overlay.classList.toggle('show'); }
window.logout = function () { sessionStorage.removeItem("heraclaus_session"); location.reload(); }
window.switchTab = switchTab;