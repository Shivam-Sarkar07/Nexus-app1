import React, { useState } from 'react';
import { User, BugReport, PointTransaction, Notification } from '../types';
import { 
  User as UserIcon, Settings, Zap, Bug, Bell, ShieldCheck, CircleHelp, 
  ChevronLeft, CreditCard, LogOut, Check, Loader2, Crown, Sun, Moon, Trash2, Mail
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
  onLogout: () => void;
  onUpgrade: (redeemedPoints?: number, paymentId?: string) => void;
  onReportBug: (desc: string) => void;
  onRateApp: (stars: number) => void;
  onUpdateUser: (data: Partial<User>) => void;
  onDeleteAccount: () => void;
  onToggleTheme: () => void;
  onSubmitSupport: (subject: string, message: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user, bugReports, pointsHistory, notifications, onLogout, onUpgrade, onReportBug, onUpdateUser, onDeleteAccount, onToggleTheme, onSubmitSupport
}) => {
  const [activePage, setActivePage] = useState<string>('main');
  const [loading, setLoading] = useState(false);
  
  // State for sub-pages
  const [bugText, setBugText] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);

  // TODO: Replace this with your actual Razorpay Key ID
  const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID"; 

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center mb-6">
      <button onClick={() => setActivePage('main')} className="mr-3 p-1 rounded-full bg-vault-800 hover:bg-vault-700">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-bold">{title}</h2>
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
        <div className="bg-vault-800 p-4 rounded-xl border border-white/10 mb-6 flex justify-between items-center">
           <div>
              <p className="text-gray-400 text-xs">Current Plan</p>
              <p className="font-bold text-lg text-white">{user.isPremium ? 'Website Premium' : 'Free Basic'}</p>
           </div>
           <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
              {user.subscriptionStatus === 'active' ? 'ACTIVE' : 'INACTIVE'}
           </span>
        </div>

        {user.isPremium ? (
             <div className="text-center py-10">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">You are Premium!</h3>
                <p className="text-gray-400 text-sm mt-2">Enjoy unlimited access to all apps.</p>
                {user.subscriptionDate && <p className="text-xs text-gray-500 mt-2">Member since {new Date(user.subscriptionDate).toLocaleDateString()}</p>}
                <p className="text-xs text-gray-500 mt-8">Need billing help? Contact support.</p>
             </div>
        ) : (
            <>
                <h3 className="font-bold mb-4 text-white">Choose Your Plan</h3>
                
                {/* Comparison Card */}
                <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 border border-vault-accent/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">BEST VALUE</div>
                    <div className="flex items-center mb-4">
                        <Crown className="w-6 h-6 text-yellow-400 mr-2" />
                        <h3 className="text-xl font-bold text-white">Website Premium</h3>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">₹{WEBSITE_PRICE}<span className="text-sm font-normal text-gray-300"> / month</span></div>
                    <p className="text-xs text-gray-400 mb-4">vs ₹{INAPP_PRICE} on App Stores</p>
                    
                    <div className="space-y-2 mb-6 text-sm text-gray-200">
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-2"/> Unlimited App Usage</div>
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-2"/> Priority AI Access</div>
                        <div className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-2"/> Works on All Devices</div>
                    </div>

                    {/* Points Redemption */}
                    <div className="bg-black/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs text-gray-300 flex items-center">
                              <Zap className="w-3 h-3 text-yellow-500 mr-1"/> Use Points ({user.points})
                           </span>
                           <input 
                              type="checkbox" 
                              checked={redeemPoints}
                              onChange={e => setRedeemPoints(e.target.checked)}
                              className="accent-vault-accent w-4 h-4"
                              disabled={user.points < 10}
                           />
                        </div>
                        {redeemPoints && (
                           <div className="flex justify-between text-xs font-bold text-green-400">
                              <span>Discount Applied</span>
                              <span>- ₹{discountAmount}</span>
                           </div>
                        )}
                    </div>

                    <button 
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay ₹${finalPrice} Securely`}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-3">
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
        <div className="bg-[#2a2520] border border-orange-500/20 rounded-2xl p-6 mb-6">
           <p className="text-gray-400 text-sm">Total Balance</p>
           <div className="flex items-center mt-2">
             <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500 mr-2" />
             <span className="text-4xl font-bold text-white">{user.points}</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-vault-800 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white mb-1">How to Earn</h4>
                <p className="text-xs text-gray-400">+1 Point for every app launch</p>
                <p className="text-xs text-gray-400 mt-1">Admin rewards for bug reports</p>
            </div>
            <div className="bg-vault-800 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white mb-1">Redeem</h4>
                <p className="text-xs text-gray-400">10 Points = ₹1 Discount</p>
                <p className="text-xs text-gray-400 mt-1">Use on Website Premium</p>
            </div>
        </div>

        <h3 className="font-bold mb-4 text-gray-400 text-sm">History</h3>
        <div className="space-y-3">
           {pointsHistory.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No points earned yet. Start playing!</p>}
           {pointsHistory.map(p => (
             <div key={p.id} className="flex justify-between items-center bg-vault-800 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-sm text-white">{p.reason}</p>
                  <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${p.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
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
        <div className="bg-vault-800 p-4 rounded-xl border border-white/5 mb-6">
           <h3 className="font-bold text-white mb-2">Report an Issue</h3>
           <textarea 
             className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm min-h-[100px] text-white focus:border-vault-accent outline-none"
             placeholder="Describe the bug you found (App name, what happened?)"
             value={bugText}
             onChange={e => setBugText(e.target.value)}
           />
           <button 
             onClick={() => { if(bugText){ onReportBug(bugText); setBugText(''); alert('Report Submitted!'); } }}
             className="mt-3 w-full bg-vault-accent hover:bg-vault-accentHover text-white font-bold py-2 rounded-lg text-sm"
           >
             Submit Report
           </button>
        </div>
        <h3 className="font-bold mb-4 text-gray-400 text-sm">My Reports</h3>
        <div className="space-y-3">
           {bugReports.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No bugs reported.</p>}
           {bugReports.map(b => (
             <div key={b.id} className="bg-vault-800 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                     b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                     b.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                   }`}>{b.status}</span>
                   <span className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300">{b.description}</p>
                {b.status === 'approved' && b.rewardPoints > 0 && (
                  <div className="mt-2 text-xs text-green-400 flex items-center">
                    <Zap className="w-3 h-3 mr-1 fill-green-400" />
                    +{b.rewardPoints} Points Reward
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
                    <div key={n.id} className={`p-4 rounded-xl border border-white/5 ${n.read ? 'bg-vault-800 opacity-70' : 'bg-vault-800 border-l-4 border-l-vault-accent'}`}>
                        <h4 className="font-bold text-white text-sm mb-1">{n.title}</h4>
                        <p className="text-gray-400 text-xs mb-2">{n.message}</p>
                        <p className="text-[10px] text-gray-600">{new Date(n.date).toLocaleDateString()}</p>
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
                  <h3 className="text-gray-400 text-xs uppercase font-bold mb-3">Profile</h3>
                  <div className="bg-vault-800 rounded-xl border border-white/5 p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Display Name</label>
                        <input className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm text-white" value={user.name} onChange={(e) => onUpdateUser({name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs text-gray-500">Email Address</label>
                         <input className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm text-gray-500" value={user.email} disabled />
                      </div>
                  </div>
              </div>

              {/* Preferences */}
              <div>
                  <h3 className="text-gray-400 text-xs uppercase font-bold mb-3">Preferences</h3>
                  <div className="bg-vault-800 rounded-xl border border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5" onClick={onToggleTheme}>
                          <div className="flex items-center">
                              {user.themePreference === 'dark' ? <Moon className="w-4 h-4 mr-3 text-gray-400"/> : <Sun className="w-4 h-4 mr-3 text-yellow-500"/>}
                              <span className="text-sm font-medium">Dark Mode</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full flex items-center px-1 ${user.themePreference === 'dark' ? 'bg-vault-accent justify-end' : 'bg-gray-600 justify-start'}`}>
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Account Actions */}
              <div>
                 <h3 className="text-gray-400 text-xs uppercase font-bold mb-3">Account</h3>
                 <div className="space-y-3">
                    <button className="w-full bg-vault-800 border border-white/5 p-4 rounded-xl text-left text-sm font-medium hover:bg-white/5">
                        Change Password
                    </button>
                    <button onClick={onLogout} className="w-full bg-vault-800 border border-red-500/20 p-4 rounded-xl text-left text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center">
                        <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </button>
                    <button onClick={() => { if(confirm('Are you sure you want to delete your account? This cannot be undone.')) onDeleteAccount(); }} className="w-full p-2 text-center text-xs text-gray-600 hover:text-red-500 underline">
                        Delete Account Permanently
                    </button>
                 </div>
              </div>
           </div>
        </div>
     )
  }

  if (activePage === 'privacy') {
     return (
        <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
           <Header title="Privacy & Security" />
           <div className="space-y-6">
             <div className="bg-vault-800 p-6 rounded-2xl border border-white/5">
               <ShieldCheck className="w-12 h-12 text-green-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">We protect your privacy</h3>
               <p className="text-sm text-gray-400">AppVault is designed with privacy as a core principle. Here is how we keep you safe:</p>
               
               <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                     <div className="bg-white/10 p-1.5 rounded mr-3 mt-0.5"><Check className="w-3 h-3 text-green-400"/></div>
                     <div>
                        <h4 className="font-bold text-sm text-white">No Downloads</h4>
                        <p className="text-xs text-gray-400">Apps run in our cloud. No code is ever executed on your local device storage.</p>
                     </div>
                  </div>
                  <div className="flex items-start">
                     <div className="bg-white/10 p-1.5 rounded mr-3 mt-0.5"><Check className="w-3 h-3 text-green-400"/></div>
                     <div>
                        <h4 className="font-bold text-sm text-white">Sandboxed Sessions</h4>
                        <p className="text-xs text-gray-400">Every app launch creates a disposable, isolated container that is destroyed on exit.</p>
                     </div>
                  </div>
                  <div className="flex items-start">
                     <div className="bg-white/10 p-1.5 rounded mr-3 mt-0.5"><Check className="w-3 h-3 text-green-400"/></div>
                     <div>
                        <h4 className="font-bold text-sm text-white">Encrypted Data</h4>
                        <p className="text-xs text-gray-400">Your profile and activity logs are encrypted at rest using AES-256.</p>
                     </div>
                  </div>
               </div>
             </div>
             
             <div className="text-center pt-4">
                <p className="text-xs text-gray-500 mb-2">Read our full legal documents:</p>
                <div className="flex justify-center space-x-4 text-xs text-vault-accent">
                   <button className="hover:underline">Terms of Service</button>
                   <button className="hover:underline">Privacy Policy</button>
                </div>
             </div>
           </div>
        </div>
     )
  }

  if (activePage === 'help') {
     return (
        <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
           <Header title="Help Center" />
           
           <div className="bg-vault-800 p-6 rounded-2xl border border-white/5 mb-8">
              <h3 className="font-bold text-white mb-4">Contact Support</h3>
              <div className="space-y-3">
                 <input 
                    placeholder="Subject" 
                    className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-vault-accent outline-none"
                    value={supportSubject}
                    onChange={e => setSupportSubject(e.target.value)}
                 />
                 <textarea 
                    placeholder="How can we help you?" 
                    className="w-full bg-vault-900 border border-white/10 rounded-lg p-3 text-sm text-white min-h-[120px] focus:border-vault-accent outline-none"
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
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                 >
                    <Mail className="w-4 h-4 mr-2" /> Send Message
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="font-bold text-gray-400 text-sm uppercase">Common Questions</h3>
              {[
                {q: "Is this really free?", a: "Yes, we have a free tier supported by non-intrusive ads."},
                {q: "Do I need to download anything?", a: "Never. Everything runs in the cloud."},
                {q: "Why are there two links?", a: "Sometimes cloud providers block traffic. The secondary link is a backup mirror."},
              ].map((faq, i) => (
                <div key={i} className="bg-vault-800 p-4 rounded-xl border border-white/5">
                   <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                   <p className="text-sm text-gray-400">{faq.a}</p>
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
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-vault-800 border-b border-white/5 first:rounded-t-2xl last:rounded-b-2xl last:border-0 hover:bg-vault-700 cursor-pointer group">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-500/10 mr-4 group-hover:scale-110 transition-transform`}>
           <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <span className="font-medium text-sm text-gray-200">{label}</span>
      </div>
      <div className="flex items-center">
         {subLabel && <span className="text-xs text-gray-500 mr-2">{subLabel}</span>}
         <ChevronLeft className="w-4 h-4 text-gray-600 rotate-180" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6 pt-4 text-white">Profile</h1>
      
      {/* User Card */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vault-accent to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user.name.charAt(0)}
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-gray-400 text-sm mb-1">{user.email}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${user.isPremium ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-gray-600 text-gray-400 bg-gray-800'}`}>
                {user.isPremium ? 'PREMIUM' : 'FREE ACCOUNT'}
            </span>
        </div>
      </div>

      {/* Upgrade Callout */}
      {!user.isPremium && (
         <div onClick={() => setActivePage('upgrade')} className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 border border-purple-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity">
            <div className="flex items-center">
               <Crown className="w-8 h-8 text-yellow-400 mr-3" />
               <div>
                  <h3 className="font-bold text-white">Go Premium</h3>
                  <p className="text-xs text-gray-300">Unlock all features</p>
               </div>
            </div>
            <div className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full">Upgrade</div>
         </div>
      )}

      {/* Menu List */}
      <div className="rounded-2xl overflow-hidden mb-6">
        <MenuItem icon={Crown} label="Plan & Billing" color="purple" onClick={() => setActivePage('upgrade')} subLabel={user.isPremium ? 'Active' : 'Free'} />
        <MenuItem icon={Zap} label="My Points" color="yellow" onClick={() => setActivePage('points')} subLabel={`${user.points} pts`} />
        <MenuItem icon={Bug} label="Bug Reports" color="red" onClick={() => setActivePage('bugs')} />
        <MenuItem icon={Bell} label="Notifications" color="blue" onClick={() => setActivePage('notifications')} subLabel={notifications.filter(n=>!n.read).length > 0 ? 'New' : ''} />
        <MenuItem icon={ShieldCheck} label="Privacy & Security" color="green" onClick={() => setActivePage('privacy')} />
        <MenuItem icon={CircleHelp} label="Help Center" color="teal" onClick={() => setActivePage('help')} />
        <MenuItem icon={Settings} label="Settings" color="gray" onClick={() => setActivePage('settings')} />
      </div>

      <div className="text-center mt-8 text-xs text-gray-700">
         AppVault v2.1.0 (Stable)
      </div>
    </div>
  );
};