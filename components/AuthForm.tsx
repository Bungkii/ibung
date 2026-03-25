"use client";
import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { Loader2, Camera, Mail, Lock, User as UserIcon } from "lucide-react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [passError, setPassError] = useState("");

  useEffect(() => {
    if (isLogin || !password) { setPassError(""); return; }
    if (password.length < 8) setPassError("รหัสผ่านต้อง 8 ตัวขึ้นไป");
    else if (!/[A-Z]/.test(password)) setPassError("ต้องมีตัวพิมพ์ใหญ่");
    else if (!/[0-9]/.test(password)) setPassError("ต้องมีตัวเลข");
    else setPassError("");
  }, [password, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        let photoURL = "https://via.placeholder.com/150";
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          const res = await fetch(`https://api.imgbb.com/1/upload?key=fd4168dbacd1e283e3e1158bfbb36028`, { method: "POST", body: formData });
          const imgData = await res.json();
          if (imgData.success) photoURL = imgData.data.url;
        }
        await updateProfile(userCred.user, { displayName: username, photoURL });
        await set(ref(db, `users/${userCred.user.uid}`), { uid: userCred.user.uid, displayName: username, photoURL, email });
      }
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0A0F0A]">
      <div className="w-full max-w-sm bg-white dark:bg-[#0D140D] rounded-[2.5rem] shadow-2xl border dark:border-green-900/20 overflow-hidden">
        <div className="flex bg-gray-50 dark:bg-black/20 p-2 m-4 rounded-2xl">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${isLogin ? 'bg-white dark:bg-green-900 shadow-sm text-green-600' : 'text-gray-400'}`}>เข้าสู่ระบบ</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${!isLogin ? 'bg-white dark:bg-green-900 shadow-sm text-green-600' : 'text-gray-400'}`}>สมัครสมาชิก</button>
        </div>
        <form onSubmit={handleAuth} className="p-8 pt-4 space-y-4">
          <h2 className="text-3xl font-bold text-center text-green-600 font-serif mb-8">ibung</h2>
          {!isLogin && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-green-900/30 border-2 border-dashed border-green-500 flex items-center justify-center overflow-hidden">
                  {file ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" /> : <Camera className="text-green-500" />}
                </div>
                <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
              <div className="w-full relative">
                <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="ชื่อผู้ใช้งาน" required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input type="email" placeholder="อีเมล" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input type="password" placeholder="รหัสผ่าน" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {!isLogin && passError && <p className="text-[10px] text-red-500 font-bold ml-1">{passError}</p>}
          <button disabled={loading || (!isLogin && !!passError)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก")}
          </button>
        </form>
      </div>
    </div>
  );
}