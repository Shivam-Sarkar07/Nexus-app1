import React, { useState } from 'react';
import { AppData, User, BugReport, Category } from '../types';
import { 
  LayoutDashboard, 
  Smartphone, 
  Users, 
  Bug, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Search,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminPanelProps {
  apps: AppData[];
  users: User[]; 
  bugReports: BugReport[];
  onAddApp: (app: AppData) => void;
  onRemoveApp: (id: string) => void;
  onUpdateApp: (app: AppData) => void;
  onResolveBug: (id: string, status: 'approved' | 'rejected') => void;
  onDeleteUser: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  apps, users, bugReports, onAddApp, onRemoveApp, onUpdateApp, onResolveBug, onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apps' | 'users' | 'bugs'>('dashboard');
  const [showAppModal, setShowAppModal] = useState(false);
  const [editingApp, setEditingApp] = useState<AppData | null>(null);

  // App Form State
  const [formState, setFormState] = useState<Partial<AppData>>({
    name: '', description: '', category: Category.UTILITIES, url1: '', url2: '', isPremium: false, icon: ''
  });

  const handleEdit = (app: AppData) => {
    setEditingApp(app);
    setFormState(app);
    setShowAppModal(true);
  };

  const handleSaveApp = () => {
    if (!formState.name || !formState.url1) return;
    
    const newApp: AppData = {
      id: editingApp ? editingApp.id : Date.now().toString(),
      name: formState.name!,
      description: formState.description || '',
      icon: formState.icon || `https://ui-avatars.com/api/?name=${formState.name}&background=random`,
      category: formState.category || Category.UTILITIES,
      url1: formState.url1!,
      url2: formState.url2 || formState.url1!,
      isPremium: formState.isPremium || false,
      rating: editingApp ? editingApp.rating : 5.0,
      plays: editingApp ? editingApp.plays : 0
    };

    if (editingApp) {
      onUpdateApp(newApp);
    } else {
      onAddApp(newApp);
    }
    setShowAppModal(false);
    setEditingApp(null);
    setFormState({ name: '', description: '', category: Category.UTILITIES, url1: '', url2: '', isPremium: false, icon: '' });
  };

  // --- SUB-COMPONENTS ---

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-vault-800 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-vault-900 text-gray-100 p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Console</h1>
            <p className="text-gray-400 text-sm">Manage your platform securely.</p>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'apps', label: 'App Manager', icon: Smartphone },
              { id: 'bugs', label: 'Bug Reports', icon: Bug },
              { id: 'users', label: 'Users', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-vault-accent text-white' 
                    : 'bg-vault-800 text-gray-400 hover:bg-vault-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- DASHBOARD CONTENT --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Apps" value={apps.length} icon={Smartphone} color="blue" />
              <StatCard title="Total Users" value={users.length} icon={Users} color="green" />
              <StatCard title="Active Bugs" value={bugReports.filter(b => b.status === 'pending').length} icon={Bug} color="red" />
              <StatCard title="Total Plays" value={apps.reduce((acc, app) => acc + (app.plays || 0), 0)} icon={LayoutDashboard} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-vault-800 rounded-2xl border border-white/5 p-6">
                <h3 className="font-bold mb-4">Recent Bug Reports</h3>
                <div className="space-y-3">
                  {bugReports.slice(0, 5).map(bug => (
                    <div key={bug.id} className="flex justify-between items-center p-3 bg-vault-900/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{bug.description.substring(0, 30)}...</p>
                        <p className="text-xs text-gray-500">by {bug.userName} • {bug.status}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        bug.status === 'pending' ? 'bg-yellow-500' : 
                        bug.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  ))}
                  {bugReports.length === 0 && <p className="text-gray-500 text-sm">No reports yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- APPS MANAGER --- */}
        {activeTab === 'apps' && (
          <div>
             <div className="flex justify-between items-center mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input placeholder="Search apps..." className="bg-vault-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-vault-accent" />
                </div>
                <button 
                  onClick={() => { setEditingApp(null); setFormState({}); setShowAppModal(true); }}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add App
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apps.map(app => (
                  <div key={app.id} className="bg-vault-800 p-4 rounded-xl border border-white/5 relative group hover:border-vault-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <img src={app.icon} alt="" className="w-12 h-12 rounded-lg bg-vault-700 object-cover" />
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(app)} className="p-1.5 bg-vault-700 rounded-lg hover:text-white text-gray-400">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onRemoveApp(app.id)} className="p-1.5 bg-vault-700 rounded-lg hover:text-red-500 text-gray-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-white">{app.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{app.category}</p>
                    <div className="flex items-center space-x-2 mt-2">
                       {app.isPremium && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded font-bold uppercase">Premium</span>}
                       <a href={app.url1} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center">
                          Test Link <ExternalLink className="w-3 h-3 ml-1" />
                       </a>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* --- BUG MANAGER --- */}
        {activeTab === 'bugs' && (
           <div className="bg-vault-800 rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-vault-900/50 text-gray-400 text-xs uppercase border-b border-white/5">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Issue</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                   {bugReports.map(bug => (
                     <tr key={bug.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                       <td className="p-4 font-medium">{bug.userName}</td>
                       <td className="p-4 text-gray-400 max-w-xs truncate">{bug.description}</td>
                       <td className="p-4 text-gray-500">{new Date(bug.date).toLocaleDateString()}</td>
                       <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            bug.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                            bug.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {bug.status}
                          </span>
                       </td>
                       <td className="p-4 flex justify-end space-x-2">
                          {bug.status === 'pending' && (
                            <>
                              <button onClick={() => onResolveBug(bug.id, 'approved')} className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30" title="Approve & Reward">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => onResolveBug(bug.id, 'rejected')} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
              {bugReports.length === 0 && <div className="p-8 text-center text-gray-500">No bugs reported.</div>}
           </div>
        )}
        
        {/* --- USER MANAGER --- */}
        {activeTab === 'users' && (
           <div className="bg-vault-800 rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-4 border-b border-white/5 flex justify-between items-center">
                 <h3 className="font-bold">Registered Users ({users.length})</h3>
               </div>
               <div className="p-4 space-y-2">
                 {users.map(u => (
                   <div key={u.id} className="flex justify-between items-center bg-vault-900/50 p-3 rounded-lg hover:bg-vault-900 transition-colors group">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full bg-vault-accent flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20">
                            {u.name.charAt(0)}
                         </div>
                         <div>
                            <div className="flex items-center space-x-2">
                                <p className="font-bold text-sm text-white">{u.name}</p>
                                {u.isAdmin && <span className="bg-red-500/20 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                            </div>
                            <p className="text-xs text-gray-500">{u.email}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-mono text-yellow-500 font-bold">{u.points} pts</p>
                            <p className={`text-xs ${u.isPremium ? 'text-purple-400' : 'text-gray-500'}`}>{u.isPremium ? 'Premium' : 'Free'}</p>
                        </div>
                        <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="p-2 bg-vault-800 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                 ))}
                 {users.length === 0 && <div className="text-center p-8 text-gray-500">No users found.</div>}
               </div>
           </div>
        )}
      </div>

      {/* --- ADD/EDIT APP MODAL --- */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-vault-800 border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingApp ? 'Edit App' : 'Deploy New App'}</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <input 
                className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm" 
                placeholder="App Name"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
              <textarea 
                className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm" 
                placeholder="Description"
                rows={3}
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="bg-vault-900 border border-white/10 rounded-lg p-3 text-sm"
                  value={formState.category}
                  onChange={e => setFormState({...formState, category: e.target.value as Category})}
                >
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center space-x-2 bg-vault-900 border border-white/10 rounded-lg px-3">
                  <input 
                    type="checkbox"
                    checked={formState.isPremium}
                    onChange={e => setFormState({...formState, isPremium: e.target.checked})}
                  />
                  <span className="text-sm">Premium App</span>
                </div>
              </div>
              <input 
                className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm" 
                placeholder="Icon URL (https://...)"
                value={formState.icon}
                onChange={e => setFormState({...formState, icon: e.target.value})}
              />
              <div className="space-y-2">
                 <label className="text-xs text-gray-500">Secure Container Links</label>
                 <input 
                  className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm font-mono" 
                  placeholder="Primary URL (Link 1)"
                  value={formState.url1}
                  onChange={e => setFormState({...formState, url1: e.target.value})}
                />
                 <input 
                  className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm font-mono" 
                  placeholder="Failover URL (Link 2)"
                  value={formState.url2}
                  onChange={e => setFormState({...formState, url2: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
               <button onClick={() => setShowAppModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
               <button onClick={handleSaveApp} className="px-6 py-2 bg-vault-accent hover:bg-vault-accentHover text-white font-bold rounded-lg">
                 {editingApp ? 'Update App' : 'Deploy'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};