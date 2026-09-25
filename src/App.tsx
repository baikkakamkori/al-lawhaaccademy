import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, LayoutDashboard, Settings, LogOut, Menu, X, ChevronRight, 
  Calendar, MapPin, Phone, Mail, Award, Lock, Eye, CheckCircle, Shield, 
  Trash2, Facebook, Youtube, PlayCircle, Globe, Upload, FileCheck, Wallet, 
  ArrowDownRight, ArrowUpRight, Image as ImageIcon, FileText, AlertCircle, 
  Printer, Search, MessageCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

// --- YOUR FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyDIUI1krg2L8uqSEYu1Cu2Y_Lc0y6N6L6Q",
  authDomain: "al-lawhaaccademy.firebaseapp.com",
  projectId: "al-lawhaaccademy",
  storageBucket: "al-lawhaaccademy.firebasestorage.app",
  messagingSenderId: "856079592553",
  appId: "1:856079592553:web:321c5ee41f3525ea3bc6f8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'al-lawha-school-db';

const defaultSiteSettings = {
  schoolNameBanner: 'আল-লওহা ইসলামিক স্কুল',
  heroTitle: 'বিশ্বাস এবং জ্ঞানের সাথে ভবিষ্যৎ গড়ার প্রতিশ্রুতি',
  heroSubtitle: 'আল-লওহা ইসলামিক স্কুল চট্টগ্রাম ঐতিহ্যবাহী ইসলামী শিক্ষা এবং আধুনিক শিক্ষার একটি সুরেলা সংমিশ্রণ প্রদান করে।',
  email: 'info@allawha-ctg.edu.bd',
  phone: '+880 1616733447',
  address: 'নাসিরাবাদ, চট্টগ্রাম, বাংলাদেশ',
  facebook: 'https://facebook.com',
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  logoUrl: 'https://i.ibb.co.com/ynKzkTnX/1000188468-removebg-preview.png',
  googleScriptUrl: '',
  mapEmbedUrl: ''
};

const processImage = (file: any) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("No file selected");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: any) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let scaleSize = 800 / img.width;
        if (scaleSize > 1) scaleSize = 1; 
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [dashboardType, setDashboardType] = useState('sms'); 
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  const [usersDb, setUsersDb] = useState<any>({
    sms_admin: { username: 'sms_admin', password: 'password123', role: 'School Admin', name: 'প্রধান শিক্ষক' },
    cms_admin: { username: 'cms_admin', password: 'password123', role: 'Content Admin', name: 'আইটি অ্যাডমিন' }
  });

  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Firebase Error:", error));
    const unsubscribe = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    return () => unsubscribe();
  }, []);

  const handleLogin = (username: string, password: string, type: string) => {
    const user = usersDb[username];
    if (user && user.password === password) {
      if ((type === 'sms' && username === 'sms_admin') || (type === 'cms' && username === 'cms_admin')) {
        setLoggedInUser({ username, ...user, type });
        setDashboardType(type);
        setCurrentView('dashboard');
        return true;
      }
    }
    return false;
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentView('landing');
  };

  const handleChangePassword = (username: string, oldPassword: string, newPassword: string) => {
    if (usersDb[username].password === oldPassword) {
      setUsersDb({ ...usersDb, [username]: { ...usersDb[username], password: newPassword } });
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-tc, #printable-tc * { visibility: visible; }
          #printable-tc { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {currentView === 'landing' && (
        <LandingPage firebaseUser={firebaseUser} db={db} appId={appId} onNavigateToLogin={(type: string) => { setDashboardType(type); setCurrentView('login'); }} />
      )}
      {currentView === 'login' && (
        <LoginPage type={dashboardType} onLogin={handleLogin} onBack={() => setCurrentView('landing')} onSwitchType={(type: string) => setDashboardType(type)} />
      )}
      {currentView === 'dashboard' && loggedInUser && (
        <DashboardLayout user={loggedInUser} onLogout={handleLogout} onChangePassword={handleChangePassword}>
          {dashboardType === 'sms' ? 
            <SMSDashboard firebaseUser={firebaseUser} db={db} appId={appId} activeView="dashboard" /> : 
            <CMSDashboard firebaseUser={firebaseUser} db={db} appId={appId} activeView="dashboard" />
          }
        </DashboardLayout>
      )}
    </div>
  );
}

