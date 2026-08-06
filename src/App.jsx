import React, { useState, useEffect, useRef } from 'react';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOAHFZyhAd4h8lpWi1lCB4j94iio5Yu-_qf5XYHUP2dxDBlMfr0_h-wBCdsE4p56yL/exec";

function App() {
  const [lang, setLang] = useState(localStorage.getItem('heraclaus_lang') || 'en');
  const [activeUsers, setActiveUsers] = useState(0);
  const [members, setMembers] = useState([]);
  const [servers, setServers] = useState(null);
  const [freeVersionLink, setFreeVersionLink] = useState('#');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [selectedServer, setSelectedServer] = useState(null);

  // Handle language class toggle on body
  useEffect(() => {
    document.body.className = `lang-${lang} antialiased`;
    localStorage.setItem('heraclaus_lang', lang);
    updateGreeting();
  }, [lang]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isModalOpen || selectedServer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, selectedServer]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    const isEnglish = lang === 'en';
    let greet = "";
    if (hour < 12) greet = isEnglish ? "Good Morning" : "Selamat Pagi";
    else if (hour < 18) greet = isEnglish ? "Good Afternoon" : "Selamat Siang";
    else greet = isEnglish ? "Good Evening" : "Selamat Malam";
    setGreeting(`${greet}, Creator`);
  };

  useEffect(() => {
    // Initial fetch for stats and members
    fetch(GOOGLE_SCRIPT_URL + "?action=get_stats")
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.activeUsers > 0) {
          animateCount(data.activeUsers);
          if (data.members) setMembers(data.members);
        }
      }).catch(err => console.log(err));

    // Fetch free version
    fetch(GOOGLE_SCRIPT_URL + "?action=get_free_version")
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setFreeVersionLink(data.data.link);
        }
      }).catch(err => console.log(err));

    // Fetch servers
    fetchServers();

    // Scroll animation observer
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    
    setTimeout(() => {
      document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));
      setTimeout(() => document.querySelectorAll('.animate-fade-up').forEach(el => el.classList.add('is-visible')), 300);
    }, 100);

    // Security
    const disableContextMenu = (e) => e.preventDefault();
    const disableKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) e.preventDefault();
    };
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeys);
    
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeys);
    };
  }, []);

  const animateCount = (target) => {
    let count = 0;
    const interval = setInterval(() => {
      count += Math.ceil(target / 10);
      if (count >= target) {
        count = target;
        clearInterval(interval);
      }
      setActiveUsers(count);
    }, 40);
  };

  const fetchServers = () => {
    fetch(GOOGLE_SCRIPT_URL + "?action=get_servers")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setServers(data.servers || []);
          // Note: Server status checks are handled per item now
        }
      }).catch(e => console.log(e));
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'id' : 'en');
  };

  return (
    <>
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-app-bg/90 backdrop-blur-md pt-safe px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-sm border-2 border-white bg-slate-200">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-app-textMain leading-tight">{greeting}</h1>
            <p className="text-xs text-app-textSub font-medium">Welcome to Heraclaus</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-bold text-app-textSub shadow-sm border border-app-border hover:text-app-textMain transition-colors">
            {lang === 'en' ? 'ID' : 'EN'}
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-app-textMain shadow-sm border border-app-border hover:bg-gray-50 transition-colors">
            <i className="fa-regular fa-bell text-lg"></i>
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </header>

      <main className="pb-safe px-6 max-w-2xl mx-auto flex flex-col gap-6 mt-2">
        {/* Activity Overview */}
        <section className="animate-fade-up">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-outfit text-lg font-bold text-app-textMain">
              {lang === 'en' ? 'Activity Overview' : 'Ringkasan Aktivitas'}
            </h2>
            <i className="fa-solid fa-chevron-right text-app-textSub text-sm"></i>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Pro Servers */}
            <div className="relative pt-3 cursor-pointer group" onClick={() => setIsModalOpen(true)}>
              <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-purpleTab rounded-t-xl z-0 transition-colors group-hover:bg-purple-300"></div>
              <div className="relative bg-app-purpleBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-purple transition-transform group-hover:-translate-y-1">
                <div className="p-4 relative z-20">
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                    <i className="fa-solid fa-server text-sm"></i>
                  </div>
                  <p className="text-white/90 text-[11px] font-medium mb-0.5">
                    {lang === 'en' ? 'Pro Servers' : 'Server Pro'}
                  </p>
                  <h3 className="text-white font-outfit text-xl font-bold tracking-tight">{activeUsers} <span className="text-sm font-medium opacity-80">Active</span></h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
              </div>
            </div>

            {/* Web Tools */}
            <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('web-tools-section')?.scrollIntoView({behavior:'smooth'})}>
              <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-orangeTab rounded-t-xl z-0 transition-colors group-hover:bg-yellow-300"></div>
              <div className="relative bg-app-orangeBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-orange transition-transform group-hover:-translate-y-1">
                <div className="p-4 relative z-20">
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                    <i className="fa-solid fa-fire text-sm"></i>
                  </div>
                  <p className="text-white/90 text-[11px] font-medium mb-0.5">
                    {lang === 'en' ? 'Web Tools' : 'Alat Web'}
                  </p>
                  <h3 className="text-white font-outfit text-xl font-bold tracking-tight">2 <span className="text-sm font-medium opacity-80">Apps</span></h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('addons-section')?.scrollIntoView({behavior:'smooth'})}>
              <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-blueTab rounded-t-xl z-0 transition-colors group-hover:bg-blue-300"></div>
              <div className="relative bg-app-blueBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-blue transition-transform group-hover:-translate-y-1">
                <div className="p-4 relative z-20">
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                    <i className="fa-solid fa-puzzle-piece text-sm"></i>
                  </div>
                  <p className="text-white/90 text-[11px] font-medium mb-0.5">
                    {lang === 'en' ? 'Add-ons' : 'Daftar Add-on'}
                  </p>
                  <h3 className="text-white font-outfit text-xl font-bold tracking-tight">3 <span className="text-sm font-medium opacity-80">Plugins</span></h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
              </div>
            </div>

            {/* Pro License */}
            <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({behavior:'smooth'})}>
              <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-pinkTab rounded-t-xl z-0 transition-colors group-hover:bg-pink-300"></div>
              <div className="relative bg-app-pinkBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-pink transition-transform group-hover:-translate-y-1">
                <div className="p-4 relative z-20">
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                    <i className="fa-solid fa-crown text-sm"></i>
                  </div>
                  <p className="text-white/90 text-[11px] font-medium mb-0.5">
                    {lang === 'en' ? 'Pro License' : 'Lisensi Pro'}
                  </p>
                  <h3 className="text-white font-outfit text-xl font-bold tracking-tight">$6 <span className="text-sm font-medium opacity-80">One-time</span></h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog */}
        <section id="addons-section" className="animate-fade-up">
          <div className="flex justify-between items-center mb-3 mt-4">
            <h2 className="font-outfit text-lg font-bold text-app-textMain">
              {lang === 'en' ? 'Premium Add-ons' : 'Add-on Premium'}
            </h2>
            <i className="fa-solid fa-ellipsis-vertical text-app-textSub"></i>
          </div>
          
          <div className="bg-app-surface rounded-[1.5rem] p-3 shadow-app flex flex-col gap-1">
            <div className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
                <i className="fa-solid fa-bolt text-xl"></i>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-app-textMain leading-tight">Admin Suite</h3>
                <p className="text-xs text-app-textSub mt-0.5 line-clamp-1">
                  {lang === 'en' ? 'All-in-one economy & management.' : 'Sistem ekonomi & manajemen lengkap.'}
                </p>
              </div>
              <div className="flex-shrink-0 bg-yellow-100 text-yellow-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-yellow-200">
                FLAGSHIP
              </div>
            </div>

            <div className="w-full h-px bg-app-border ml-16"></div>

            <a href="https://www.curseforge.com/minecraft-bedrock/addons/cinemato-studio" target="_blank" rel="noreferrer" className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                <i className="fa-solid fa-video text-xl"></i>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-app-textMain leading-tight">Cinemato Studio</h3>
                <p className="text-xs text-app-textSub mt-0.5 line-clamp-1">
                  {lang === 'en' ? 'Smooth bezier camera tool.' : 'Alat kamera sinematik mulus.'}
                </p>
              </div>
              <div className="flex-shrink-0 text-app-textSub text-xs">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </a>

            <div className="w-full h-px bg-app-border ml-16"></div>

            <a href="https://www.curseforge.com/minecraft-bedrock/addons/heras-requiem" target="_blank" rel="noreferrer" className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                <i className="fa-solid fa-ghost text-xl"></i>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-app-textMain leading-tight">Hera's Requiem</h3>
                <p className="text-xs text-app-textSub mt-0.5 line-clamp-1">
                  {lang === 'en' ? 'Horror atmosphere backsound.' : 'Backsound tema horor.'}
                </p>
              </div>
              <div className="flex-shrink-0 text-app-textSub text-xs">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </a>
          </div>
        </section>

        {/* Web Tools */}
        <section id="web-tools-section" className="animate-fade-up">
          <div className="flex justify-between items-center mb-3 mt-4">
            <h2 className="font-outfit text-lg font-bold text-app-textMain">Web Ecosystem</h2>
          </div>
          
          <div className="bg-app-surface rounded-[1.5rem] p-3 shadow-app flex flex-col gap-1">
            <a href="glyph.html" className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                <i className="fa-solid fa-layer-group text-xl"></i>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-app-textMain leading-tight">Glyph Studio</h3>
                <p className="text-xs text-app-textSub mt-0.5 line-clamp-1">
                  {lang === 'en' ? 'Merge spritesheets & extract UI.' : 'Gabungkan sprite & ekstrak UI.'}
                </p>
              </div>
              <div className="flex-shrink-0 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                NEW
              </div>
            </a>

            <div className="w-full h-px bg-app-border ml-16"></div>

            <a href="pixel.html" className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-500 flex-shrink-0">
                <i className="fa-solid fa-font text-xl"></i>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-app-textMain leading-tight">Pixel Generator</h3>
                <p className="text-xs text-app-textSub mt-0.5 line-clamp-1">
                  {lang === 'en' ? 'Bitmap text & UI export.' : 'Buat teks bitmap & UI pixel.'}
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* Community Servers */}
        <section className="animate-fade-up">
          <div className="flex justify-between items-center mb-3 mt-4">
            <h2 className="font-outfit text-lg font-bold text-app-textMain">
              {lang === 'en' ? 'Community Servers' : 'Server Komunitas'}
            </h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">Live</span>
          </div>
          
          <div className="bg-app-surface rounded-[1.5rem] p-4 shadow-app">
            {!servers ? (
              <div className="text-center py-6 text-app-textSub text-sm">
                <i className="fa-solid fa-circle-notch fa-spin text-xl mb-2"></i><br/>
                {lang === 'en' ? 'Syncing server data...' : 'Memuat data server...'}
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-6 text-app-textSub text-sm">
                {lang === 'en' ? 'No servers registered yet.' : 'Belum ada server yang mendaftar.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {servers.map((s, idx) => (
                  <ServerItem key={s.id || idx} s={s} onClick={() => setSelectedServer(s)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing-section" className="animate-fade-up mt-4">
          <h2 className="font-outfit text-2xl font-bold text-app-textMain text-center mb-1">
            {lang === 'en' ? 'Get Pro License' : 'Dapatkan Lisensi Pro'}
          </h2>
          <p className="text-center text-app-textSub text-sm mb-5">
            {lang === 'en' ? 'Pay once, dominate forever.' : 'Bayar sekali, kuasai selamanya.'}
          </p>

          <div className="bg-app-surface rounded-[1.5rem] p-6 shadow-app border border-purple-100 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl"></div>
            
            <h3 className="font-outfit text-lg font-bold text-purple-600 mb-1">Pro Member</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-outfit text-4xl font-extrabold text-app-textMain">$6</span>
              <span className="text-sm text-app-textSub font-medium">/ {lang === 'en' ? 'one-time' : 'sekali bayar'}</span>
            </div>
            
            <ul className="flex flex-col gap-2.5 mb-6 text-sm text-app-textMain relative z-10">
              <li className="flex items-center gap-3"><i className="fa-solid fa-circle-check text-green-500"></i> {lang === 'en' ? 'Full Admin Suite Features' : 'Fitur Admin Suite Lengkap'}</li>
              <li className="flex items-center gap-3"><i className="fa-solid fa-circle-check text-green-500"></i> {lang === 'en' ? 'Native Login & X-Ray' : 'Fitur Login & X-Ray'}</li>
              <li className="flex items-center gap-3"><i className="fa-solid fa-circle-check text-green-500"></i> {lang === 'en' ? 'Homepage Server Promo' : 'Promo Server di Aplikasi'}</li>
              <li className="flex items-center gap-3"><i className="fa-solid fa-circle-check text-green-500"></i> {lang === 'en' ? 'Permanent Binding' : 'Akses Permanen Selamanya'}</li>
            </ul>
            
            <a href="payment.html" className="block w-full bg-app-textMain text-white font-semibold py-3.5 rounded-xl text-center shadow-md hover:bg-gray-800 transition-colors">
              {lang === 'en' ? 'Upgrade to Pro' : 'Beli Sekarang'}
            </a>
            
            <div className="mt-4 text-center">
              <a href={freeVersionLink} className="text-xs text-app-textSub font-semibold hover:text-app-textMain">
                {lang === 'en' ? 'Or download Free Starter version' : 'Atau unduh versi Gratis (Terbatas)'}
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-app-border px-6 py-3 flex justify-around items-center pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <a href="#" className="flex flex-col items-center gap-1 text-purple-600">
          <i className="fa-solid fa-house text-lg"></i>
          <span className="text-[10px] font-semibold">Home</span>
        </a>
        <a href="#addons-section" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-solid fa-puzzle-piece text-lg"></i>
          <span className="text-[10px] font-semibold">Add-ons</span>
        </a>
        <a href="#web-tools-section" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-solid fa-laptop-code text-lg"></i>
          <span className="text-[10px] font-semibold">Tools</span>
        </a>
        <a href="client.html" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-regular fa-user text-lg"></i>
          <span className="text-[10px] font-semibold">Portal</span>
        </a>
      </nav>

      {/* Bottom Sheet Modal */}
      <div className={`fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-end justify-center ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-app-surface w-full max-w-2xl max-h-[85vh] flex flex-col rounded-t-[2rem] transform transition-transform duration-300 shadow-2xl ${isModalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={() => setIsModalOpen(false)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          <div className="flex justify-between items-center px-6 pb-4 border-b border-app-border shrink-0">
            <h2 className="font-outfit text-xl font-bold flex items-center gap-2 text-app-textMain">
              {lang === 'en' ? 'Pro Members Directory' : 'Direktori Anggota Pro'}
            </h2>
            <div className="bg-purple-100 text-purple-600 px-2.5 py-1 rounded-full text-xs font-bold">
              <i className="fa-solid fa-crown mr-1"></i> VIP
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex flex-col gap-2 flex-grow pb-[max(env(safe-area-inset-bottom),2rem)]">
            {members.length === 0 ? (
              <div className="text-center py-10 text-app-textSub text-sm">
                <i className="fa-solid fa-circle-notch fa-spin text-xl mb-2"></i><br/>Loading members...
              </div>
            ) : (
              members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border-b border-app-border last:border-0 hover:bg-gray-50 transition-colors rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-outfit font-bold text-purple-600 shrink-0">
                    {m.gamertag ? m.gamertag.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-app-textMain font-semibold text-sm truncate">{m.gamertag}</div>
                    <div className="text-app-textSub text-[11px] truncate mt-0.5">{m.email}</div>
                  </div>
                  <div className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded font-bold shrink-0">PRO</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Server Details Modal Popup */}
      <div className={`fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-6 ${selectedServer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-app-surface w-full max-w-sm flex flex-col rounded-3xl overflow-hidden transform transition-all duration-300 shadow-2xl ${selectedServer ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          {selectedServer && (
            <>
              <div className="relative pt-6 px-6 pb-4 border-b border-app-border">
                <button onClick={() => setSelectedServer(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 mb-4">
                  {selectedServer.linkType === 'discord' || (selectedServer.link && selectedServer.link.includes('discord')) 
                    ? <i className="fa-brands fa-discord text-indigo-500 text-2xl"></i>
                    : selectedServer.linkType === 'whatsapp' || (selectedServer.link && (selectedServer.link.includes('whatsapp') || selectedServer.link.includes('wa.me')))
                    ? <i className="fa-brands fa-whatsapp text-green-500 text-2xl"></i>
                    : <i className="fa-solid fa-server text-gray-600 text-2xl"></i>}
                </div>
                <h2 className="font-outfit text-xl font-bold text-app-textMain leading-tight mb-1">{selectedServer.name}</h2>
                <div className="flex items-center gap-2 text-xs font-medium text-app-textSub">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">Bedrock</span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="max-h-32 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-app-textSub uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-app-textMain leading-relaxed whitespace-pre-wrap">{selectedServer.desc || "No description provided."}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center shrink-0">
                  <div>
                    <p className="text-[10px] font-bold text-app-textSub uppercase mb-0.5">IP Address</p>
                    <p className="text-sm font-semibold text-app-textMain select-all">{selectedServer.ip}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-app-textSub uppercase mb-0.5">Port</p>
                    <p className="text-sm font-semibold text-app-textMain select-all">{selectedServer.port || 19132}</p>
                  </div>
                </div>

                <a href={selectedServer.link} target="_blank" rel="noreferrer" className="mt-2 w-full bg-app-textMain text-white font-semibold py-3.5 rounded-xl text-center shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <span>Join Server</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ServerItem({ s, onClick }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const apiPort = s.port ? s.port : '19132';
    fetch(`https://api.mcsrvstat.us/bedrock/2/${s.ip}:${apiPort}`)
      .then(res => res.json())
      .then(data => {
        if (data.online) setStatus({ online: true, players: data.players });
        else setStatus({ online: false });
      })
      .catch(() => setStatus({ online: false, error: true }));
  }, [s]);

  let iconType = 'server';
  let iconClass = 'text-gray-500';
  let bgClass = 'bg-gray-100';

  if (s.linkType === 'discord' || (s.link && s.link.includes('discord'))) {
    iconType = 'discord'; iconClass = 'text-indigo-500'; bgClass = 'bg-indigo-50';
  } else if (s.linkType === 'whatsapp' || (s.link && (s.link.includes('whatsapp') || s.link.includes('wa.me')))) {
    iconType = 'whatsapp'; iconClass = 'text-green-500'; bgClass = 'bg-green-50';
  }

  return (
    <div className="list-item-app relative flex flex-col p-4 rounded-2xl border border-app-border bg-white shadow-sm hover:shadow-md transition-all group" onClick={onClick}>
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center ${iconClass} flex-shrink-0 shadow-sm`}>
          {iconType === 'discord' ? <i className="fa-brands fa-discord text-lg"></i> : iconType === 'whatsapp' ? <i className="fa-brands fa-whatsapp text-lg"></i> : <i className="fa-solid fa-server text-lg"></i>}
        </div>
        <div className="flex-shrink-0">
          {!status ? (
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
          ) : status.online ? (
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
          )}
        </div>
      </div>
      
      <div className="flex-grow">
        <h3 className="font-bold text-sm text-app-textMain leading-tight line-clamp-1 mb-1">{s.name}</h3>
        <p className="text-[10px] text-app-textSub line-clamp-2 leading-snug">{s.desc}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-medium">
        {!status ? (
          <span className="text-gray-400">Pinging...</span>
        ) : status.online ? (
          <span className="text-green-600 font-bold">{status.players.online} <span className="font-normal text-gray-500">Players</span></span>
        ) : (
          <span className="text-red-400">Offline</span>
        )}
      </div>
    </div>
  );
}

export default App;
