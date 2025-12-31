import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppData, User, HistoryItem, Category, BugReport, PointTransaction, Notification, SupportTicket } from './types';
import { 
  Home, History, User as UserIcon, Search, Heart, ShieldCheck, Zap, 
  ArrowRight, Cloud, Lock, Smartphone, Loader2, Play, Sparkles
} from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { ProfileView } from './components/ProfileView';
import { FloatingChat } from './components/FloatingChat';
import { getGeminiRecommendations } from './services/geminiService';

// --- PERSISTENCE HELPER ---
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

// --- CONTEXT ---
interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  apps: AppData[];
  history: HistoryItem[];
  wishlist: string[];
  bugReports: BugReport[];
  pointsHistory: PointTransaction[];
  notifications: Notification[];
  login: (email: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
  addToHistory: (app: AppData, duration: number) => void;
  toggleWishlist: (appId: string) => void;
  reportBug: (desc: string) => void;
  resolveBug: (id: string, status: 'approved' | 'rejected') => void;
  upgradeUser: (redeemedPoints?: number, paymentId?: string) => void;
  addApp: (app: AppData) => void;
  removeApp: (id: string) => void;
  updateApp: (app: AppData) => void;
  updateUser: (data: Partial<User>) => void;
  deleteAccount: () => void;
  toggleTheme: () => void;
  submitSupport: (subject: string, message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within Provider");
  return context;
};

// --- PAGES ---

// 1. Landing & Auth
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-vault-900 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-vault-accent/10 blur-[120px] rounded-full -translate-y-1/2" />
      <nav className="flex justify-between items-center p-6 relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-vault-accent rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AppVault</span>
        </div>
        <Link to="/auth" className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium">Log In</Link>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block py-1.5 px-4 rounded-full bg-vault-800 border border-vault-700 text-vault-accent text-xs font-bold mb-6 shadow-sm">
            ✨ v2.1 Released
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            The App Store <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-vault-accent to-blue-500">
              Without The Download.
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Run thousands of premium apps instantly in secure cloud containers. Zero storage usage, maximum performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup" className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center shadow-xl shadow-white/5">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left px-4">
          {[
            { icon: Cloud, title: "Cloud Native", desc: "Apps stream from our high-performance servers." },
            { icon: Lock, title: "Sandboxed", desc: "Military-grade isolation for every session." },
            { icon: Smartphone, title: "Any Device", desc: "Resume exactly where you left off on any screen." }
          ].map((item, i) => (
             <div key={i} className="p-6 rounded-2xl bg-vault-800/40 border border-white/5 backdrop-blur-sm hover:border-vault-accent/30 transition-colors">
                <item.icon className="w-8 h-8 text-vault-accent mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
             </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const AuthPage = () => {
  const { login, signup } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const isLoginMode = searchParams.get('mode') !== 'signup';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (isLoginMode) login(email);
      else signup(name, email);
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-vault-900 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-vault-800 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">{isLoginMode ? 'Welcome Back' : 'Join AppVault'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-vault-900 border border-white/10 rounded-xl p-4 text-white focus:border-vault-accent outline-none" required />}
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-vault-900 border border-white/10 rounded-xl p-4 text-white focus:border-vault-accent outline-none" required />
          <input type="password" placeholder="Password" className="w-full bg-vault-900 border border-white/10 rounded-xl p-4 text-white focus:border-vault-accent outline-none" required />
          <button disabled={loading} className="w-full bg-vault-accent hover:bg-vault-accentHover text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLoginMode ? 'Log In' : 'Create Account')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to={`/auth?mode=${isLoginMode ? 'signup' : 'login'}`} className="text-sm text-gray-400 hover:text-white">
            {isLoginMode ? "Need an account? Sign up" : "Have an account? Log in"}
          </Link>
        </div>
        <div className="mt-4 text-xs text-center text-gray-600">
           Admin Demo: use <b>admin@appvault.com</b>
        </div>
      </motion.div>
    </div>
  );
};

// 2. Main App Components
const AppRunner = () => {
  const { apps, addToHistory } = useAppContext();
  const searchParams = new URLSearchParams(useLocation().search);
  const app = apps.find(a => a.id === searchParams.get('id'));
  const navigate = useNavigate();
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const handleExit = () => {
    if (app) addToHistory(app, elapsed);
    navigate('/');
  };

  if (!app) return <div className="text-white p-10">App not found.</div>;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="bg-vault-800 p-2 flex justify-between items-center border-b border-white/10">
         <div className="flex items-center space-x-2 text-green-500 font-mono text-xs">
           <ShieldCheck className="w-4 h-4" /> <span>SECURE_CONNECTION_ESTABLISHED</span>
         </div>
         <button onClick={handleExit} className="bg-red-600 px-3 py-1 rounded text-white text-xs font-bold">EXIT SESSION</button>
      </div>
      <iframe src={app.url1} title={app.name} className="flex-1 w-full bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </div>
  );
};

const Dashboard = () => {
  const { apps, user, wishlist, toggleWishlist } = useAppContext();
  const [search, setSearch] = useState('');
  const filtered = apps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  if (user?.isAdmin) {
      return <Navigate to="/admin" replace />;
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">
       <header className="flex justify-between items-center mb-6">
         <div>
            <h1 className="text-2xl font-bold text-white">Discover</h1>
            <p className="text-xs text-gray-400">Welcome back, {user?.name}</p>
         </div>
         <div className="flex items-center space-x-2">
             <div className="bg-vault-800 px-3 py-1 rounded-full border border-white/10 flex items-center">
                <Zap className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                <span className="text-xs font-bold">{user?.points}</span>
             </div>
         </div>
       </header>

       <div className="relative mb-6">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search apps..." 
            className="w-full bg-vault-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-vault-accent outline-none" 
          />
       </div>

       {apps.length === 0 ? (
         <div className="text-center py-20 bg-vault-800/50 rounded-2xl border border-white/5 border-dashed">
            <Cloud className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-white font-bold">No Apps Available</h3>
            <p className="text-gray-500 text-sm px-8">The database is currently empty. Please ask an admin to deploy new apps.</p>
         </div>
       ) : (
         <div className="grid grid-cols-2 gap-4">
            {filtered.map(app => (
               <div key={app.id} className="bg-vault-800 rounded-2xl p-4 border border-white/5 hover:border-vault-accent/50 transition-all group relative">
                  <div className="absolute top-2 right-2 z-10">
                     <Heart onClick={(e) => { e.preventDefault(); toggleWishlist(app.id); }} className={`w-5 h-5 cursor-pointer transition-transform active:scale-90 ${wishlist.includes(app.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </div>
                  <div className="aspect-square rounded-xl bg-vault-700 mb-3 overflow-hidden">
                     <img src={app.icon} className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="font-bold text-sm text-white truncate">{app.name}</h3>
                  <p className="text-[10px] text-gray-500 mb-3">{app.category}</p>
                  <Link to={`/runner?id=${app.id}`} className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     Open App
                  </Link>
               </div>
            ))}
         </div>
       )}
    </div>
  );
};

// 3. Search Page
const SearchPage = () => {
  const { apps } = useAppContext();
  const [search, setSearch] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AppData[]>([]);
  const [aiResults, setAiResults] = useState<AppData[]>([]);

  useEffect(() => {
    if (search) {
      setSearchResults(apps.filter(a => a.name.toLowerCase().includes(search.toLowerCase())));
    } else {
      setSearchResults([]);
    }
  }, [search, apps]);

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const recommendedIds = await getGeminiRecommendations(aiPrompt, apps);
    const recommendedApps = apps.filter(a => recommendedIds.includes(a.id));
    setAiResults(recommendedApps);
    setIsAiLoading(false);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white">Search</h1>
      
      {/* Standard Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Find apps by name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-vault-800 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-vault-accent text-sm text-white"
        />
      </div>

      {searchResults.length > 0 && (
         <div className="mb-8 space-y-3">
            <h3 className="font-bold text-sm text-gray-400 uppercase">Results</h3>
            {searchResults.map(app => (
               <Link key={app.id} to={`/runner?id=${app.id}`} className="flex items-center p-3 bg-vault-800 rounded-lg border border-white/10 hover:border-vault-accent/50 transition-colors">
                 <img src={app.icon} className="w-10 h-10 rounded mr-3 bg-vault-700 object-cover" alt="" />
                 <div className="flex-1">
                   <h4 className="font-bold text-sm text-white">{app.name}</h4>
                 </div>
                 <Play className="w-4 h-4 text-vault-accent" />
               </Link>
            ))}
         </div>
      )}

      {/* AI Search */}
      <div className="bg-gradient-to-br from-vault-800 to-purple-900/20 p-5 rounded-2xl border border-white/10">
        <h2 className="font-bold text-white flex items-center mb-3">
            <Sparkles className="w-5 h-5 mr-2 text-vault-accent" />
            AI Discovery
        </h2>
        <p className="text-sm text-gray-400 mb-4">Describe what you need, and Gemini will find the perfect app.</p>
        <textarea
            className="w-full bg-vault-900 border border-white/10 rounded-xl p-3 text-sm focus:border-vault-accent focus:outline-none min-h-[80px] mb-4 text-white"
            placeholder="e.g., I need a calculator for my physics homework..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button 
            onClick={handleAiSearch}
            disabled={isAiLoading}
            className="w-full bg-vault-accent hover:bg-vault-accentHover text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all"
        >
            {isAiLoading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Ask AI'}
        </button>
      </div>

      {aiResults.length > 0 && (
        <div className="mt-8 space-y-3">
        <h3 className="font-bold text-sm text-gray-400 uppercase">AI Recommendations</h3>
        {aiResults.map(app => (
            <Link key={app.id} to={`/runner?id=${app.id}`} className="flex items-center p-3 bg-vault-800 rounded-lg border border-white/10 border-l-4 border-l-vault-accent">
            <img src={app.icon} className="w-10 h-10 rounded bg-gray-700 mr-3 object-cover" alt="" />
            <div className="flex-1">
                <h4 className="font-bold text-sm text-white">{app.name}</h4>
                <p className="text-xs text-gray-400 line-clamp-1">{app.description}</p>
            </div>
            <Play className="w-4 h-4 text-vault-accent" />
            </Link>
        ))}
        </div>
    )}
    </div>
  );
};

// 4. Wishlist Page
const WishlistPage = () => {
  const { apps, wishlist } = useAppContext();
  const wishlistApps = apps.filter(app => wishlist.includes(app.id));

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">
       <h1 className="text-2xl font-bold mb-6 text-white">Wishlist</h1>
       {wishlistApps.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No apps saved yet.</p>
            <Link to="/" className="text-vault-accent text-sm mt-2 inline-block">Explore Apps</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
             {wishlistApps.map(app => (
               <Link key={app.id} to={`/runner?id=${app.id}`} className="flex items-center p-4 bg-vault-800 rounded-xl border border-white/10 hover:border-vault-accent/50 transition-colors">
                 <img src={app.icon} className="w-12 h-12 rounded-lg mr-4 object-cover bg-vault-700" alt="" />
                 <div className="flex-1">
                    <h4 className="font-bold text-gray-100">{app.name}</h4>
                    <p className="text-xs text-gray-400">{app.category}</p>
                 </div>
                 <Play className="w-8 h-8 p-2 rounded-full bg-vault-700 text-vault-accent" />
               </Link>
             ))}
          </div>
        )}
    </div>
  );
};

// 5. History Page
const HistoryPage = () => {
  const { history } = useAppContext();

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white">History</h1>
      {history.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent activity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-vault-800 rounded-xl border border-white/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-vault-700 flex items-center justify-center text-vault-accent font-bold">
                   <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.appName}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()} • {Math.ceil(item.durationSeconds / 60)} min used
                  </p>
                </div>
              </div>
              <Link to={`/runner?id=${item.appId}`} className="p-2 rounded-full bg-vault-700 hover:bg-vault-600">
                <Play className="w-4 h-4 text-white" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- APP ROOT ---
const AppContent = () => {
  const { user, apps, isAuthenticated, allUsers, deleteUser } = useAppContext() as any;
  const location = useLocation();
  
  const ProtectedRoute = ({ children }: any) => {
    if (!isAuthenticated) return <Navigate to="/welcome" replace />;
    return children;
  };

  const getLinkClass = (path: string) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      location.pathname === path ? 'text-vault-accent' : 'text-gray-500 hover:text-gray-300'
    }`;

  return (
    <>
      <div className="bg-vault-900 text-gray-100 font-sans min-h-screen">
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/runner" element={<ProtectedRoute><AppRunner /></ProtectedRoute>} />
          
          {/* Main Tabs */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="pb-16">
                 <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/admin" element={user?.isAdmin ? <AdminPanel {...useAppContext() as any} onAddApp={useAppContext().addApp} onRemoveApp={useAppContext().removeApp} onUpdateApp={useAppContext().updateApp} onResolveBug={useAppContext().resolveBug} bugReports={useAppContext().bugReports} users={allUsers} onDeleteUser={deleteUser} /> : <Navigate to="/" />} />
                    <Route path="/profile" element={
                      <ProfileView 
                        user={user!} 
                        bugReports={useAppContext().bugReports.filter(b => b.userId === user?.id)}
                        pointsHistory={useAppContext().pointsHistory}
                        notifications={useAppContext().notifications}
                        onLogout={useAppContext().logout}
                        onUpgrade={useAppContext().upgradeUser}
                        onReportBug={useAppContext().reportBug}
                        onRateApp={() => {}}
                        onUpdateUser={useAppContext().updateUser}
                        onDeleteAccount={useAppContext().deleteAccount}
                        onToggleTheme={useAppContext().toggleTheme}
                        onSubmitSupport={useAppContext().submitSupport}
                      />
                    } />
                 </Routes>
              </div>
              {/* Navigation Bar */}
              {!location.pathname.includes('/runner') && !location.pathname.includes('/admin') && (
                 <nav className="fixed bottom-0 left-0 w-full bg-vault-800/90 backdrop-blur-md border-t border-white/5 pb-safe z-40">
                    <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                       <Link to="/" className={getLinkClass('/')}>
                         <Home className="w-5 h-5" />
                         <span className="text-[10px] font-medium">Home</span>
                       </Link>
                       <Link to="/search" className={getLinkClass('/search')}>
                         <Search className="w-5 h-5" />
                         <span className="text-[10px] font-medium">Search</span>
                       </Link>
                       <Link to="/wishlist" className={getLinkClass('/wishlist')}>
                         <Heart className="w-5 h-5" />
                         <span className="text-[10px] font-medium">Wishlist</span>
                       </Link>
                       <Link to="/history" className={getLinkClass('/history')}>
                         <History className="w-5 h-5" />
                         <span className="text-[10px] font-medium">History</span>
                       </Link>
                       <Link to="/profile" className={getLinkClass('/profile')}>
                         <UserIcon className="w-5 h-5" />
                         <span className="text-[10px] font-medium">Profile</span>
                       </Link>
                    </div>
                 </nav>
              )}
              {/* Floating Chat */}
              {!user?.isAdmin && <FloatingChat apps={apps} />}
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
};

export default function App() {
  // --- STATE PERSISTENCE ---
  const [user, setUser] = useLocalStorage<User | null>('appvault_user', null);
  const [apps, setApps] = useLocalStorage<AppData[]>('appvault_apps', []); 
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('appvault_history', []);
  const [wishlist, setWishlist] = useLocalStorage<string[]>('appvault_wishlist', []);
  const [bugReports, setBugReports] = useLocalStorage<BugReport[]>('appvault_bugs', []);
  const [pointsHistory, setPointsHistory] = useLocalStorage<PointTransaction[]>('appvault_points', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('appvault_notifs', []);
  const [supportTickets, setSupportTickets] = useLocalStorage<SupportTicket[]>('appvault_support', []);
  
  // New User Database for Admin Panel
  const [allUsers, setAllUsers] = useLocalStorage<User[]>('appvault_users_db', []);

  // Initialize Dummy Users if Empty
  useEffect(() => {
    if (allUsers.length === 0) {
       setAllUsers([
         { id: 'admin', name: 'System Admin', email: 'admin@appvault.com', points: 5000, isPremium: true, avatar: '', isAdmin: true, joinedDate: new Date().toISOString(), themePreference: 'dark', subscriptionStatus: 'active' },
         { id: 'u1', name: 'Alice Walker', email: 'alice@example.com', points: 340, isPremium: true, avatar: '', isAdmin: false, joinedDate: new Date(Date.now() - 86400000 * 30).toISOString(), themePreference: 'dark', subscriptionStatus: 'active' },
         { id: 'u2', name: 'Bob Builder', email: 'bob@construction.com', points: 20, isPremium: false, avatar: '', isAdmin: false, joinedDate: new Date(Date.now() - 86400000 * 5).toISOString(), themePreference: 'light', subscriptionStatus: 'inactive' },
       ]);
    }
  }, []);

  useEffect(() => {
    if (user?.themePreference === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.themePreference]);

  // --- ACTIONS ---
  const login = (email: string) => {
    // Check if user exists in our local DB
    const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
        setUser(existing);
    } else {
        // Fallback or Auto-Create
        const isAdmin = email === 'admin@appvault.com';
        const newUser: User = { 
            id: isAdmin ? 'admin' : 'user_' + Date.now(), 
            name: isAdmin ? 'Admin User' : 'User ' + email.split('@')[0], 
            email, 
            points: 100, 
            isPremium: isAdmin, 
            avatar: '', 
            isAdmin, 
            joinedDate: new Date().toISOString(),
            themePreference: 'dark',
            subscriptionStatus: isAdmin ? 'active' : 'inactive'
        };
        setUser(newUser);
        setAllUsers(prev => [...prev, newUser]);
    }
  };

  const signup = (name: string, email: string) => {
    // Prevent duplicate emails
    if (allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        login(email);
        return;
    }

    const newUser: User = { 
      id: 'user_' + Date.now(), 
      name, 
      email, 
      points: 50, 
      isPremium: false, 
      avatar: '', 
      isAdmin: false, 
      joinedDate: new Date().toISOString(),
      themePreference: 'dark',
      subscriptionStatus: 'inactive'
    };
    setUser(newUser);
    setAllUsers(prev => [...prev, newUser]);
  };

  const logout = () => {
    setUser(null);
    setHistory([]);
    setWishlist([]);
  };

  const addApp = (app: AppData) => setApps(prev => [...prev, app]);
  const removeApp = (id: string) => setApps(prev => prev.filter(a => a.id !== id));
  const updateApp = (app: AppData) => setApps(prev => prev.map(a => a.id === app.id ? app : a));

  const addToHistory = (app: AppData, duration: number) => {
    setHistory(prev => [{ id: Date.now().toString(), appId: app.id, appName: app.name, appIcon: app.icon, timestamp: Date.now(), durationSeconds: duration }, ...prev]);
    
    // Award Points
    const pts = 1;
    if (user) {
        const updatedUser = { ...user, points: user.points + pts };
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        setPointsHistory(prev => [{ id: Date.now().toString(), date: new Date().toISOString(), amount: pts, reason: `Used ${app.name}`, type: 'earned' }, ...prev]);
    }
  };

  const reportBug = (desc: string) => {
    if (!user) return;
    setBugReports(prev => [...prev, {
      id: Date.now().toString(), userId: user.id, userName: user.name, description: desc, status: 'pending', date: new Date().toISOString(), rewardPoints: 50
    }]);
  };

  const resolveBug = (id: string, status: 'approved' | 'rejected') => {
    setBugReports(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (status === 'approved') {
       const bug = bugReports.find(b => b.id === id);
       // Award points to the reporter in the DB
       if (bug && bug.rewardPoints > 0) {
           setAllUsers(prev => prev.map(u => {
               if (u.id === bug.userId) return { ...u, points: u.points + bug.rewardPoints };
               return u;
           }));
           // If current user is the reporter, update local state
           if (user && user.id === bug.userId) {
               setUser(u => u ? ({ ...u, points: u.points + bug.rewardPoints }) : null);
           }
       }
    }
  };

  const upgradeUser = (redeemedPoints: number = 0, paymentId?: string) => {
    if (!user) return;
    
    const updatedUser: User = {
         ...user,
         isPremium: true,
         subscriptionStatus: 'active',
         points: user.points - redeemedPoints,
         subscriptionDate: new Date().toISOString(),
         subscriptionId: paymentId || 'manual_upgrade'
    };
    
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    if (redeemedPoints > 0) {
      setPointsHistory(prev => [{
         id: Date.now().toString(),
         date: new Date().toISOString(),
         amount: redeemedPoints,
         reason: 'Discount on Premium',
         type: 'redeemed'
      }, ...prev]);
    }
  };

  const updateUser = (data: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      setUser(updated);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
  };
  
  const deleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        // If admin deletes themselves
        if (user && user.id === userId) logout();
    }
  };

  const deleteAccount = () => { 
      if (user) {
        deleteUser(user.id);
        logout();
      }
  };
  
  const toggleTheme = () => {
    if (user) updateUser({ themePreference: user.themePreference === 'dark' ? 'light' : 'dark' });
  };

  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const submitSupport = (subject: string, message: string) => {
    if (!user) return;
    setSupportTickets(prev => [...prev, {
       id: Date.now().toString(),
       userId: user.id,
       subject,
       message,
       date: new Date().toISOString(),
       status: 'open'
    }]);
  };

  return (
    <HashRouter>
      <AppContext.Provider value={{ 
        user, isAuthenticated: !!user, apps, history, wishlist, bugReports, pointsHistory, notifications,
        login, signup, logout, addToHistory, toggleWishlist, reportBug, resolveBug, 
        upgradeUser, addApp, removeApp, updateApp, updateUser, deleteAccount,
        toggleTheme, submitSupport, allUsers, deleteUser
      } as any}>
        <AppContent />
      </AppContext.Provider>
    </HashRouter>
  );
}