// --- LANDING PAGE ---
const LandingPage = ({ firebaseUser, db, appId, onNavigateToLogin }: any) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(() => {
    const saved = localStorage.getItem('alLawhaSettings');
    return saved ? JSON.parse(saved) : defaultSiteSettings;
  });

  useEffect(() => {
    if (!firebaseUser || !db) return;
    try {
      const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main_config'), (docSnap) => {
        if (docSnap.exists()) {
          const newData = { ...defaultSiteSettings, ...docSnap.data() };
          setSettings(newData);
          localStorage.setItem('alLawhaSettings', JSON.stringify(newData));
        }
        setIsLoading(false); 
      });
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'notices')), (snapshot) => {
        setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse());
      });
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery')), (snapshot) => {
        setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      setTimeout(() => setIsLoading(false), 2000);
      return () => unsubSettings();
    } catch(e) {
      setIsLoading(false);
    }
  }, [firebaseUser, db, appId]);

  const LogoDisplay = ({ className = "h-8 w-8" }) => (
    (settings.logoUrl || defaultSiteSettings.logoUrl) ? <img src={settings.logoUrl || defaultSiteSettings.logoUrl} alt="Logo" className={`${className} object-contain`} /> : <BookOpen className={`${className} text-emerald-800`} />
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-emerald-900 flex flex-col items-center justify-center z-[100] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="bg-white p-4 rounded-full shadow-2xl mb-6 flex items-center justify-center h-32 w-32 md:h-40 md:w-40 border-4 border-emerald-500/30 overflow-hidden relative">
            {(settings.logoUrl || defaultSiteSettings.logoUrl) ? (
              <img src={settings.logoUrl || defaultSiteSettings.logoUrl} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <BookOpen className="h-16 w-16 md:h-20 md:w-20 text-emerald-800" />
            )}
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-extrabold tracking-widest drop-shadow-lg text-center px-4">
            আল-লওহা ইসলামিক স্কুল
          </h2>
          <div className="mt-8 flex space-x-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-500">
      <nav className="bg-emerald-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full shadow-sm flex items-center justify-center overflow-hidden h-12 w-12"><LogoDisplay /></div>
              <div><h1 className="font-bold text-lg md:text-2xl tracking-tight">আল-লওহা</h1><p className="text-emerald-200 text-[10px] md:text-xs font-medium uppercase tracking-wider">ইসলামিক স্কুল চট্টগ্রাম</p></div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:text-emerald-200 font-medium transition-colors">হোম</a>
              <a href="#about" className="hover:text-emerald-200 font-medium transition-colors">সম্পর্কে</a>
              <a href="#notices" className="hover:text-emerald-200 font-medium transition-colors">নোটিশ</a>
              <a href="#gallery" className="hover:text-emerald-200 font-medium transition-colors">গ্যালারি</a>
              <div className="relative">
                <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm flex items-center transition-colors">লগইন পোর্টাল <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${showAdminMenu ? 'rotate-90' : ''}`} /></button>
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100 text-gray-800">
                    <button onClick={() => onNavigateToLogin('sms')} className="w-full text-left px-5 py-4 hover:bg-emerald-50 border-b border-gray-100 flex items-center group transition-colors"><LayoutDashboard className="h-5 w-5 mr-3 text-emerald-600 group-hover:scale-110 transition-transform" /> <span className="font-medium">স্কুল ম্যানেজমেন্ট</span></button>
                    <button onClick={() => onNavigateToLogin('cms')} className="w-full text-left px-5 py-4 hover:bg-blue-50 flex items-center group transition-colors"><Globe className="h-5 w-5 mr-3 text-blue-600 group-hover:scale-110 transition-transform" /> <span className="font-medium">ওয়েব ম্যানেজমেন্ট</span></button>
                  </div>
                )}
              </div>
            </div>
            <div className="md:hidden flex items-center"><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-emerald-700 transition-colors">{isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}</button></div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-emerald-800 border-t border-emerald-700 shadow-2xl z-40">
            <div className="px-4 pt-2 pb-6 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
              <a href="#" onClick={()=>setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-emerald-700 text-white">হোম</a>
              <a href="#about" onClick={()=>setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-emerald-700 text-white">সম্পর্কে</a>
              <a href="#notices" onClick={()=>setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-emerald-700 text-white">নোটিশ</a>
              <a href="#gallery" onClick={()=>setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium hover:bg-emerald-700 text-white">গ্যালারি</a>
              <div className="mt-6 pt-4 border-t border-emerald-700">
                <button onClick={() => { setIsMobileMenuOpen(false); onNavigateToLogin('sms'); }} className="w-full text-left px-4 py-3 mb-2 rounded-lg font-medium bg-emerald-700 text-white flex items-center"><LayoutDashboard className="h-5 w-5 mr-3 text-emerald-300" /> স্কুল ম্যানেজমেন্ট (SMS)</button>
                <button onClick={() => { setIsMobileMenuOpen(false); onNavigateToLogin('cms'); }} className="w-full text-left px-4 py-3 rounded-lg font-medium bg-emerald-900 border border-emerald-600 text-white flex items-center"><Globe className="h-5 w-5 mr-3 text-blue-300" /> ওয়েবসাইট ম্যানেজমেন্ট (CMS)</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-emerald-900 text-white flex flex-col justify-center min-h-[70vh] md:min-h-[80vh]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 to-transparent mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10 flex flex-col items-center text-center">
          <span className="bg-emerald-800 text-emerald-100 px-5 py-2 rounded-full text-sm font-bold mb-6 border border-emerald-600 shadow-sm inline-flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span> ভর্তি চলছে!</span>
          
          {/* 1. School Name (Largest Font) */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 max-w-4xl leading-tight drop-shadow-md text-emerald-300">
            {settings.schoolNameBanner || 'আল-লওহা ইসলামিক স্কুল'}
          </h1>
          
          {/* 2. Main Title (Medium Font) */}
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 max-w-4xl leading-tight drop-shadow-sm text-white">
            {settings.heroTitle}
          </h2>
          
          {/* 3. Short Description (Smallest Font) */}
          <p className="text-base md:text-lg text-emerald-100 max-w-2xl mb-10 leading-relaxed px-4">
            {settings.heroSubtitle}
          </p>
          
          <div className="flex justify-center w-full px-4 sm:px-0">
            <button onClick={() => setShowContactModal(true)} className="w-full sm:w-auto bg-white text-emerald-900 px-10 py-4 rounded-full font-extrabold text-xl hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:-translate-y-1 transform flex items-center justify-center">
              <Phone className="mr-3 text-emerald-600" size={24}/> ভর্তির জন্য যোগাযোগ
            </button>
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><BookOpen className="h-8 w-8 text-emerald-700" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">কুরআনিক স্টাডিজ</h3>
              <p className="text-gray-600 leading-relaxed">প্রত্যয়িত আলেমদের দ্বারা পরিচালিত হিফজ এবং তাজবীদ প্রোগ্রাম যা শিক্ষার্থীদের কুরআনের আলোয় আলোকিত করে।</p>
            </div>
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><Award className="h-8 w-8 text-emerald-700" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">আধুনিক কারিকুলাম</h3>
              <p className="text-gray-600 leading-relaxed">বিশ্বমানের চ্যালেঞ্জ মোকাবেলায় জাতীয় পাঠ্যক্রমের সাথে বিজ্ঞান, প্রযুক্তি ও সাধারণ শিক্ষার চমৎকার সমন্বয়।</p>
            </div>
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><Users className="h-8 w-8 text-emerald-700" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">চরিত্র গঠন (তারবিয়াহ)</h3>
              <p className="text-gray-600 leading-relaxed">দৃঢ় নৈতিক চরিত্র, শৃঙ্খলা, সময়ানুবর্তিতা এবং সমাজসেবা বিকাশের উপর বিশেষ জোর দেওয়া হয়।</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-gray-50 border-t border-gray-200" id="notices">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-6 border-b-2 border-emerald-500 pb-2 inline-flex"><FileText className="text-emerald-600 h-7 w-7" /><h2 className="text-2xl font-bold text-gray-800">নোটিশ বোর্ড</h2></div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 min-h-[400px] max-h-[500px] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {notices.length > 0 ? notices.map((notice) => (
                  <div key={notice.id} className="p-5 border-l-4 border-emerald-500 bg-gray-50 rounded-r-xl hover:bg-emerald-50 transition-all"><h4 className="font-bold text-gray-800 text-lg mb-1">{notice.title}</h4><p className="text-xs font-semibold text-emerald-600 mb-3 flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5"/> {notice.date}</p>{notice.content && <p className="text-gray-600 text-sm leading-relaxed mb-3">{notice.content}</p>}{notice.imageUrl && <img src={notice.imageUrl} alt="Notice" className="mt-2 rounded-lg max-h-40 w-auto object-cover border" />}</div>
                )) : <div className="flex flex-col items-center justify-center h-full text-gray-400"><FileText className="mb-4 opacity-20" size={48} /><p className="font-medium">বোর্ডে কোনো নতুন নোটিশ নেই।</p></div>}
              </div>
            </div>
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-6 border-b-2 border-emerald-500 pb-2 inline-flex"><PlayCircle className="text-emerald-600 h-7 w-7" /><h2 className="text-2xl font-bold text-gray-800">ক্যাম্পাস ওভারভিউ</h2></div>
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-black aspect-video relative flex-shrink-0 w-full">
              {settings.videoUrl ? <iframe className="absolute top-0 left-0 w-full h-full" src={settings.videoUrl} title="School Video" frameBorder="0" allowFullScreen></iframe> : <div className="flex items-center justify-center h-full text-gray-400 flex-col bg-gray-900"><Youtube className="mb-3 opacity-30" size={56} /><p className="font-medium">ভিডিও লিংক যুক্ত করা হয়নি</p></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-white" id="gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-gray-900">ফটো গ্যালারি</h2><div className="mt-4 h-1.5 w-24 bg-emerald-500 mx-auto rounded-full"></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {gallery.length > 0 ? gallery.map((img) => (
              <div key={img.id} className="relative group overflow-hidden rounded-2xl shadow-sm aspect-square bg-gray-100 border border-gray-200"><img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />{img.caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 translate-y-[110%] group-hover:translate-y-0 transition-transform"><p className="text-white text-sm font-medium">{img.caption}</p></div>}</div>
            )) : <div className="col-span-full text-center text-gray-400 py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300"><ImageIcon className="opacity-20 mb-4 mx-auto" size={56} /><p className="font-medium text-lg">গ্যালারিতে ছবি নেই।</p></div>}
          </div>
        </div>
      </div>

      {settings.mapEmbedUrl && (
        <div className="w-full h-80 md:h-96 border-t border-gray-200">
          <iframe src={settings.mapEmbedUrl} width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="School Map"></iframe>
        </div>
      )}

      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 mt-auto border-t-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6"><div className="bg-white p-2 rounded-xl flex h-12 w-12 items-center justify-center"><LogoDisplay/></div><h2 className="font-bold text-2xl text-white">আল-লওহা ইসলামিক স্কুল</h2></div>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">চট্টগ্রামের বুকে দ্বীনি শিক্ষা ও আধুনিক শিক্ষার এক অনন্য প্রতিষ্ঠান। আসুন, আপনার সন্তানের উজ্জ্বল ভবিষ্যত গড়ি।</p>
            <div className="flex space-x-4">{settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Facebook size={22} /></a>}</div>
          </div>
          <div><h3 className="text-white font-bold text-lg mb-6 flex items-center"><span className="w-8 h-1 bg-emerald-500 mr-3 rounded-full"></span> লিংক</h3><ul className="space-y-4"><li><a href="#about" className="text-gray-400 hover:text-emerald-400 flex items-center transition-colors"><ChevronRight className="mr-2" size={16} /> সম্পর্কে</a></li><li><a href="#notices" className="text-gray-400 hover:text-emerald-400 flex items-center transition-colors"><ChevronRight className="mr-2" size={16} /> নোটিশ</a></li><li><a href="#gallery" className="text-gray-400 hover:text-emerald-400 flex items-center transition-colors"><ChevronRight className="mr-2" size={16} /> গ্যালারি</a></li></ul></div>
          <div><h3 className="text-white font-bold text-lg mb-6 flex items-center"><span className="w-8 h-1 bg-emerald-500 mr-3 rounded-full"></span> যোগাযোগ</h3><ul className="space-y-5"><li className="flex items-start"><MapPin className="h-5 w-5 mr-3 text-emerald-500 mt-1"/> <span className="text-gray-400 leading-snug">{settings.address}</span></li><li className="flex items-center"><Phone className="h-5 w-5 mr-3 text-emerald-500"/> <span className="text-gray-400">{settings.phone}</span></li><li className="flex items-center"><Mail className="h-5 w-5 mr-3 text-emerald-500"/> <span className="text-gray-400 break-all">{settings.email}</span></li></ul></div>
        </div>
        
        {/* Footer Bottom with Developed By Credit */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-500 mb-4 md:mb-0">&copy; {new Date().getFullYear()} আল-লওহা ইসলামিক স্কুল চট্টগ্রাম। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-gray-400">
            Developed by <a href="https://amar-web.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold tracking-wider transition-all">amar web</a>
          </p>
        </div>
      </footer>

      {/* WHATSAPP CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative p-8 text-center animate-in fade-in zoom-in duration-200 border border-gray-100">
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-500 shadow-inner">
               <Phone size={36} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">ভর্তির জন্য যোগাযোগ</h3>
            <p className="text-gray-600 mb-8 font-medium">ভর্তির জন্য এই WhatsApp নম্বর এ যোগাযোগ করুন</p>
            
            <a href="https://wa.me/8801616733447" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-extrabold py-4 px-8 rounded-2xl hover:bg-[#128C7E] w-full shadow-[0_10px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_10px_25px_rgba(37,211,102,0.5)] flex items-center justify-center text-xl transition-all transform hover:-translate-y-1">
              <MessageCircle className="mr-3" size={28} /> 01616733447
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginPage = ({ type, onLogin, onBack, onSwitchType }: any) => {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState('');
  const handleSubmit = (e: any) => { e.preventDefault(); if (!onLogin(username, password, type)) setError('ভুল ইউজারনেম বা পাসওয়ার্ড।'); };
  const isSMS = type === 'sms'; const themeColor = isSMS ? 'emerald' : 'blue';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-900 flex items-center text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 transition-all hover:shadow"><ChevronRight className="h-4 w-4 rotate-180 mr-1"/> মূল সাইটে ফিরে যান</button>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className={`bg-${themeColor}-800 px-6 py-10 text-center text-white relative overflow-hidden`}><div className="absolute -top-10 -right-10 opacity-10">{isSMS ? <Shield size={120} /> : <Globe size={120} />}</div><div className="mx-auto bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center mb-5 relative z-10 shadow-xl"><Lock className={`h-10 w-10 text-${themeColor}-700`} /></div><h2 className="text-3xl font-extrabold relative z-10 tracking-tight">লগইন পোর্টাল</h2><p className="text-sm mt-3 font-medium opacity-90 relative z-10 bg-white/20 inline-block px-4 py-1.5 rounded-full">{isSMS ? 'স্কুল ম্যানেজমেন্ট (SMS)' : 'ওয়েবসাইট ম্যানেজমেন্ট (CMS)'}</p></div>
          <div className="p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 font-medium">{error}</div>}
              <div><label className="block text-sm font-bold text-gray-700 mb-2">ইউজারনেম</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 outline-none`} placeholder="আপনার ইউজারনেম" required /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">পাসওয়ার্ড</label><div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 outline-none pr-12`} placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={20} /></button></div></div>
              <button type="submit" className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-bold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all mt-2`}>প্রবেশ করুন</button>
            </form>
          </div>
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 text-center"><button onClick={() => onSwitchType(isSMS ? 'cms' : 'sms')} className={`text-sm text-${themeColor}-700 font-bold hover:underline flex items-center justify-center w-full`}>{isSMS ? <Globe className="mr-2" size={16} /> : <LayoutDashboard className="mr-2" size={16} />}{isSMS ? 'ওয়েবসাইট ম্যানেজমেন্টে (CMS) যান' : 'স্কুল ম্যানেজমেন্টে (SMS) যান'}</button></div>
        </div>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ user, onClose, onChangePassword, themeColor }: any) => {
  const [oldPass, setOldPass] = useState(''); const [newPass, setNewPass] = useState(''); const [confirmPass, setConfirmPass] = useState(''); const [status, setStatus] = useState({ type: '', message: '' });
  const handleSubmit = (e: any) => { e.preventDefault(); if (newPass !== confirmPass) return setStatus({ type: 'error', message: 'পাসওয়ার্ড মিলছে না!' }); if (onChangePassword(user.username, oldPass, newPass)) { setStatus({ type: 'success', message: 'সফলভাবে পরিবর্তন করা হয়েছে!' }); setTimeout(onClose, 2000); } else { setStatus({ type: 'error', message: 'বর্তমান পাসওয়ার্ড ভুল!' }); } };
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <div className={`bg-${themeColor}-50 px-6 py-4 border-b border-${themeColor}-100 flex items-center`}><Lock className={`text-${themeColor}-600 mr-2`} size={20} /><h3 className={`font-bold text-${themeColor}-900`}>পাসওয়ার্ড পরিবর্তন</h3></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status.message && <div className={`p-3 rounded-lg text-sm font-bold ${status.type==='error'?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>{status.message}</div>}
          <div><label className="block text-sm font-bold mb-1">বর্তমান পাসওয়ার্ড</label><input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:ring-2" required /></div>
          <div><label className="block text-sm font-bold mb-1">নতুন পাসওয়ার্ড</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:ring-2" required /></div>
          <div><label className="block text-sm font-bold mb-1">নিশ্চিত করুন</label><input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:ring-2" required /></div>
          <div className="flex justify-end pt-2"><button type="submit" className={`bg-${themeColor}-600 text-white px-6 py-2 rounded-lg font-bold`}>সেভ করুন</button></div>
        </form>
      </div>
    </div>
  );
};

const DashboardLayout = ({ user, onLogout, onChangePassword, children }: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showProfileMenu, setShowProfileMenu] = useState(false); 
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const isSMS = user.type === 'sms'; 
  const themeColor = isSMS ? 'emerald' : 'blue';
  
  const handleSidebarNav = (tab: string) => { setActiveTab(tab); setIsSidebarOpen(false); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-72 bg-${themeColor}-900 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300`}>
        <div className={`p-6 flex items-center justify-between border-b border-${themeColor}-800/50 bg-${themeColor}-950/30`}><div className="flex items-center space-x-3"><div className={`bg-${themeColor}-800 p-2 rounded-lg`}><BookOpen className={`h-6 w-6 text-${themeColor}-300`} /></div><div><h1 className="font-bold text-xl leading-tight">আল-লওহা</h1><p className={`text-${themeColor}-300 text-[11px] font-medium uppercase tracking-widest`}>{isSMS ? 'স্কুল ম্যানেজমেন্ট' : 'ওয়েব ম্যানেজমেন্ট'}</p></div></div><button className="lg:hidden text-gray-300 p-1" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button></div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"><p className="px-4 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">মেন্যু</p>
          {isSMS ? (
            <>
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="ড্যাশবোর্ড ওভারভিউ" active={activeTab==='dashboard'} onClick={()=>handleSidebarNav('dashboard')} color={themeColor} />
              <SidebarItem icon={<Users size={20}/>} label="শিক্ষার্থীর তালিকা" active={activeTab==='students'} onClick={()=>handleSidebarNav('students')} color={themeColor} />
              <SidebarItem icon={<Wallet size={20}/>} label="অ্যাকাউন্টস ও ফিন্যান্স" active={activeTab==='finance'} onClick={()=>handleSidebarNav('finance')} color={themeColor} />
              <SidebarItem icon={<Printer size={20}/>} label="সার্টিফিকেট ও টিসি" active={activeTab==='certificate'} onClick={()=>handleSidebarNav('certificate')} color={themeColor} />
            </>
          ) : (
            <>
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="ড্যাশবোর্ড ওভারভিউ" active={activeTab==='dashboard'} onClick={()=>handleSidebarNav('dashboard')} color={themeColor} />
              <SidebarItem icon={<Settings size={20}/>} label="ওয়েব সেটিংস ও লোগো" active={activeTab==='settings'} onClick={()=>handleSidebarNav('settings')} color={themeColor} />
              <SidebarItem icon={<FileText size={20}/>} label="নোটিশ বোর্ড" active={activeTab==='notices'} onClick={()=>handleSidebarNav('notices')} color={themeColor} />
              <SidebarItem icon={<ImageIcon size={20}/>} label="গ্যালারি" active={activeTab==='gallery'} onClick={()=>handleSidebarNav('gallery')} color={themeColor} />
            </>
          )}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className="no-print bg-white h-20 shadow-sm flex items-center justify-between px-4 sm:px-8 z-10 border-b border-gray-100">
          <div className="flex items-center"><button className="text-gray-500 hover:text-gray-900 lg:hidden mr-4 p-2 bg-gray-50 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button><h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight">{isSMS ? 'স্কুল অ্যাডমিন প্যানেল' : 'ওয়েবসাইট অ্যাডমিন (CMS)'}</h2></div>
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-full pr-4 transition-colors"><div className={`h-10 w-10 rounded-full bg-${themeColor}-600 flex items-center justify-center text-white font-bold shadow-sm`}>{user.name.charAt(0)}</div><div className="hidden sm:block text-left"><p className="font-bold text-gray-800 leading-tight text-sm">{user.name}</p><p className={`text-${themeColor}-600 text-xs font-medium`}>{user.role}</p></div></button>
            {showProfileMenu && (<div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50"><button onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }} className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full text-left"><Lock className="mr-3 text-gray-400" size={16} /> পাসওয়ার্ড পরিবর্তন</button><div className="border-t border-gray-100 my-1"></div><button onClick={onLogout} className="flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 w-full text-left"><LogOut className="mr-3" size={16} /> লগআউট করুন</button></div>)}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 relative">
          {React.cloneElement(children, { activeView: activeTab })}
        </div>
      </main>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} user={user} onChangePassword={onChangePassword} themeColor={themeColor} />}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, color, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${active ? `bg-${color}-800 text-white shadow-md font-bold` : `text-${color}-100 hover:bg-${color}-800/50 hover:text-white font-medium`}`}>{icon} <span>{label}</span></button>
);

const CertificateDashboard = ({ db, appId }: any) => {
  const [searchId, setSearchId] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [printType, setPrintType] = useState('tc'); 

  useEffect(() => {
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main_config'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().googleScriptUrl) {
        setScriptUrl(docSnap.data().googleScriptUrl);
      }
    });
  }, [db, appId]);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!scriptUrl) {
      setErrorMsg('ওয়েব সেটিংস থেকে "Google Script (TC) লিংক" সেট করা নেই!');
      return;
    }
    setLoading(true); setErrorMsg(''); setStudentData(null);
    try {
      const response = await fetch(`${scriptUrl}?id=${searchId}`);
      const data = await response.json();
      if (data.error) setErrorMsg(data.error);
      else setStudentData(data);
    } catch (err) {
      setErrorMsg('ডাটাবেস (Google Sheet) এর সাথে কানেক্ট করা যাচ্ছে না। লিংক চেক করুন।');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><Printer className="mr-3 text-emerald-600"/> সার্টিফিকেট ও টিসি তৈরি করুন</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
          <input type="text" placeholder="স্টুডেন্ট আইডি (ID) লিখুন..." value={searchId} onChange={e=>setSearchId(e.target.value)} className="flex-1 border border-gray-300 p-3.5 rounded-xl focus:ring-2 outline-none font-bold text-lg" required/>
          <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-70">
            {loading ? 'খোঁজা হচ্ছে...' : <><Search className="mr-2" size={20}/> সার্চ করুন</>}
          </button>
        </form>
        {errorMsg && <p className="text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">{errorMsg}</p>}
      </div>

      {studentData && (
        <>
          <div className="no-print flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex space-x-2">
              <button onClick={() => setPrintType('tc')} className={`px-6 py-2 rounded-lg font-bold transition-all ${printType === 'tc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>TC টেমপ্লেট</button>
              <button onClick={() => setPrintType('result')} className={`px-6 py-2 rounded-lg font-bold transition-all ${printType === 'result' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>মার্কশিট (Result)</button>
            </div>
            <button onClick={() => window.print()} className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 rounded-xl font-bold flex items-center shadow-lg transform hover:-translate-y-0.5 transition-all"><Printer className="mr-2" size={20}/> প্রিন্ট করুন</button>
          </div>

          <div id="printable-tc" className="bg-white p-12 border-8 border-double border-gray-900 mx-auto max-w-4xl relative overflow-hidden shadow-2xl min-h-[800px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"><BookOpen size={400} /></div>
            
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-6 relative z-10">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">আল-লওহা ইসলামিক স্কুল</h1>
              <p className="text-gray-600 font-medium">নাসিরাবাদ, চট্টগ্রাম, বাংলাদেশ</p>
              <div className={`inline-block text-white font-bold px-8 py-2 rounded-full mt-6 text-xl tracking-widest border-2 outline outline-2 outline-offset-2 ${printType === 'tc' ? 'bg-emerald-800 border-emerald-900 outline-emerald-800' : 'bg-blue-800 border-blue-900 outline-blue-800'}`}>
                {printType === 'tc' ? 'TRANSFER CERTIFICATE (TC)' : 'ACADEMIC MARK SHEET'}
              </div>
            </div>

            {printType === 'tc' ? (
              <div className="space-y-8 text-xl relative z-10 leading-loose text-justify mt-12">
                <p>This is to certify that <span className="font-bold border-b-2 border-dotted border-gray-800 px-4 text-emerald-900">{studentData.Name || studentData.name || '---'}</span>, Student ID: <span className="font-bold border-b-2 border-dotted border-gray-800 px-4">{studentData.ID || studentData.id || searchId}</span>, son/daughter of <span className="font-bold border-b-2 border-dotted border-gray-800 px-4">{studentData.FatherName || studentData.fatherName || '---'}</span> and <span className="font-bold border-b-2 border-dotted border-gray-800 px-4">{studentData.MotherName || studentData.motherName || '---'}</span> was a student of this institution in Class <span className="font-bold border-b-2 border-dotted border-gray-800 px-4">{studentData.Class || studentData.class || '---'}</span>.</p>
                <p>According to the school register, his/her date of birth is <span className="font-bold border-b-2 border-dotted border-gray-800 px-4">{studentData.DOB || studentData.dob || '---'}</span>. To the best of my knowledge, he/she bears a good moral character.</p>
                <p className="font-bold text-center text-2xl mt-12 text-emerald-800 italic">I wish him/her every success in life.</p>
              </div>
            ) : (
              <div className="relative z-10 mt-8">
                <div className="grid grid-cols-2 gap-6 mb-8 text-lg bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <div><span className="font-bold text-gray-700">Student Name:</span> {studentData.Name || studentData.name || '---'}</div>
                  <div><span className="font-bold text-gray-700">Student ID:</span> {studentData.ID || studentData.id || searchId}</div>
                  <div><span className="font-bold text-gray-700">Class:</span> {studentData.Class || studentData.class || '---'}</div>
                  <div><span className="font-bold text-gray-700">Date of Birth:</span> {studentData.DOB || studentData.dob || '---'}</div>
                </div>
                <div className="text-center bg-gray-100 p-8 rounded-2xl border-2 border-gray-200">
                  <p className="text-gray-500 font-bold mb-2 uppercase tracking-widest">Final Result Status</p>
                  <h2 className="text-5xl font-extrabold text-blue-900">{studentData.Result || studentData.result || 'PASSED'}</h2>
                  {studentData.GPA && <p className="mt-4 text-2xl font-bold text-gray-700">GPA: {studentData.GPA}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-32 pt-8 relative z-10">
              <div className="text-center"><div className="w-48 border-t-2 border-gray-800 mb-2"></div><p className="font-bold text-gray-700">Prepared By</p></div>
              <div className="text-center"><div className="w-48 border-t-2 border-gray-800 mb-2"></div><p className="font-bold text-gray-700">Headmaster / Principal</p></div>
            </div>
            <div className="text-center mt-12 text-sm text-gray-500 font-bold">Date of Issue: {new Date().toLocaleDateString()}</div>
          </div>
        </>
      )}
    </div>
  );
}

const SMSDashboard = ({ firebaseUser, db, appId, activeView }: any) => {
  const [students, setStudents] = useState<any[]>([]); 
  const [finances, setFinances] = useState<any[]>([]);
  const [name, setName] = useState(''); const [grade, setGrade] = useState('ক্লাস ১');
  const [finType, setFinType] = useState('Income'); const [finCategory, setFinCategory] = useState('ছাত্রীদের বেতন (Fees)'); const [finTitle, setFinTitle] = useState(''); const [finAmount, setFinAmount] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  useEffect(() => {
    if (!firebaseUser || !db) return;
    try {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'finances'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()));
    } catch(e){}
  }, [firebaseUser, db, appId]);

  const showMsg = (msg: string) => { setNoticeMsg(msg); setTimeout(() => setNoticeMsg(''), 3000); };
  const handleAddStudent = async (e: any) => { e.preventDefault(); if (!firebaseUser || !name) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, grade, date: new Date().toLocaleDateString('bn-BD') }); setName(''); showMsg('নতুন শিক্ষার্থী যুক্ত হয়েছে!'); };
  const handleAddFinance = async (e: any) => { e.preventDefault(); if (!firebaseUser || !finTitle || !finAmount) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'finances'), { type: finType, category: finCategory, title: finTitle, amount: parseFloat(finAmount), date: new Date().toLocaleDateString('bn-BD') }); setFinTitle(''); setFinAmount(''); showMsg('হিসাব যুক্ত হয়েছে!'); };

  if (activeView === 'certificate') return <CertificateDashboard db={db} appId={appId} />;

  if (activeView === 'students') return (
    <div className="max-w-6xl mx-auto space-y-6">
      {noticeMsg && <div className="bg-green-100 text-green-700 p-4 rounded-xl font-bold">{noticeMsg}</div>}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"><h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><Users className="mr-3 text-emerald-600"/> ম্যানুয়াল এন্ট্রি (ঐচ্ছিক)</h2><form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-4"><input type="text" placeholder="নাম..." value={name} onChange={e=>setName(e.target.value)} className="flex-1 border border-gray-300 p-3.5 rounded-xl focus:ring-2 outline-none" required/><select value={grade} onChange={e=>setGrade(e.target.value)} className="w-full sm:w-48 border border-gray-300 p-3.5 rounded-xl focus:ring-2 outline-none bg-white"><option>প্লে</option><option>নার্সারি</option><option>ক্লাস ১</option><option>ক্লাস ২</option><option>হিফজ সেকশন</option></select><button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all sm:w-auto w-full">যুক্ত করুন</button></form></div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-6 md:p-8 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-xl text-gray-800">শিক্ষার্থীর তালিকা</h3><span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">{students.length} জন</span></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white text-gray-500 text-sm uppercase tracking-wider"><tr className="border-b"><th className="p-4 px-6 font-semibold">নাম</th><th className="p-4 px-6 font-semibold">শ্রেণী</th><th className="p-4 px-6 font-semibold">তারিখ</th><th className="p-4 px-6 text-right">অ্যাকশন</th></tr></thead><tbody className="divide-y divide-gray-100">{students.map(s => (<tr key={s.id} className="hover:bg-gray-50"><td className="p-4 px-6 font-bold text-gray-800">{s.name}</td><td className="p-4 px-6 text-gray-600">{s.grade}</td><td className="p-4 px-6 text-gray-500">{s.date}</td><td className="p-4 px-6 text-right"><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div></div>
    </div>
  );

  if (activeView === 'finance') {
    const totalIncome = finances.filter(f=>f.type==='Income').reduce((sum, curr)=>sum+curr.amount, 0); 
    const totalExpense = finances.filter(f=>f.type==='Expense').reduce((sum, curr)=>sum+curr.amount, 0); 
    const netBalance = totalIncome - totalExpense;
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {noticeMsg && <div className="bg-green-100 text-green-700 p-4 rounded-xl font-bold">{noticeMsg}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-500 font-bold text-sm mb-1 flex items-center"><ArrowDownRight className="text-green-500 mr-1" size={16}/> আয়</p><h3 className="text-3xl font-extrabold text-green-600">৳{totalIncome}</h3></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-500 font-bold text-sm mb-1 flex items-center"><ArrowUpRight className="text-red-500 mr-1" size={16}/> ব্যয়</p><h3 className="text-3xl font-extrabold text-red-600">৳{totalExpense}</h3></div><div className="bg-emerald-600 p-6 rounded-2xl shadow-sm border border-emerald-500 text-white"><p className="text-emerald-100 font-bold text-sm mb-1 flex items-center"><Wallet className="mr-1" size={16}/> ব্যালেন্স</p><h3 className="text-3xl font-extrabold">৳{netBalance}</h3></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"><h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">নতুন হিসাব</h2><form onSubmit={handleAddFinance} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">ধরন</label><select value={finType} onChange={(e)=>{setFinType(e.target.value); setFinCategory(e.target.value==='Income'?'ছাত্রীদের বেতন (Fees)':'শিক্ষক ও স্টাফদের বেতন');}} className="w-full border p-3 rounded-xl focus:ring-2 outline-none font-bold bg-white"><option value="Income">আয়</option><option value="Expense">ব্যয়</option></select></div><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">ক্যাটাগরি</label><select value={finCategory} onChange={e=>setFinCategory(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 outline-none font-bold bg-white">{finType === 'Income' ? (<><option>ছাত্রীদের বেতন (Fees)</option><option>ভর্তি ফি</option><option>অন্যান্য আয়</option></>) : (<><option>শিক্ষক ও স্টাফদের বেতন</option><option>ইউটিলিটি বিল</option><option>অফিস খরচ</option></>)}</select></div><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">পরিমাণ</label><input type="number" value={finAmount} onChange={e=>setFinAmount(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 outline-none font-bold" required/></div><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">বিবরণ</label><input type="text" value={finTitle} onChange={e=>setFinTitle(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium" required/></div><div className="md:col-span-1 flex items-end"><button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold h-[46px]">যোগ করুন</button></div></form></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-6 border-b bg-gray-50"><h3 className="font-bold text-xl text-gray-800">সাম্প্রতিক লেনদেন</h3></div><table className="w-full text-left"><thead className="bg-white text-gray-500 text-sm uppercase"><tr className="border-b"><th className="p-4 px-6 font-semibold">বিবরণ</th><th className="p-4 px-6 font-semibold">ক্যাটাগরি</th><th className="p-4 px-6 font-semibold">পরিমাণ</th><th className="p-4 px-6 text-right">অ্যাকশন</th></tr></thead><tbody className="divide-y divide-gray-100">{finances.map(f => (<tr key={f.id} className="hover:bg-gray-50"><td className="p-4 px-6 font-bold text-gray-800">{f.title}<br/><span className="text-xs text-gray-400 font-normal">{f.date}</span></td><td className="p-4 px-6 text-sm text-gray-600 font-medium">{f.category}</td><td className={`p-4 px-6 font-extrabold ${f.type==='Income'?'text-green-600':'text-red-600'}`}>{f.type==='Income'?'+':'-'}৳{f.amount}</td><td className="p-4 px-6 text-right"><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'finances', f.id))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 flex items-center space-x-6"><div className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30"><Users size={32} /></div><div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">মোট শিক্ষার্থী</p><h3 className="text-4xl font-extrabold text-gray-800">{students.length}</h3></div></div>
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 flex items-center space-x-6"><div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/30"><Wallet size={32} /></div><div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">মোট ফান্ড</p><h3 className="text-4xl font-extrabold text-gray-800">{finances.length}</h3></div></div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-sm border border-emerald-100 p-10 relative overflow-hidden">
        <h3 className="text-2xl font-bold mb-3 text-emerald-900">স্বাগতম, স্কুল অ্যাডমিন!</h3>
        <p className="text-gray-600 max-w-lg text-lg">বাম পাশের মেন্যু থেকে শিক্ষার্থী পরিচালনা, ফিন্যান্স ম্যানেজ এবং <b>গুগল শিট থেকে টিসি ও রেজাল্ট প্রিন্ট</b> করতে পারবেন।</p>
      </div>
    </div>
  );
};

const CMSDashboard = ({ firebaseUser, db, appId, activeView }: any) => {
  const [settings, setSettings] = useState(defaultSiteSettings); 
  const [notices, setNotices] = useState<any[]>([]); const [gallery, setGallery] = useState<any[]>([]);
  const [noticeTitle, setNoticeTitle] = useState(''); const [noticeContent, setNoticeContent] = useState(''); const [noticeImgBase64, setNoticeImgBase64] = useState('');
  const [galImgBase64, setGalImgBase64] = useState(''); const [imgCaption, setImgCaption] = useState(''); const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (!firebaseUser || !db) return;
    try {
      onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main_config'), (docSnap) => { if (docSnap.exists()) setSettings({ ...defaultSiteSettings, ...docSnap.data() } as any); });
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notices'), (snapshot) => { setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse()); });
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), (snapshot) => { setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    } catch(e){}
  }, [firebaseUser, db, appId]);

  const handleLogoUpload = async (e: any) => { try { setSettings({ ...settings, logoUrl: await processImage(e.target.files[0]) as string }); } catch (err) { alert('ছবি আপলোডে সমস্যা হয়েছে।'); } };
  const handleNoticeImgUpload = async (e: any) => { try { setNoticeImgBase64(await processImage(e.target.files[0]) as string); } catch (err) {} };
  const handleGalleryImgUpload = async (e: any) => { try { setGalImgBase64(await processImage(e.target.files[0]) as string); } catch (err) {} };

  const handleSaveSettings = async (e: any) => { e.preventDefault(); setSaveStatus('সংরক্ষণ করা হচ্ছে...'); try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'main_config'), settings, { merge: true }); setSaveStatus('সফলভাবে সংরক্ষিত হয়েছে!'); setTimeout(() => setSaveStatus(''), 3000); } catch (error) { setSaveStatus('ত্রুটি হয়েছে!'); } };
  const handleAddNotice = async (e: any) => { e.preventDefault(); if (!noticeTitle) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notices'), { title: noticeTitle, content: noticeContent, imageUrl: noticeImgBase64, date: new Date().toLocaleDateString('bn-BD') }); setNoticeTitle(''); setNoticeContent(''); setNoticeImgBase64(''); };
  const handleAddGallery = async (e: any) => { e.preventDefault(); if (!galImgBase64) return alert("দয়া করে একটি ছবি সিলেক্ট করুন।"); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), { url: galImgBase64, caption: imgCaption }); setGalImgBase64(''); setImgCaption(''); };

  if (activeView === 'settings') return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4 flex items-center"><Settings className="mr-3 text-blue-600"/> ওয়েবসাইট সেটিংস ও লিংক</h2>
      {saveStatus && <div className={`mb-6 p-4 rounded-xl font-bold flex items-center ${saveStatus.includes('সফল') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}><CheckCircle className="mr-2" size={20} /> {saveStatus}</div>}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
          <div className="h-24 w-24 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center overflow-hidden">
            {(settings.logoUrl || defaultSiteSettings.logoUrl) ? <img src={settings.logoUrl || defaultSiteSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <BookOpen className="text-gray-300 h-10 w-10"/>}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-gray-800 mb-2">স্কুলের লোগো পরিবর্তন করুন</h3>
            <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-bold inline-flex items-center transition-colors">
              <Upload className="mr-2" size={16} /> ছবি সিলেক্ট করুন
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 pt-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">ইমেইল ঠিকানা</label><input type="email" value={settings.email} onChange={e=>setSettings({...settings, email: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="block text-sm font-bold text-gray-700 mb-2">ফোন নম্বর</label><input type="text" value={settings.phone} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
        <div><label className="block text-sm font-bold text-gray-700 mb-2">স্কুলের ঠিকানা</label><input type="text" value={settings.address} onChange={e=>setSettings({...settings, address: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="grid md:grid-cols-2 gap-6"><div><label className="block text-sm font-bold text-gray-700 mb-2">ফেসবুক পেজ লিংক</label><input type="url" value={settings.facebook} onChange={e=>setSettings({...settings, facebook: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="block text-sm font-bold text-gray-700 mb-2">হোমপেজ ভিডিও</label><input type="url" value={settings.videoUrl} onChange={e=>setSettings({...settings, videoUrl: e.target.value})} placeholder="https://www.youtube.com/embed/..." className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
        
        <div className="border-t border-gray-200 pt-8 mt-4">
          <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center"><FileCheck className="mr-2 text-blue-500"/> এক্সটার্নাল লিংক (Google Form & Sheet)</h3>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><label className="block text-sm font-bold text-blue-900 mb-2">Google Script (TC) লিংক</label><input type="url" value={settings.googleScriptUrl || ''} onChange={e=>setSettings({...settings, googleScriptUrl: e.target.value})} className="w-full border border-blue-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://script.google.com/macros/s/.../exec" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">গুগোল ম্যাপ এম্বেড লিংক</label><input type="url" value={settings.mapEmbedUrl || ''} onChange={e=>setSettings({...settings, mapEmbedUrl: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://www.google.com/maps/embed?pb=..." /></div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 mt-4">
          <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center"><BookOpen className="mr-2 text-blue-500"/> হোমপেজ ব্যানার কনটেন্ট</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">স্কুলের নাম (বড় হেডিং)</label>
              <input type="text" value={settings.schoolNameBanner || 'আল-লওহা ইসলামিক স্কুল'} onChange={e=>setSettings({...settings, schoolNameBanner: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">প্রধান শিরোনাম</label>
              <input type="text" value={settings.heroTitle} onChange={e=>setSettings({...settings, heroTitle: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ছোট বর্ণনা</label>
              <textarea value={settings.heroSubtitle} onChange={e=>setSettings({...settings, heroSubtitle: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
            </div>
          </div>
        </div>

        <div className="pt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1">পরিবর্তন সেভ করুন</button></div>
      </form>
    </div>
  );

  if (activeView === 'notices') return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4 flex items-center"><FileText className="mr-3 text-blue-600"/> নোটিশ বোর্ড ম্যানেজমেন্ট</h2>
      <form onSubmit={handleAddNotice} className="bg-blue-50/50 p-6 rounded-2xl mb-10 border border-blue-100 shadow-sm"><h3 className="font-bold text-blue-900 mb-4">নতুন নোটিশ তৈরি করুন</h3><input type="text" placeholder="নোটিশের শিরোনাম..." value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} className="w-full mb-4 border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" required/><textarea placeholder="বিস্তারিত নোটিশ..." value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} className="w-full mb-4 border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows={3}></textarea><div className="mb-6"><label className="block text-sm font-bold text-gray-700 mb-2">নোটিশের ছবি (ঐচ্ছিক)</label><div className="flex items-center gap-4"><label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-bold inline-flex items-center transition-colors"><Upload className="mr-2" size={16} /> ফাইল সিলেক্ট করুন<input type="file" accept="image/*" onChange={handleNoticeImgUpload} className="hidden" /></label>{noticeImgBase64 && <span className="text-sm font-bold text-green-600 flex items-center"><CheckCircle className="mr-1" size={16} /> ছবি লোড হয়েছে</span>}</div></div><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all">পাবলিশ করুন</button></form>
      <div><h3 className="font-bold text-xl text-gray-800 mb-6">প্রকাশিত নোটিশসমূহ</h3><div className="space-y-4">{notices.map(n => (<div key={n.id} className="flex justify-between items-start p-5 border rounded-xl bg-white gap-4"><div className="flex-1"><h4 className="font-bold text-gray-800 text-lg mb-1">{n.title}</h4><p className="text-sm font-medium text-blue-600 mb-2">{n.date}</p>{n.content && <p className="text-gray-600 text-sm mb-3">{n.content}</p>}{n.imageUrl && <img src={n.imageUrl} alt="Attached" className="h-20 w-auto rounded border object-cover"/>}</div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notices', n.id))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={20} /></button></div>))}</div></div>
    </div>
  );

  if (activeView === 'gallery') return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4 flex items-center"><ImageIcon className="mr-3 text-blue-600"/> গ্যালারি ম্যানেজমেন্ট</h2>
      <form onSubmit={handleAddGallery} className="bg-blue-50/50 p-6 rounded-2xl mb-10 border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 w-full"><label className="block text-sm font-bold text-gray-700 mb-2">ডিভাইস থেকে ছবি বেছে নিন</label><div className="flex items-center gap-4 border border-gray-300 bg-white p-2 rounded-xl"><label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-bold flex-shrink-0 transition-colors"><Upload className="inline mr-2 -mt-1" size={16} /> ব্রাউজ করুন<input type="file" accept="image/*" onChange={handleGalleryImgUpload} className="hidden" /></label><span className="text-sm text-gray-500 truncate">{galImgBase64 ? '✔ একটি ছবি প্রস্তুত করা হয়েছে' : 'কোনো ফাইল সিলেক্ট করা হয়নি'}</span></div></div><div className="flex-1 w-full"><label className="block text-sm font-bold text-gray-700 mb-2">ক্যাপশন (ঐচ্ছিক)</label><input type="text" placeholder="ছবির সম্পর্কে কিছু লিখুন..." value={imgCaption} onChange={e=>setImgCaption(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div><button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md h-[52px]">গ্যালারিতে যুক্ত করুন</button></form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{gallery.map(img => (<div key={img.id} className="relative group border border-gray-200 rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm"><img src={img.url} alt="Gallery" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', img.id))} className="bg-red-600 text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg"><Trash2 size={24} /></button></div>{img.caption && <div className="absolute bottom-0 w-full bg-black/70 text-white text-xs p-2 truncate text-center">{img.caption}</div>}</div>))}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"><Globe className="h-16 w-16 text-blue-500 mb-4 bg-blue-50 p-3 rounded-2xl"/><h3 className="font-bold text-xl text-gray-800">ওয়েব সেটিংস</h3></div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"><FileText className="h-16 w-16 text-emerald-500 mb-4 bg-emerald-50 p-3 rounded-2xl"/><h3 className="font-bold text-xl text-gray-800">মোট নোটিশ: {notices.length}</h3></div>
      </div>
    </div>
  );
};
