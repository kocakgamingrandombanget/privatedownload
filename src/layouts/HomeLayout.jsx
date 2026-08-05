import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function HomeLayout() {
  const [lang, setLang] = useState('en');
  
  useEffect(() => {
    const savedLang = localStorage.getItem('heraclaus_lang') || 'en';
    setLang(savedLang);
    document.body.className = `lang-${savedLang} antialiased`;
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'id' : 'en';
    setLang(newLang);
    document.body.className = `lang-${newLang} antialiased`;
    localStorage.setItem('heraclaus_lang', newLang);
  };

  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
  else if (hour >= 18) greeting = 'Good Evening';

  return (
    <>
      <header className="sticky top-0 z-40 bg-app-bg/90 backdrop-blur-md pt-safe px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-sm border-2 border-white">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" alt="Profile" className="w-full h-full object-cover bg-slate-200" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-app-textMain leading-tight">{greeting}, Creator</h1>
            <p className="text-xs text-app-textSub font-medium">Welcome to Heraclaus</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-bold text-app-textSub shadow-sm border border-app-border hover:text-app-textMain transition-colors">
            <span className="lang-en">ID</span><span className="lang-id">EN</span>
          </button>
          <button className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-app-textMain shadow-sm border border-app-border hover:bg-gray-50 transition-colors">
            <i className="fa-regular fa-bell text-lg"></i>
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </header>
      
      <main className="pb-safe px-6 max-w-2xl mx-auto flex flex-col gap-6 mt-2">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-app-border px-6 py-3 flex justify-around items-center pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <Link to="/" className="flex flex-col items-center gap-1 text-purple-600">
          <i className="fa-solid fa-house text-lg"></i>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <a href="#addons-section" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-solid fa-puzzle-piece text-lg"></i>
          <span className="text-[10px] font-semibold">Add-ons</span>
        </a>
        <a href="#web-tools-section" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-solid fa-laptop-code text-lg"></i>
          <span className="text-[10px] font-semibold">Tools</span>
        </a>
        <Link to="/client" className="flex flex-col items-center gap-1 text-app-textSub hover:text-purple-600 transition-colors">
          <i className="fa-regular fa-user text-lg"></i>
          <span className="text-[10px] font-semibold">Portal</span>
        </Link>
      </nav>
    </>
  );
}
