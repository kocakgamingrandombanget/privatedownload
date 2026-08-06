import React, { useState, useEffect } from 'react';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOAHFZyhAd4h8lpWi1lCB4j94iio5Yu-_qf5XYHUP2dxDBlMfr0_h-wBCdsE4p56yL/exec";

export default function ClientPortal({ lang }) {
  const [authMode, setAuthMode] = useState('user'); 
  const [session, setSession] = useState(() => {
    try { const stored = sessionStorage.getItem('heraclaus_session'); return stored ? JSON.parse(stored) : null; } 
    catch (e) { return null; }
  });
  
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState(''); 
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // USER DATA
  const [servers, setServers] = useState([]);
  
  // ADMIN DATA
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminReleases, setAdminReleases] = useState(session?.history || []);
  const [adminDocs, setAdminDocs] = useState([]);
  const [adminPortfolio, setAdminPortfolio] = useState([]);

  // MODALS STATE
  const [modal, setModal] = useState(null); // 'addServer', 'changePwd', 'release', 'generateLicense', 'sys', 'doc', 'portfolio'
  const [modalData, setModalData] = useState({});

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
    if (activeTab === 'docs' && session?.role === 'admin') fetchDocs();
    if (activeTab === 'portfolio' && session?.role === 'admin') fetchPortfolio();
  }, [activeTab]);

  const apiCall = async (payload) => {
    setIsLoading(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      const data = await res.json();
      setIsLoading(false);
      return data;
    } catch (e) {
      setIsLoading(false);
      alert(lang === 'en' ? 'Network error.' : 'Koneksi gagal.');
      return { status: 'error', message: 'Network error' };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const payload = authMode === 'user' 
      ? { action: 'login', email: email.trim(), licenseKey: licenseKey.trim() }
      : { action: 'admin_login', adminPassword: adminPassword.trim() };
    const data = await apiCall(payload);
    if (data.status === "success") {
      const newSession = authMode === 'user'
        ? { role: 'user', email: data.email, gamertag: data.gamertag, history: data.history || [] }
        : { role: 'admin', adminPassword: adminPassword.trim(), gamertag: "Admin" };
      sessionStorage.setItem('heraclaus_session', JSON.stringify(newSession));
      setSession(newSession);
      if (authMode === 'admin') setAdminReleases(data.history || []);
    } else setErrorMsg(data.message);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('heraclaus_session');
    setSession(null); setActiveTab('');
  };

  // FETCHERS
  const fetchServers = async () => {
    const data = await apiCall({ action: "get_servers" });
    if (data.status === "success") setServers(data.servers || []);
  };
  const fetchGlobalChat = async () => {
    const data = await apiCall({ action: "get_global_chat" });
    if (data.status === "success") setChatMessages(data.chat || []);
  };
  const fetchAdminMembers = async () => {
    const data = await apiCall({ action: "admin_get_members", adminPassword: session?.adminPassword });
    if (data.status === "success") setAdminMembers(data.members || []);
  };
  const fetchAdminReleases = async () => {
    const data = await apiCall({ action: "get_changelog" });
    if (data.status === "success") setAdminReleases(data.changelogs || data.history || []);
  };
  const fetchDocs = async () => {
    const data = await apiCall({ action: "get_docs" });
    if (data.status === "success") setAdminDocs(data.docs || []);
  };
  const fetchPortfolio = async () => {
    const data = await apiCall({ action: "get_portfolio" });
    if (data.status === "success") setAdminPortfolio(data.portfolio || []);
  };

  // USER ACTIONS
  const handleAddServer = async (e) => {
    e.preventDefault();
    const data = await apiCall({ action: "add_server", email: session.email, gamertag: session.gamertag, ...modalData });
    if (data.status === "success") { setModal(null); fetchServers(); alert('Server added!'); }
    else alert(data.message);
  };
  const handleDeleteServer = async (serverId) => {
    if (!window.confirm('Delete this server?')) return;
    const payload = session.role === 'admin' 
      ? { action: "delete_server", role: "admin", adminPassword: session.adminPassword, serverId }
      : { action: "delete_server", role: "user", email: session.email, serverId };
    const data = await apiCall(payload);
    if (data.status === "success") fetchServers(); else alert(data.message);
  };
  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (modalData.newKey.length < 5) return alert('Password too short');
    const data = await apiCall({ action: "change_password", email: session.email, oldKey: modalData.oldKey, newKey: modalData.newKey });
    alert(data.message);
    if (data.status === "success") setModal(null);
  };

  // ADMIN ACTIONS (MEMBERS & SYS)
  const toggleMember = async (row, currentStatus) => {
    const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    const data = await apiCall({ action: "admin_toggle_member", adminPassword: session.adminPassword, targetRow: row, newStatus });
    if (data.status === "success") fetchAdminMembers();
  };
  const deleteMember = async (row) => {
    if (!window.confirm(`Permanently delete this member?`)) return;
    const data = await apiCall({ action: "admin_delete_member", adminPassword: session.adminPassword, targetRow: row });
    if (data.status === "success") fetchAdminMembers(); else alert(data.message);
  };
  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    const data = await apiCall({ action: "admin_generate_license", adminPassword: session.adminPassword, ...modalData });
    alert(data.message);
    if (data.status === "success") setModal(null);
  };
  const handleRegenerateKeys = async () => {
    if (!window.confirm("WARNING: This revokes all existing API keys globally. Continue?")) return;
    const data = await apiCall({ action: "admin_regenerate_global_keys", adminPassword: session.adminPassword });
    alert(data.message);
  };
  const handleSysAction = async (e) => {
    e.preventDefault();
    const actionType = modalData.type; // 'announcement' or 'free_version'
    const data = await apiCall({ action: actionType === 'announcement' ? "admin_send_announcement" : "admin_update_free_version", adminPassword: session.adminPassword, ...modalData });
    alert(data.status === 'success' ? 'Success!' : data.message);
    if (data.status === "success") setModal(null);
  };

  // ADMIN ACTIONS (RELEASES)
  const handleRelease = async (e) => {
    e.preventDefault();
    const payload = { action: modalData.isEdit ? "admin_edit_release" : "admin_publish_release", adminPassword: session.adminPassword, ...modalData };
    const data = await apiCall(payload);
    if (data.status === "success") { setModal(null); fetchAdminReleases(); } else alert(data.message);
  };
  const deleteRelease = async (id) => {
    if (!window.confirm('Delete release?')) return;
    const data = await apiCall({ action: "admin_delete_release", adminPassword: session.adminPassword, releaseId: id });
    if (data.status === "success") fetchAdminReleases();
  };

  // ADMIN ACTIONS (DOCS & PORTFOLIO)
  const handleDoc = async (e) => {
    e.preventDefault();
    const payload = { action: modalData.isEdit ? "admin_edit_doc" : "admin_add_doc", adminPassword: session.adminPassword, ...modalData };
    const data = await apiCall(payload);
    if (data.status === "success") { setModal(null); fetchDocs(); } else alert(data.message);
  };
  const deleteDoc = async (id) => {
    if (!window.confirm('Delete doc?')) return;
    const data = await apiCall({ action: "admin_delete_doc", adminPassword: session.adminPassword, docId: id });
    if (data.status === "success") fetchDocs();
  };
  const handlePortfolio = async (e) => {
    e.preventDefault();
    const payload = { action: modalData.isEdit ? "admin_edit_portfolio" : "admin_add_portfolio", adminPassword: session.adminPassword, ...modalData };
    const data = await apiCall(payload);
    if (data.status === "success") { setModal(null); fetchPortfolio(); } else alert(data.message);
  };
  const deletePortfolio = async (id) => {
    if (!window.confirm('Delete portfolio?')) return;
    const data = await apiCall({ action: "admin_delete_portfolio", adminPassword: session.adminPassword, portId: id });
    if (data.status === "success") fetchPortfolio();
  };

  // CHAT
  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim(); setChatInput('');
    const payload = session.role === 'user' 
      ? { action: "send_global_chat", email: session.email, gamertag: session.gamertag, role: "user", msg }
      : { action: "send_global_chat", adminPassword: session.adminPassword, role: "admin", msg };
    const data = await apiCall(payload);
    if (data.status === "success") setChatMessages(data.chat || []);
  };
  const deleteChat = async (msgId) => {
    if (!window.confirm("Delete message?")) return;
    const payload = session.role === 'user'
      ? { action: "delete_global_chat", email: session.email, msgId }
      : { action: "delete_global_chat", adminPassword: session.adminPassword, msgId };
    const data = await apiCall(payload);
    if (data.status === "success") setChatMessages(data.chat || []);
  };

  if (!session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-app w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${authMode === 'user' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
              <i className={`fa-solid ${authMode === 'user' ? 'fa-user' : 'fa-shield-halved'} text-2xl`}></i>
            </div>
            <h2 className="text-2xl font-outfit font-bold text-app-textMain">
              {authMode === 'user' ? 'Client Portal' : 'Admin Gateway'}
            </h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {authMode === 'user' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-app-textSub mb-1 uppercase tracking-wider">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-colors" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-textSub mb-1 uppercase tracking-wider">License Key</label>
                  <input type="password" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-colors" placeholder="XXXX-XXXX-XXXX-XXXX" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-app-textSub mb-1 uppercase tracking-wider">Master Password</label>
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors" placeholder="••••••••" />
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
                <i className="fa-solid fa-circle-exclamation"></i> {errorMsg}
              </div>
            )}

            <button type="submit" disabled={isLoading} className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 ${authMode === 'user' ? 'bg-app-textMain hover:bg-gray-800' : 'bg-amber-500 hover:bg-amber-600'}`}>
              {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right-to-bracket"></i>}
              {lang === 'en' ? 'Secure Login' : 'Masuk Aman'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setAuthMode(authMode === 'user' ? 'admin' : 'user'); setErrorMsg(''); }} className="text-xs text-app-textSub hover:text-app-textMain font-medium transition-colors">
              {authMode === 'user' ? 'Switch to Admin Gateway' : 'Return to Client Portal'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="min-h-[80vh] flex flex-col gap-4">
      {/* Header */}
      <div className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 ${session.role === 'admin' ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-purple-600'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${session.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
            <i className={`fa-solid ${session.role === 'admin' ? 'fa-shield-halved' : 'fa-user-check'}`}></i>
          </div>
          <div>
            <h2 className="font-outfit font-bold text-xl text-app-textMain leading-tight">
              {session.role === 'admin' ? 'Admin Suite' : session.gamertag}
            </h2>
            <p className="text-xs text-app-textSub font-medium mt-0.5">
              {session.role === 'admin' ? 'System Management' : session.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {session.role === 'user' && (
             <button onClick={() => { setModalData({oldKey:'', newKey:''}); setModal('changePwd'); }} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
               <i className="fa-solid fa-key mr-2"></i> Password
             </button>
          )}
          <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
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
            <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'docs' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Docs</button>
            <button onClick={() => setActiveTab('portfolio')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'portfolio' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Portfolio</button>
            <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'system' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>System</button>
          </>
        )}
        <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'chat' ? (session.role === 'admin' ? 'bg-amber-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md') : 'bg-white text-app-textSub border border-gray-200 hover:bg-gray-50'}`}>Global Chat</button>
      </div>

      {/* Content Area */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 min-h-[40vh]">
        
        {/* User: Servers */}
        {activeTab === 'servers' && session.role === 'user' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-server text-purple-500 mr-2"></i> Authorized Servers</h3>
              <button onClick={() => { setModalData({ name: '', linkType: 'discord', link: '', ip: '', port: '', isPortPublic: true, desc: '' }); setModal('addServer'); }} className="px-3 py-1.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-200"><i className="fa-solid fa-plus mr-1"></i> Add Server</button>
            </div>
            {servers.length === 0 ? (
              <div className="text-center py-8 text-app-textSub text-sm">No servers found.</div>
            ) : (
              servers.filter(s => s.ownerEmail === session.email).map((s, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-app-textMain">{s.name}</h4>
                      <p className="text-xs text-app-textSub mt-0.5">{s.ip}:{s.port}</p>
                    </div>
                    <button onClick={() => handleDeleteServer(s.id)} className="text-red-500 hover:text-red-700 bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fa-solid fa-trash text-sm"></i></button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{s.desc}</p>
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
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-app-textMain">{h.versionName}</h4>
                    <p className="text-xs text-app-textSub">{h.date}</p>
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
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-users text-amber-500 mr-2"></i> Client Management</h3>
              <button onClick={() => { setModalData({ gamertag: '', email: '', whatsapp: '', expiration: '' }); setModal('generateLicense'); }} className="px-3 py-1.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-200"><i className="fa-solid fa-plus mr-1"></i> New License</button>
            </div>
            {adminMembers.length === 0 ? (
              <div className="text-center py-8 text-app-textSub text-sm">No members found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider"><th className="p-3">User</th><th className="p-3">Key</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {adminMembers.map((m, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="p-3">
                          <div className="font-semibold text-app-textMain text-sm">{m.gamertag}</div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </td>
                        <td className="p-3 text-xs font-mono bg-gray-50 text-gray-600 rounded">{m.licenseKey}</td>
                        <td className="p-3 text-xs font-bold"><span className={`px-2 py-1 rounded ${m.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span></td>
                        <td className="p-3 text-right">
                          <button onClick={() => toggleMember(m.row, m.status)} className="text-xs font-semibold px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded mr-2">Toggle</button>
                          <button onClick={() => deleteMember(m.row)} className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Admin: Releases */}
        {activeTab === 'database' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-database text-amber-500 mr-2"></i> Release Database</h3>
              <button onClick={() => { setModalData({ id:'', isEdit: false, versionName: '', mcVersion: '', directLink: '', bpLink: '', rpLink: '', updateSpecial: '', updateAdded: '', updateFixed: '', updateRemoved: '', updateMaintenance: '' }); setModal('release'); }} className="px-3 py-1.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-200"><i className="fa-solid fa-plus mr-1"></i> Add Release</button>
            </div>
            {adminReleases.map((r, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-app-textMain">{r.versionName}</h4>
                  <p className="text-xs text-app-textSub mt-0.5">{r.date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setModalData({ ...r, isEdit: true }); setModal('release'); }} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded">Edit</button>
                  <button onClick={() => deleteRelease(r.id)} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin: Docs */}
        {activeTab === 'docs' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-book text-amber-500 mr-2"></i> Documentation</h3>
              <button onClick={() => { setModalData({ id:'', isEdit: false, catEn: '', catId: '', titleEn: '', titleId: '', contentEn: '', contentId: '' }); setModal('doc'); }} className="px-3 py-1.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-200"><i className="fa-solid fa-plus mr-1"></i> Add Doc</button>
            </div>
            {adminDocs.map((d, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-app-textMain">{d.titleEn}</h4>
                  <p className="text-xs text-app-textSub mt-0.5">{d.catEn}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setModalData({ ...d, isEdit: true }); setModal('doc'); }} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded">Edit</button>
                  <button onClick={() => deleteDoc(d.id)} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin: Portfolio */}
        {activeTab === 'portfolio' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-image text-amber-500 mr-2"></i> Portfolio</h3>
              <button onClick={() => { setModalData({ id:'', isEdit: false, imageLink: '', titleEn: '', titleId: '', descEn: '', descId: '' }); setModal('portfolio'); }} className="px-3 py-1.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-200"><i className="fa-solid fa-plus mr-1"></i> Add Portfolio</button>
            </div>
            {adminPortfolio.map((p, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-app-textMain">{p.titleEn}</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setModalData({ ...p, isEdit: true }); setModal('portfolio'); }} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded">Edit</button>
                  <button onClick={() => deletePortfolio(p.id)} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin: System */}
        {activeTab === 'system' && session.role === 'admin' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-outfit font-bold text-lg text-app-textMain"><i className="fa-solid fa-cogs text-amber-500 mr-2"></i> System Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button onClick={() => { setModalData({ type: 'announcement', subject: '', plainBody: '' }); setModal('sys'); }} className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-left hover:bg-gray-100 transition-colors">
                 <i className="fa-solid fa-bullhorn text-amber-500 text-xl mb-2 block"></i>
                 <h4 className="font-bold text-sm">Send Global Announcement</h4>
                 <p className="text-xs text-gray-500 mt-1">Send an email to all users.</p>
               </button>
               <button onClick={() => { setModalData({ type: 'free_version', version: '', link: '' }); setModal('sys'); }} className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-left hover:bg-gray-100 transition-colors">
                 <i className="fa-solid fa-link text-blue-500 text-xl mb-2 block"></i>
                 <h4 className="font-bold text-sm">Update Free Version Link</h4>
                 <p className="text-xs text-gray-500 mt-1">Change the public download link.</p>
               </button>
               <button onClick={handleRegenerateKeys} className="bg-red-50 border border-red-200 p-4 rounded-xl text-left hover:bg-red-100 transition-colors">
                 <i className="fa-solid fa-skull text-red-500 text-xl mb-2 block"></i>
                 <h4 className="font-bold text-sm text-red-700">Regenerate Global Keys</h4>
                 <p className="text-xs text-red-500 mt-1">Revoke ALL current licenses immediately.</p>
               </button>
            </div>
          </div>
        )}

        {/* Global Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[50vh]">
            <h3 className="font-outfit font-bold text-lg text-app-textMain mb-3"><i className="fa-regular fa-comments text-purple-500 mr-2"></i> Global Chat</h3>
            <div className="flex-grow bg-gray-50 rounded-2xl border border-gray-200 p-4 overflow-y-auto mb-3 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-app-textSub text-sm"><i className="fa-solid fa-ghost text-2xl mb-2 opacity-50 block"></i>No messages yet.</div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = session.role === 'admin' ? msg.role === 'admin' : msg.gamertag === session.gamertag;
                  return (
                    <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500">{msg.gamertag || 'Admin'}</span>
                        {msg.role === 'admin' && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}
                        {(isMe || session.role === 'admin') && (
                          <button onClick={() => deleteChat(msg.id)} className="text-gray-300 hover:text-red-500 text-xs mb-2 transition-colors"><i className="fa-solid fa-trash"></i></button>
                        )}
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? (session.role === 'admin' ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-purple-600 text-white rounded-tr-sm') : 'bg-white border border-gray-200 text-app-textMain rounded-tl-sm'}`}>
                        {msg.msg}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-grow bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-colors" />
              <button type="submit" disabled={!chatInput.trim()} className={`w-11 h-11 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shrink-0 shadow-md ${session.role === 'admin' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal === 'addServer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-app overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">Add Server</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleAddServer} className="p-5 flex flex-col gap-3">
              <input type="text" placeholder="Server Name" required value={modalData.name} onChange={e=>setModalData({...modalData, name: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="text" placeholder="Server IP" required value={modalData.ip} onChange={e=>setModalData({...modalData, ip: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="text" placeholder="Server Port" required value={modalData.port} onChange={e=>setModalData({...modalData, port: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <select value={modalData.linkType} onChange={e=>setModalData({...modalData, linkType: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm">
                <option value="discord">Discord</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="website">Website</option>
              </select>
              <input type="url" placeholder="Community Link" required value={modalData.link} onChange={e=>setModalData({...modalData, link: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <textarea placeholder="Short Description" required value={modalData.desc} onChange={e=>setModalData({...modalData, desc: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <button type="submit" disabled={isLoading} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 mt-2">Submit</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'changePwd' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-app overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">Change Password</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleChangePwd} className="p-5 flex flex-col gap-3">
              <input type="password" placeholder="Current Password/Key" required value={modalData.oldKey} onChange={e=>setModalData({...modalData, oldKey: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="password" placeholder="New Password/Key" required value={modalData.newKey} onChange={e=>setModalData({...modalData, newKey: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black mt-2">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'release' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-app overflow-hidden animate-fade-up flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">{modalData.isEdit ? 'Edit Release' : 'Add Release'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleRelease} className="p-5 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Version Name (e.g. v1.2.0)" required value={modalData.versionName} onChange={e=>setModalData({...modalData, versionName: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                <input type="text" placeholder="Minecraft Version" required value={modalData.mcVersion} onChange={e=>setModalData({...modalData, mcVersion: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              </div>
              <input type="url" placeholder="Direct Download Link" required value={modalData.directLink} onChange={e=>setModalData({...modalData, directLink: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <textarea placeholder="Special Notes (EN|||ID)" value={modalData.updateSpecial} onChange={e=>setModalData({...modalData, updateSpecial: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <textarea placeholder="Added Features (EN|||ID)" value={modalData.updateAdded} onChange={e=>setModalData({...modalData, updateAdded: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <textarea placeholder="Fixed Bugs (EN|||ID)" value={modalData.updateFixed} onChange={e=>setModalData({...modalData, updateFixed: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 mt-2">Publish Release</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'generateLicense' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-app overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">Generate License</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleGenerateLicense} className="p-5 flex flex-col gap-3">
              <input type="text" placeholder="Gamertag" required value={modalData.gamertag} onChange={e=>setModalData({...modalData, gamertag: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="email" placeholder="Email" required value={modalData.email} onChange={e=>setModalData({...modalData, email: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="text" placeholder="WhatsApp (Optional)" value={modalData.whatsapp} onChange={e=>setModalData({...modalData, whatsapp: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <input type="date" placeholder="Expiration (Optional)" value={modalData.expiration} onChange={e=>setModalData({...modalData, expiration: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 mt-2">Generate & Send</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'doc' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-app overflow-hidden animate-fade-up flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">{modalData.isEdit ? 'Edit Doc' : 'Add Doc'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleDoc} className="p-5 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Category (EN)" required value={modalData.catEn} onChange={e=>setModalData({...modalData, catEn: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                <input type="text" placeholder="Category (ID)" required value={modalData.catId} onChange={e=>setModalData({...modalData, catId: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                <input type="text" placeholder="Title (EN)" required value={modalData.titleEn} onChange={e=>setModalData({...modalData, titleEn: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                <input type="text" placeholder="Title (ID)" required value={modalData.titleId} onChange={e=>setModalData({...modalData, titleId: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              </div>
              <textarea placeholder="Content (EN HTML)" required value={modalData.contentEn} onChange={e=>setModalData({...modalData, contentEn: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm h-32"></textarea>
              <textarea placeholder="Content (ID HTML)" required value={modalData.contentId} onChange={e=>setModalData({...modalData, contentId: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm h-32"></textarea>
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 mt-2">Save Doc</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'portfolio' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-app overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">{modalData.isEdit ? 'Edit Portfolio' : 'Add Portfolio'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handlePortfolio} className="p-5 flex flex-col gap-3">
              <input type="url" placeholder="Image URL" required value={modalData.imageLink} onChange={e=>setModalData({...modalData, imageLink: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Title (EN)" required value={modalData.titleEn} onChange={e=>setModalData({...modalData, titleEn: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                <input type="text" placeholder="Title (ID)" required value={modalData.titleId} onChange={e=>setModalData({...modalData, titleId: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
              </div>
              <textarea placeholder="Desc (EN)" required value={modalData.descEn} onChange={e=>setModalData({...modalData, descEn: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <textarea placeholder="Desc (ID)" required value={modalData.descId} onChange={e=>setModalData({...modalData, descId: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm"></textarea>
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 mt-2">Save Portfolio</button>
            </form>
          </div>
        </div>
      )}

      {modal === 'sys' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-app overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-outfit font-bold text-lg">{modalData.type === 'announcement' ? 'Send Announcement' : 'Update Free Version'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSysAction} className="p-5 flex flex-col gap-3">
              {modalData.type === 'announcement' ? (
                <>
                  <input type="text" placeholder="Email Subject" required value={modalData.subject} onChange={e=>setModalData({...modalData, subject: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                  <textarea placeholder="Plaintext Body" required value={modalData.plainBody} onChange={e=>setModalData({...modalData, plainBody: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm h-32"></textarea>
                </>
              ) : (
                <>
                  <input type="text" placeholder="Version (e.g. v1.0.0)" required value={modalData.version} onChange={e=>setModalData({...modalData, version: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                  <input type="url" placeholder="Download Link" required value={modalData.link} onChange={e=>setModalData({...modalData, link: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm" />
                </>
              )}
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 mt-2">Execute</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
