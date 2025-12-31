
import React, { useState } from 'react';
import { User, BugReport, PointTransaction, Notification, SupportTicket } from '../types';
import { 
  User as UserIcon, Settings, Zap, Bug, Bell, ShieldCheck, CircleHelp, 
  ChevronLeft, CreditCard, LogOut, Check, Loader2, Crown, Sun, Moon, Trash2, Mail, Lock, Smartphone
} from 'lucide-react';

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ProfileViewProps {
  user: User;
  bugReports: BugReport[];
  pointsHistory: PointTransaction[];
  notifications: Notification[];
  supportTickets?: SupportTicket[];
  onLogout: () => void;
  onUpgrade: (redeemedPoints?: number, paymentId?: string) => void;
  onReportBug: (title: string, desc: string, contact: string) => void;
  onRateApp: (stars: number) => void;
  onUpdateUser: (data: Partial<User>) => void;
  onDeleteAccount: () => void;
  onToggleTheme: () => void;
  onChangePassword: (newPass: string) => Promise<void>;
  onSubmitSupport: (subject: string, message: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user, bugReports, pointsHistory, notifications, supportTickets = [], onLogout, onUpgrade, onReportBug, onUpdateUser, onDeleteAccount, onToggleTheme, onSubmitSupport, onChangePassword
}) => {
  const [activePage, setActivePage] = useState<string>('main');
  const [loading, setLoading] = useState(false);
  
  // State for sub-pages
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugContact, setBugContact] = useState(user.email); // Default to user email
  
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  
  const [redeemPoints, setRedeemPoints] = useState(false);
  
  // Settings Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // TODO: Replace this with your actual Razorpay Key ID
  const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID"; 

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center mb-6">
      <button onClick={() => setActivePage('main')} className="mr-3 p-1 rounded-full bg-slate-200 dark:bg-vault-800 hover:bg-slate-300 dark:hover:bg-vault-700 text-slate-800 dark:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );

  // --- SUB PAGES ---

  if (activePage === 'upgrade') {
    const WEBSITE_PRICE = 199; // INR
    const INAPP_PRICE = 299; // INR
    // 10 points = 1 INR discount
    const maxDiscountPoints = Math.min(user.points, WEBSITE_PRICE * 10);
    const discountAmount = redeemPoints ? Math.floor(maxDiscountPoints / 10) : 0;
    const finalPrice = Math.max(0, WEBSITE_PRICE - discountAmount);

    const handlePayment = () => {
      setLoading(true);

      // 1. DEMO MODE / MISSING KEY CHECK
      if (RAZORPAY_KEY_ID === "YOUR_RAZORPAY_KEY_ID") {
        const wantsDemo = window.confirm(
          "Razorpay Key is not configured in the code.\n\nClick OK to simulate a successful payment (Demo Mode).\nClick Cancel to abort."
        );
        
        if (wantsDemo) {
          setTimeout(() => {
            onUpgrade(redeemPoints ? maxDiscountPoints : 0, "demo_" + Date.now());
            setLoading(false);
            setActivePage('main');
            alert("Demo Payment Successful! Welcome to Premium.");
          }, 1500);
        } else {
          setLoading(false);
        }
        return;
      }

      // 2. 100% DISCOUNT CHECK (PRICE 0)
      if (finalPrice <= 0) {
        setTimeout(() => {
          onUpgrade(redeemPoints ? maxDiscountPoints : 0, "points_full_" + Date.now());
          setLoading(false);
          setActivePage('main');
          alert("Upgrade Successful! Full discount applied via points.");
        }, 1500);
        return;
      }

      // 3. CHECK RAZORPAY SDK
      if (!window.Razorpay) {
        alert("Payment gateway failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 4. INITIATE PAYMENT
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(finalPrice * 100), // Amount in paise
        currency: "INR",
        name: "AppVault Premium",
        description: "Unlock all apps & features",
        image: "https://ui-avatars.com/api/?name=AppVault&background=8b5cf6&color=fff",
        handler: function (response: any) {
          console.log("Payment Success:", response);
          // Pass the REDEEMED points to the upgrader to subtract them
          onUpgrade(redeemPoints ? maxDiscountPoints : 0, response.razorpay_payment_id);
          setLoading(false);
          setActivePage('main');
          alert("Payment Successful! Transaction ID: " + response.razorpay_payment_id);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: "" 
        },
        theme: {
          color: "#8b5cf6"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setLoading(false);
          console.error("Payment Failed:", response.error);
          alert(`Payment Failed: ${response.error.description || 'Unknown error'}`);
        });
        rzp.open();
      } catch (err) {
        setLoading(false);
        console.error("Razorpay Initialization Error:", err);
        alert("Failed to open payment gateway. Please check console for details.");
      }
    };

    return (
      <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
        <Header title="Plan & Billing" />
        
        {/* Current Plan Status */}
        <div className="bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/10 mb-6 flex justify-between items-center shadow-sm dark:shadow-none">
           <div>
              <p className="text-slate-500 dark:text-gray-400 text-xs">Current Plan</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white">{user.isPremium ? 'Website Premium' : 'Free Basic'}</p>
           </div>
           <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-500' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {user.subscriptionStatus === 'active' ? 'ACTIVE' : 'INACTIVE'}
           </span>
        </div>

        {user.isPremium ? (
             <div className="text-center py-10">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">You are Premium!</h3>
                <p className="text-slate-600 dark:text-gray-400 text-sm mt-2">Enjoy unlimited access to all apps.</p>
                {user.subscriptionDate && <p className="text-xs text-gray-500 mt-2">Member since {new Date(user.subscriptionDate).toLocaleDateString()}</p>}
             </div>
        ) : (
            <>
                <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Choose Your Plan</h3>
                
                {/* Comparison Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-violet-900/40 dark:to-fuchsia-900/40 border border-transparent dark:border-vault-accent/30 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-lg dark:shadow-none text-white">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">BEST VALUE</div>
                    <div className="flex items-center mb-4">
                        <Crown className="w-6 h-6 text-yellow-300 mr-2" />
                        <h3 className="text-xl font-bold">Website Premium</h3>
                    </div>
                    <div className="text-3xl font-bold mb-1">₹{WEBSITE_PRICE}<span className="text-sm font-normal text-indigo-200"> / month</span></div>
                    <p className="text-xs text-indigo-200 mb-4">vs ₹{INAPP_PRICE} on App Stores</p>
                    
                    <div className="space-y-2 mb-6 text-sm text-indigo-100">
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-300 mr-2"/> Unlimited App Usage</div>
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-300 mr-2"/> Priority AI Access</div>
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-300 mr-2"/> Works on All Devices</div>
                    </div>

                    {/* Points Redemption */}
                    <div className="bg-black/20 dark:bg-black/30 rounded-lg p-3 mb-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs text-white/90 flex items-center">
                              <Zap className="w-3 h-3 text-yellow-400 mr-1"/> Use Points ({user.points})
                           </span>
                           <input 
                              type="checkbox" 
                              checked={redeemPoints}
                              onChange={e => setRedeemPoints(e.target.checked)}
                              className="accent-purple-500 w-4 h-4"
                              disabled={user.points < 10}
                           />
                        </div>
                        {redeemPoints && (
                           <div className="flex justify-between text-xs font-bold text-green-300">
                              <span>Discount Applied</span>
                              <span>- ₹{discountAmount}</span>
                           </div>
                        )}
                    </div>

                    <button 
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay ₹${finalPrice} Securely`}
                    </button>
                    <p className="text-[10px] text-center text-indigo-200 mt-3">
                        Secured by Razorpay • Cancel anytime via Settings
                    </p>
                </div>
            </>
        )}
      </div>
    );
  }

  if (activePage === 'points') {
    return (
      <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
        <Header title="My Points" />
        <div className="bg-orange-50 dark:bg-[#2a2520] border border-orange-200 dark:border-orange-500/20 rounded-2xl p-6 mb-6 shadow-sm dark:shadow-none">
           <p className="text-orange-800 dark:text-gray-400 text-sm">Total Balance</p>
           <div className="flex items-center mt-2">
             <Zap className="w-8 h-8 text-orange-500 dark:text-yellow-500 fill-orange-500 dark:fill-yellow-500 mr-2" />
             <span className="text-4xl font-bold text-orange-900 dark:text-white">{user.points}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-white dark:bg-vault-800 p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">How to Earn</h4>
                <div className="space-y-3">
                    <div className="flex items-start">
                        <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg mr-3">
                            <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">Use Apps</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Earn 1 point for every app session.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg mr-3">
                            <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">Find Genuine Bugs</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Report issues to earn 50+ points per approved bug report.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <h3 className="font-bold mb-4 text-slate-500 dark:text-gray-400 text-sm">History</h3>
        <div className="space-y-3">
           {pointsHistory.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No points earned yet. Start playing!</p>}
           {pointsHistory.map(p => (
             <div key={p.id} className="flex justify-between items-center bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{p.reason}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${p.type === 'earned' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {p.type === 'earned' ? '+' : '-'}{p.amount}
                </span>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (activePage === 'bugs') {
    return (
      <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
        <Header title="Bug Reports" />
        <div className="bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/5 mb-6 shadow-sm dark:shadow-none">
           <h3 className="font-bold text-slate-900 dark:text-white mb-4">Report an Issue</h3>
           <div className="space-y-3">
               <input 
                 className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-sky-500 dark:focus:border-vault-accent outline-none"
                 placeholder="Bug Title (e.g., App Not Loading)"
                 value={bugTitle}
                 onChange={e => setBugTitle(e.target.value)}
               />
               <textarea 
                 className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm min-h-[100px] text-slate-900 dark:text-white focus:border-sky-500 dark:focus:border-vault-accent outline-none"
                 placeholder="Detailed description of the bug..."
                 value={bugDesc}
                 onChange={e => setBugDesc(e.target.value)}
               />
               <input 
                 className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-sky-500 dark:focus:border-vault-accent outline-none"
                 placeholder="Contact Email/Phone for Rewards"
                 value={bugContact}
                 onChange={e => setBugContact(e.target.value)}
               />
               <button 
                 onClick={() => { 
                    if(bugTitle && bugDesc && bugContact){ 
                        onReportBug(bugTitle, bugDesc, bugContact); 
                        setBugTitle(''); setBugDesc(''); 
                        alert('Report Submitted! Check status below.'); 
                    } else {
                        alert("Please fill all fields to receive rewards.");
                    }
                 }}
                 className="mt-2 w-full bg-sky-600 dark:bg-vault-accent hover:bg-sky-700 dark:hover:bg-vault-accentHover text-white font-bold py-3 rounded-lg text-sm transition-colors"
               >
                 Submit Report
               </button>
           </div>
        </div>
        <h3 className="font-bold mb-4 text-slate-500 dark:text-gray-400 text-sm">My Reports</h3>
        <div className="space-y-3">
           {bugReports.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No bugs reported.</p>}
           {bugReports.map(b => (
             <div key={b.id} className="bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                <div className="flex justify-between items-start mb-2">
                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                     b.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500' : 
                     b.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-500' : 
                     'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-500'
                   }`}>{b.status}</span>
                   <span className="text-xs text-slate-400 dark:text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{b.title}</h4>
                <p className="text-sm text-slate-600 dark:text-gray-300">{b.description}</p>
                {b.status === 'approved' && b.rewardPoints > 0 && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-transparent p-2 rounded">
                    <Zap className="w-3 h-3 mr-1 fill-current" />
                    +{b.rewardPoints} Points Reward Processed
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (activePage === 'notifications') {
      return (
        <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
            <Header title="Notifications" />
            <div className="space-y-3">
                {notifications.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                        <p>No new notifications</p>
                    </div>
                )}
                {notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border border-slate-200 dark:border-white/5 ${n.read ? 'bg-slate-50 dark:bg-vault-800 opacity-70' : 'bg-white dark:bg-vault-800 border-l-4 border-l-sky-500 dark:border-l-vault-accent shadow-sm'}`}>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{n.title}</h4>
                        <p className="text-slate-600 dark:text-gray-400 text-xs mb-2">{n.message}</p>
                        <p className="text-[10px] text-gray-500">{new Date(n.date).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
      )
  }

  if (activePage === 'settings') {
     return (
        <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
           <Header title="Settings" />
           <div className="space-y-6">
              
              {/* Profile */}
              <div>
                  <h3 className="text-slate-500 dark:text-gray-400 text-xs uppercase font-bold mb-3">Profile</h3>
                  <div className="bg-white dark:bg-vault-800 rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-4 shadow-sm dark:shadow-none">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 dark:text-gray-500">Display Name</label>
                        <input className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white" value={user.name} onChange={(e) => onUpdateUser({name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs text-slate-500 dark:text-gray-500">Email Address</label>
                         <input className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-500 dark:text-gray-500" value={user.email} disabled />
                      </div>
                  </div>
              </div>

              {/* Preferences */}
              <div>
                  <h3 className="text-slate-500 dark:text-gray-400 text-xs uppercase font-bold mb-3">Appearance</h3>
                  <div className="bg-white dark:bg-vault-800 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" onClick={onToggleTheme}>
                          <div className="flex items-center">
                              {user.themePreference === 'dark' ? <Moon className="w-4 h-4 mr-3 text-gray-400"/> : <Sun className="w-4 h-4 mr-3 text-yellow-500"/>}
                              <span className="text-sm font-medium text-slate-900 dark:text-white">Dark Mode</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${user.themePreference === 'dark' ? 'bg-vault-accent justify-end' : 'bg-gray-300 justify-start'}`}>
                              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Account Actions */}
              <div>
                 <h3 className="text-slate-500 dark:text-gray-400 text-xs uppercase font-bold mb-3">Account Security</h3>
                 <div className="space-y-3">
                    <button 
                        onClick={() => setShowPwdModal(true)}
                        className="w-full bg-white dark:bg-vault-800 border border-slate-200 dark:border-white/5 p-4 rounded-xl text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white shadow-sm dark:shadow-none flex items-center"
                    >
                        <Lock className="w-4 h-4 mr-2 text-slate-500" />
                        Change Password
                    </button>
                    <button onClick={onLogout} className="w-full bg-white dark:bg-vault-800 border border-red-200 dark:border-red-500/20 p-4 rounded-xl text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center shadow-sm dark:shadow-none">
                        <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </button>
                    <button onClick={() => { if(confirm('Are you sure you want to delete your account? This cannot be undone.')) onDeleteAccount(); }} className="w-full p-2 text-center text-xs text-gray-500 hover:text-red-500 underline">
                        Delete Account Permanently
                    </button>
                 </div>
              </div>
           </div>

           {/* Change Password Modal */}
           {showPwdModal && (
               <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                   <div className="bg-white dark:bg-vault-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                       <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Change Password</h3>
                       <input 
                         type="password"
                         className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm mb-4 text-slate-900 dark:text-white"
                         placeholder="New Password"
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                       />
                       <div className="flex space-x-3">
                           <button onClick={() => setShowPwdModal(false)} className="flex-1 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Cancel</button>
                           <button 
                            onClick={async () => {
                                if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
                                try {
                                    await onChangePassword(newPassword);
                                    setShowPwdModal(false);
                                    setNewPassword('');
                                } catch(e) {
                                    alert("Failed to update password.");
                                }
                            }} 
                            className="flex-1 py-2 bg-sky-600 dark:bg-vault-accent text-white rounded-lg text-sm font-bold"
                           >
                            Update
                           </button>
                       </div>
                   </div>
               </div>
           )}
        </div>
     )
  }

  if (activePage === 'help') {
     return (
        <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
           <Header title="Help Center" />
           
           <div className="bg-white dark:bg-vault-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 mb-8 shadow-sm dark:shadow-none">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Contact Support</h3>
              <div className="space-y-3">
                 <input 
                    placeholder="Subject" 
                    className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:border-sky-500 dark:focus:border-vault-accent outline-none"
                    value={supportSubject}
                    onChange={e => setSupportSubject(e.target.value)}
                 />
                 <textarea 
                    placeholder="How can we help you?" 
                    className="w-full bg-slate-50 dark:bg-vault-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white min-h-[120px] focus:border-sky-500 dark:focus:border-vault-accent outline-none"
                    value={supportMessage}
                    onChange={e => setSupportMessage(e.target.value)}
                 />
                 <button 
                    onClick={() => {
                        if (supportSubject && supportMessage) {
                            onSubmitSupport(supportSubject, supportMessage);
                            setSupportSubject('');
                            setSupportMessage('');
                            alert('Message sent! We will reply shortly.');
                        }
                    }}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 flex items-center justify-center transition-colors"
                 >
                    <Mail className="w-4 h-4 mr-2" /> Send Message
                 </button>
              </div>
           </div>

           {/* Previous Tickets with Replies */}
           {supportTickets && supportTickets.length > 0 && (
             <div className="mb-8">
                 <h3 className="font-bold text-slate-500 dark:text-gray-400 text-sm uppercase mb-3">Your Tickets</h3>
                 <div className="space-y-4">
                     {supportTickets.map(ticket => (
                         <div key={ticket.id} className="bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ticket.subject}</h4>
                                <span className="text-xs text-gray-500">{new Date(ticket.date).toLocaleDateString()}</span>
                             </div>
                             <p className="text-sm text-slate-600 dark:text-gray-400 mb-3 bg-slate-50 dark:bg-vault-900 p-3 rounded-lg">{ticket.message}</p>
                             
                             {ticket.adminReply ? (
                                 <div className="pl-4 border-l-2 border-sky-500 dark:border-vault-accent">
                                     <p className="text-xs font-bold text-sky-600 dark:text-vault-accent mb-1">Admin Reply</p>
                                     <p className="text-sm text-slate-800 dark:text-gray-200">{ticket.adminReply}</p>
                                 </div>
                             ) : (
                                 <p className="text-xs text-gray-400 italic">Waiting for reply...</p>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
           )}

           <div className="space-y-4">
              <h3 className="font-bold text-slate-500 dark:text-gray-400 text-sm uppercase">Common Questions</h3>
              {[
                {q: "Is this really free?", a: "Yes, we have a free tier supported by non-intrusive ads."},
                {q: "Do I need to download anything?", a: "Never. Everything runs in the cloud."},
                {q: "Why are there two links?", a: "Sometimes cloud providers block traffic. The secondary link is a backup mirror."},
              ].map((faq, i) => (
                <div key={i} className="bg-white dark:bg-vault-800 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                   <h4 className="font-bold text-slate-900 dark:text-white mb-2">{faq.q}</h4>
                   <p className="text-sm text-slate-600 dark:text-gray-400">{faq.a}</p>
                </div>
              ))}
           </div>
           
           <div className="mt-8 text-center text-sm text-gray-500">
              <p>Support Email: support@appvault.com</p>
           </div>
        </div>
     )
  }

  // --- MAIN PROFILE MENU ---

  const MenuItem = ({ icon: Icon, label, color, onClick, subLabel }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white dark:bg-vault-800 border-b border-slate-100 dark:border-white/5 first:rounded-t-2xl last:rounded-b-2xl last:border-0 hover:bg-slate-50 dark:hover:bg-vault-700 cursor-pointer group transition-colors">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color === 'white' ? 'bg-slate-100 text-slate-500' : `bg-${color}-100 dark:bg-${color}-500/10`} mr-4 group-hover:scale-110 transition-transform`}>
           <Icon className={`w-5 h-5 ${color === 'white' ? 'text-slate-600' : `text-${color}-600 dark:text-${color}-400`}`} />
        </div>
        <span className="font-medium text-sm text-slate-700 dark:text-gray-200">{label}</span>
      </div>
      <div className="flex items-center">
         {subLabel && <span className="text-xs text-slate-400 dark:text-gray-500 mr-2">{subLabel}</span>}
         <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-gray-600 rotate-180" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6 pt-4 text-slate-900 dark:text-white">Profile</h1>
      
      {/* User Card */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 dark:from-vault-accent dark:to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user.name.charAt(0)}
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{user.email}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${user.isPremium ? 'border-purple-500 text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-500/10' : 'border-gray-400 text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'}`}>
                {user.isPremium ? 'PREMIUM' : 'FREE ACCOUNT'}
            </span>
        </div>
      </div>

      {/* Upgrade Callout */}
      {!user.isPremium && (
         <div onClick={() => setActivePage('upgrade')} className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-violet-900/50 dark:to-purple-900/50 border border-transparent dark:border-purple-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity shadow-lg dark:shadow-none">
            <div className="flex items-center">
               <Crown className="w-8 h-8 text-yellow-300 dark:text-yellow-400 mr-3" />
               <div>
                  <h3 className="font-bold text-white">Go Premium</h3>
                  <p className="text-xs text-indigo-100 dark:text-gray-300">Unlock all features</p>
               </div>
            </div>
            <div className="bg-white text-indigo-700 dark:text-black text-xs font-bold px-3 py-1.5 rounded-full">Upgrade</div>
         </div>
      )}

      {/* Menu List */}
      <div className="rounded-2xl overflow-hidden mb-6 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5">
        <MenuItem icon={Crown} label="Plan & Billing" color="purple" onClick={() => setActivePage('upgrade')} subLabel={user.isPremium ? 'Active' : 'Free'} />
        <MenuItem icon={Zap} label="My Points" color="yellow" onClick={() => setActivePage('points')} subLabel={`${user.points} pts`} />
        <MenuItem icon={Bug} label="Bug Reports" color="red" onClick={() => setActivePage('bugs')} />
        <MenuItem icon={Bell} label="Notifications" color="blue" onClick={() => setActivePage('notifications')} subLabel={notifications.filter(n=>!n.read).length > 0 ? 'New' : ''} />
        <MenuItem icon={ShieldCheck} label="Privacy & Security" color="green" onClick={() => setActivePage('privacy')} />
        <MenuItem icon={CircleHelp} label="Help Center" color="teal" onClick={() => setActivePage('help')} />
        <MenuItem icon={Settings} label="Settings" color="white" onClick={() => setActivePage('settings')} />
      </div>

      <div className="text-center mt-8 text-xs text-gray-500">
         AppVault v2.2.0 (Stable) • Powered by Supabase & Gemini
      </div>
    </div>
  );
};