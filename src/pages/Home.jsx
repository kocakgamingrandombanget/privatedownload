import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [stats, setStats] = useState({ activeUsers: 0 });
  const [servers, setServers] = useState([]);
  const [freeLink, setFreeLink] = useState('#');
  
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOAHFZyhAd4h8lpWi1lCB4j94iio5Yu-_qf5XYHUP2dxDBlMfr0_h-wBCdsE4p56yL/exec";

  useEffect(() => {
    // Fetch Stats
    fetch(GOOGLE_SCRIPT_URL + "?action=get_stats")
      .then(res => res.json())
      .then(data => {
        if(data.status === 'success' && data.activeUsers > 0) {
          setStats({ activeUsers: data.activeUsers });
        }
      }).catch(err => console.log(err));

    // Fetch Servers
    fetch(GOOGLE_SCRIPT_URL + "?action=get_servers")
      .then(res => res.json())
      .then(data => {
        if(data.status === "success") {
          setServers(data.servers || []);
        }
      }).catch(e => console.log(e));

    // Fetch Free Version Link
    fetch(GOOGLE_SCRIPT_URL + "?action=get_free_version")
      .then(res => res.json())
      .then(data => {
        if(data.status === 'success' && data.data) {
          setFreeLink(data.data.link);
        }
      }).catch(err => console.log(err));
  }, []);

  return (
    <>
      <section className="animate-fade-up is-visible">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-outfit text-lg font-bold text-app-textMain">
            <span className="lang-en">Activity Overview</span><span className="lang-id">Ringkasan Aktivitas</span>
          </h2>
          <i className="fa-solid fa-chevron-right text-app-textSub text-sm"></i>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative pt-3 cursor-pointer group">
            <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-purpleTab rounded-t-xl z-0 transition-colors group-hover:bg-purple-300"></div>
            <div className="relative bg-app-purpleBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-purple transition-transform group-hover:-translate-y-1">
              <div className="p-4 relative z-20">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                  <i className="fa-solid fa-server text-sm"></i>
                </div>
                <p className="text-white/90 text-[11px] font-medium mb-0.5"><span className="lang-en">Pro Servers</span><span className="lang-id">Server Pro</span></p>
                <h3 className="text-white font-outfit text-xl font-bold tracking-tight"><span>{stats.activeUsers}</span> <span className="text-sm font-medium opacity-80">Active</span></h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
            </div>
          </div>
          
          <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('web-tools-section')?.scrollIntoView({behavior:'smooth'})}>
            <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-orangeTab rounded-t-xl z-0 transition-colors group-hover:bg-yellow-300"></div>
            <div className="relative bg-app-orangeBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-orange transition-transform group-hover:-translate-y-1">
              <div className="p-4 relative z-20">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                  <i className="fa-solid fa-fire text-sm"></i>
                </div>
                <p className="text-white/90 text-[11px] font-medium mb-0.5"><span className="lang-en">Web Tools</span><span className="lang-id">Alat Web</span></p>
                <h3 className="text-white font-outfit text-xl font-bold tracking-tight">2 <span className="text-sm font-medium opacity-80">Apps</span></h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
            </div>
          </div>
          
          <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('addons-section')?.scrollIntoView({behavior:'smooth'})}>
            <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-blueTab rounded-t-xl z-0 transition-colors group-hover:bg-blue-300"></div>
            <div className="relative bg-app-blueBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-blue transition-transform group-hover:-translate-y-1">
              <div className="p-4 relative z-20">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                  <i className="fa-solid fa-puzzle-piece text-sm"></i>
                </div>
                <p className="text-white/90 text-[11px] font-medium mb-0.5"><span className="lang-en">Add-ons</span><span className="lang-id">Daftar Add-on</span></p>
                <h3 className="text-white font-outfit text-xl font-bold tracking-tight">3 <span className="text-sm font-medium opacity-80">Plugins</span></h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
            </div>
          </div>
          
          <div className="relative pt-3 cursor-pointer group" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({behavior:'smooth'})}>
            <div className="absolute top-0 left-0 w-7/12 h-6 bg-app-pinkTab rounded-t-xl z-0 transition-colors group-hover:bg-pink-300"></div>
            <div className="relative bg-app-pinkBody rounded-2xl rounded-tl-none overflow-hidden z-10 shadow-folder-pink transition-transform group-hover:-translate-y-1">
              <div className="p-4 relative z-20">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                  <i className="fa-solid fa-crown text-sm"></i>
                </div>
                <p className="text-white/90 text-[11px] font-medium mb-0.5"><span className="lang-en">Pro License</span><span className="lang-id">Lisensi Pro</span></p>
                <h3 className="text-white font-outfit text-xl font-bold tracking-tight">$6 <span className="text-sm font-medium opacity-80">One-time</span></h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 folder-glass z-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="addons-section" className="animate-fade-up is-visible">
        <div className="flex justify-between items-center mb-3 mt-4">
          <h2 className="font-outfit text-lg font-bold text-app-textMain">
            <span className="lang-en">Premium Add-ons</span><span className="lang-id">Add-on Premium</span>
          </h2>
        </div>
        <div className="bg-app-surface rounded-[1.5rem] p-3 shadow-app flex flex-col gap-1">
          <div className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
              <i className="fa-solid fa-bolt text-xl"></i>
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-sm text-app-textMain leading-tight">Admin Suite</h3>
              <p className="text-xs text-app-textSub mt-0.5 line-clamp-1"><span className="lang-en">All-in-one economy & management.</span><span className="lang-id">Sistem ekonomi & manajemen lengkap.</span></p>
            </div>
          </div>
        </div>
      </section>
      
      <section id="web-tools-section" className="animate-fade-up is-visible">
        <div className="flex justify-between items-center mb-3 mt-4">
            <h2 className="font-outfit text-lg font-bold text-app-textMain">Web Ecosystem</h2>
        </div>
        <div className="bg-app-surface rounded-[1.5rem] p-3 shadow-app flex flex-col gap-1">
            <div className="list-item-app flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <i className="fa-solid fa-layer-group text-xl"></i>
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-sm text-app-textMain leading-tight">Glyph Studio</h3>
                    <p className="text-xs text-app-textSub mt-0.5 line-clamp-1"><span className="lang-en">Merge spritesheets & extract UI.</span><span className="lang-id">Gabungkan sprite & ekstrak UI.</span></p>
                </div>
            </div>
        </div>
      </section>

      <section id="pricing-section" className="animate-fade-up is-visible mt-4">
        <h2 className="font-outfit text-2xl font-bold text-app-textMain text-center mb-1">
          <span className="lang-en">Get Pro License</span><span className="lang-id">Dapatkan Lisensi Pro</span>
        </h2>
        <div className="bg-app-surface rounded-[1.5rem] p-6 shadow-app border border-purple-100 relative overflow-hidden mt-4">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl"></div>
            <h3 className="font-outfit text-lg font-bold text-purple-600 mb-1">Pro Member</h3>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="font-outfit text-4xl font-extrabold text-app-textMain">$6</span>
                <span className="text-sm text-app-textSub font-medium">/ <span className="lang-en">one-time</span><span className="lang-id">sekali bayar</span></span>
            </div>
            <a href="#" className="block w-full bg-app-textMain text-white font-semibold py-3.5 rounded-xl text-center shadow-md hover:bg-gray-800 transition-colors">
                <span className="lang-en">Upgrade to Pro</span><span className="lang-id">Beli Sekarang</span>
            </a>
            <div className="mt-4 text-center">
                <a href={freeLink} id="btn-free-dl" className="text-xs text-app-textSub font-semibold hover:text-app-textMain">
                    <span className="lang-en">Or download Free Starter version</span><span className="lang-id">Atau unduh versi Gratis (Terbatas)</span>
                </a>
            </div>
        </div>
      </section>
    </>
  );
}
