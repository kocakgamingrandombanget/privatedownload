import React, { useState, useEffect } from 'react';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOAHFZyhAd4h8lpWi1lCB4j94iio5Yu-_qf5XYHUP2dxDBlMfr0_h-wBCdsE4p56yL/exec";

export default function ClientPortal({ lang }) {
  const [authMode, setAuthMode] = useState('user'); 
  const [session, setSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem('heraclaus_session');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState(''); 
  const [servers, setServers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminReleases, setAdminReleases] = useState(session?.history || []);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (session) {
      if (session.role === 'admin' && !activeTab) {
        setActiveTab('members');
        fetchAdminMembers();
      }
      if (session.role === 'user' && !activeTab) {
        setActiveTab('servers');
        fetchServers();
      }
    }
  }, [session]);

  useEffect(() => {
    if (activeTab === 'chat') fetchGlobalChat();
    if (activeTab === 'database' && session?.role === 'admin') fetchAdminReleases();
  }, [activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload = authMode === 'user' 
        ? { action: 'login', email: email.trim(), licenseKey: licenseKey.trim() }
        : { action: 'admin_login', adminPassword: adminPassword.trim() };

      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        const newSession = authMode === 'user'
          ? { role: 'user', ...data.user, history: data.history }
          : { role: 'admin', adminPassword: adminPassword.trim(), history: data.history };
        
        sessionStorage.setItem('heraclaus_session', JSON.stringify(newSession));
        setSession(newSession);
        if (authMode === 'admin') setAdminReleases(data.history || []);
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg(lang === 'en' ? 'Network error or server busy.' : 'Koneksi gagal atau server sibuk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('heraclaus_session');
    setSession(null);
    setActiveTab('');
  };

  const fetchServers = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_servers" }) });
      const data = await res.json();
      if (data.status === "success") setServers(data.servers || []);
    } catch (e) { console.error(e); }
  };

  const fetchGlobalChat = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_global_chat" }) });
      const data = await res.json();
      if (data.status === "success") setChatMessages(data.chat || []);
    } catch (e) { console.error(e); }
  };

  const fetchAdminMembers = async () => {
    if (!session || session.role !== 'admin') return;
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_get_members", adminPassword: session.adminPassword }) });
      const data = await res.json();
      if (data.status === "success") setAdminMembers(data.members || []);
    } catch (e) { console.error(e); }
  };

  const fetchAdminReleases = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_changelog" }) });
      const data = await res.json();
      if (data.status === "success") setAdminReleases(data.history || []);
    } catch (e) { console.error(e); }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    const payload = session.role === 'user' 
      ? { action: "send_global_chat", email: session.email, gamertag: session.gamertag, role: "user", msg }
      : { action: "send_global_chat", adminPassword: session.adminPassword, role: "admin", msg };
    
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.status === "success") setChatMessages(data.chat || []);
    } catch (e) { console.error(e); }
  };

  const deleteChat = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    const payload = session.role === 'user'
      ? { action: "delete_global_chat", email: session.email, msgId }
      : { action: "delete_global_chat", adminPassword: session.adminPassword, msgId };
    
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.status === "success") setChatMessages(data.chat || []);
    } catch (e) { console.error(e); }
  };

  const toggleMember = async (row, currentStatus) => {
    const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_toggle_member", adminPassword: session.adminPassword, targetRow: row, newStatus }) });
      const data = await res.json();
      if (data.status === "success") fetchAdminMembers();
    } catch (e) { console.error(e); }
  };

  const recordDownload = (versionName) => {
    if (!session || session.role !== 'user') return;
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "record_download", email: session.email, versionName }) });
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 w-full max-w-sm flex flex-col items-center relative overflow-hidden">
          
          <div className="w-full flex bg-gray-100 rounded-xl p-1 mb-8">
            <button 
              onClick={() => { setAuthMode('user'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'user' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              User Login
            </button>
            <button 
              onClick={() => { setAuthMode('admin'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'admin' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Admin Gateway
            </button>
          </div>

          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-4">
            <i className={`fa-solid ${authMode === 'user' ? 'fa-user-lock' : 'fa-shield-halved'}`}></i>
          </div>
          
          <h2 className="text-2xl font-outfit font-extrabold text-app-textMain mb-1">
            {authMode === 'user' ? (lang === 'en' ? 'Client Portal' : 'Portal Klien') : (lang === 'en' ? 'Admin Access' : 'Akses Admin')}
          </h2>
          <p className="text-app-textSub text-sm text-center mb-6">
            {authMode === 'user' 
              ? (lang === 'en' ? 'Enter your credentials to access add-ons.' : 'Masukkan kredensial Anda untuk masuk.')
              : (lang === 'en' ? 'Master password required for admin access.' : 'Kata sandi master diperlukan untuk akses.')}
          </p>

          {errorMsg && (
            <div className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold p-3 rounded-xl mb-4 text-center">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            {authMode === 'user' ? (
              <>
                <input 
                  type="email" 
                  placeholder={lang === 'en' ? "Email Address" : "Alamat Email"} 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all font-medium"
                  required 
                />
                <input 
                  type="password" 
                  placeholder={lang === 'en' ? "License Key / Password" : "Kunci Lisensi / Sandi"} 
                  value={licenseKey}
                  onChange={e => setLicenseKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all font-medium"
                  required 
                />
              </>
            ) : (
              <input 
                type="password" 
                placeholder="Admin Password" 
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all font-medium"
                required 
              />
            )}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
            >
              {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>}
              {lang === 'en' ? 'Login' : 'Masuk Sistem'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Dashboard Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${session.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
            {session.role === 'admin' ? <i className="fa-solid fa-crown"></i> : (session.gamertag ? String(session.gamertag).charAt(0).toUpperCase() : 'U')}
          </div>
          <div>
            <h2 className="font-outfit font-bold text-lg text-app-textMain leading-tight">
              {session.role === 'admin' ? 'Administrator' : session.gamertag}
            </h2>
            <p className="text-xs text-app-textSub font-medium">{session.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
          <i className="fa-solid fa-power-off"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 show-scrollbar">
        {session.role === 'user' && (
          <>
            <button onClick={() => setActiveTab('servers')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'servers' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Servers</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Downloads</button>
          </>
        )}
        {session.role === 'admin' && (
          <>
            <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'members' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Members</button>
            <button onClick={() => setActiveTab('database')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'database' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Releases</button>
          </>
        )}
        <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'chat' ? (session.role === 'admin' ? 'bg-amber-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md') : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Global Chat</button>
      </div>

      {/* Content Area */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 min-h-[40vh]">
        
        {/* User: Servers */}
        {activeTab === 'servers' && session.role === 'user' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-server text-purple-500 mr-2"></i> Authorized Servers</h3>
            {servers.length === 0 ? (
              <div className="text-center py-8 text-app-textSub text-sm">No servers found.</div>
            ) : (
              servers.filter(s => s.email === session.email).map((s, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-app-textMain">{s.ip} <span className="text-xs text-gray-400 font-normal ml-1">:{s.port}</span></h4>
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">{s.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User: History */}
        {activeTab === 'history' && session.role === 'user' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-download text-purple-500 mr-2"></i> Add-on Downloads</h3>
            {!session.history || session.history.length === 0 ? (
              <div className="text-center py-8 text-app-textSub text-sm">No download history.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {session.history.map((h, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-app-textMain">{h.versionName}</h4>
                      <p className="text-xs text-app-textSub mt-0.5">{h.date}</p>
                      <div className="mt-2 text-[10px] text-gray-500" dangerouslySetInnerHTML={{__html: h.changelog}}></div>
                    </div>
                    <a href={h.driveLink} target="_blank" onClick={() => recordDownload(h.versionName)} className="bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
                      <i className="fa-solid fa-cloud-arrow-down mr-1"></i> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin: Members */}
        {activeTab === 'members' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-users text-amber-500 mr-2"></i> Clients ({adminMembers.length})</h3>
              <button onClick={fetchAdminMembers} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-600 transition-colors"><i className="fa-solid fa-rotate-right"></i></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="py-3 px-4 font-semibold text-app-textSub">Client</th>
                    <th className="py-3 px-4 font-semibold text-app-textSub">Email / Gamertag</th>
                    <th className="py-3 px-4 font-semibold text-app-textSub">Status</th>
                    <th className="py-3 px-4 font-semibold text-app-textSub text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminMembers.map((m, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4"><span className="font-bold text-app-textMain">{m.name}</span><br/><span className="text-[10px] text-gray-400">Join: {m.joinDate}</span></td>
                      <td className="py-3 px-4"><span className="text-app-textMain text-xs">{m.email}</span><br/><span className="text-xs font-semibold text-amber-600">{m.gamertag}</span></td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider ${m.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => toggleMember(m.row, m.status)} className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-600 hover:text-amber-500 shadow-sm mx-1" title="Toggle Status"><i className="fa-solid fa-power-off"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Admin: Database/Releases */}
        {activeTab === 'database' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-database text-amber-500 mr-2"></i> Release History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="py-3 px-4 font-semibold text-app-textSub">Version</th>
                    <th className="py-3 px-4 font-semibold text-app-textSub">Date</th>
                    <th className="py-3 px-4 font-semibold text-app-textSub">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReleases.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-app-textMain">{r.versionName}</td>
                      <td className="py-3 px-4 text-xs">{r.date}</td>
                      <td className="py-3 px-4"><a href={r.driveLink} target="_blank" className="text-amber-500 hover:underline"><i className="fa-solid fa-link"></i></a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[50vh]">
            <h3 className="font-outfit font-bold text-lg text-app-textMain mb-3"><i className="fa-regular fa-comments text-purple-500 mr-2"></i> Global Chat</h3>
            
            <div className="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto flex flex-col gap-3 mb-4 show-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="m-auto text-app-textSub text-sm"><i className="fa-solid fa-ghost mr-2"></i> No messages yet</div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMine = msg.email === session.email;
                  return (
                    <div key={i} className={`flex flex-col max-w-[85%] ${isMine ? 'self-end' : 'self-start'}`}>
                      <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${msg.role === 'admin' ? 'bg-amber-500' : 'bg-purple-500'}`}>
                          {msg.gamertag?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm ${isMine ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-app-textMain rounded-bl-sm'}`}>
                          {msg.msg}
                        </div>
                        {(isMine || session.role === 'admin') && (
                          <button onClick={() => deleteChat(msg.id)} className="text-gray-300 hover:text-red-500 text-xs mb-2 transition-colors">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                      <span className={`text-[9px] text-gray-400 mt-1 ${isMine ? 'text-right mr-9' : 'ml-9'}`}>
                        {msg.gamertag} {msg.role === 'admin' && <i className="fa-solid fa-crown text-amber-500 ml-1"></i>} • {msg.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendChat} className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
              />
              <button type="submit" disabled={!chatInput.trim()} className="w-11 h-11 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 transition-colors shrink-0 shadow-md">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
