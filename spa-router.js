// SPA Router - Menggabungkan semua halaman HTML menjadi 1 aplikasi solid
document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi router pada halaman pertama kali dimuat
    initRouter();
});

function initRouter() {
    interceptLinks();
    
    // Menangani tombol back/forward di browser
    window.addEventListener("popstate", (e) => {
        if (e.state && e.state.path) {
            loadPage(e.state.path, false);
        } else {
            loadPage(window.location.pathname, false);
        }
    });
}

function interceptLinks() {
    document.querySelectorAll("a").forEach(link => {
        // Abaikan link eksternal atau link dengan target="_blank" atau link anchor (#)
        if (link.getAttribute("href") && 
            !link.getAttribute("href").startsWith("http") && 
            !link.getAttribute("href").startsWith("#") &&
            link.getAttribute("target") !== "_blank" &&
            !link.hasAttribute("data-no-spa")) {
            
            // Hapus event listener lama agar tidak dobel
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener("click", (e) => {
                e.preventDefault();
                const path = newLink.getAttribute("href");
                loadPage(path, true);
            });
        }
    });
}

async function loadPage(path, pushToHistory = true) {
    // Tampilkan efek loading (opsional, bisa ditambahkan CSS loading bar)
    document.body.style.opacity = '0.5';
    
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error("Page not found");
        
        const htmlString = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlString, "text/html");
        
        // Ganti judul halaman
        if (newDoc.title) document.title = newDoc.title;
        
        // Ganti class body (misal untuk lang-en/lang-id)
        document.body.className = newDoc.body.className;
        
        // Ganti isi konten body secara utuh
        document.body.innerHTML = newDoc.body.innerHTML;
        
        // --- Eksekusi Ulang Script ---
        // Karena innerHTML tidak menjalankan tag <script>, kita harus memasangnya secara manual
        const scripts = document.body.querySelectorAll("script");
        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            if (oldScript.innerHTML) {
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        // Update URL
        if (pushToHistory) {
            window.history.pushState({ path: path }, newDoc.title, path);
        }
        
        // Re-inisialisasi interceptor link di halaman baru
        interceptLinks();
        
        // Scroll ke atas
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error("Gagal memuat halaman:", error);
        window.location.href = path; // Fallback ke loading normal jika SPA gagal
    } finally {
        document.body.style.opacity = '1';
    }
}
