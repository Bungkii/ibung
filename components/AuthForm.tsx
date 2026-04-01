"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail // 🎯 นำเข้าฟังก์ชันรีเซ็ตรหัสผ่าน
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false); // 🎯 State สำหรับโหมดลืมรหัสผ่าน
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // 🎯 State สำหรับข้อความสำเร็จ

  const checkAndSaveUser = async (user: any) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || "User",
        email: user.email || "",
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=random`,
        timestamp: Date.now()
      });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkAndSaveUser(result.user);
      router.push("/chat");
    } catch (err: any) {
      setError("ยกเลิกการเข้าสู่ระบบด้วย Google");
    } finally {
      setLoading(false);
    }
  };

  // 🎯 ฟังก์ชันส่งอีเมลรีเซ็ตรหัสผ่าน
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("กรุณากรอกอีเมลของคุณ");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว (โปรดเช็คในจดหมายขยะ/Spam ด้วยนะครับ)");
    } catch (err: any) {
      setError("ไม่พบอีเมลนี้ในระบบ หรือเกิดข้อผิดพลาดครับ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) throw new Error("กรุณากรอกชื่อแสดงผล");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, `users/${userCredential.user.uid}`), {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
          photoURL: `https://ui-avatars.com/api/?name=${name}&background=random`,
          timestamp: Date.now()
        });
      }
      router.push("/chat");
    } catch (err: any) {
      setError(err.message.includes("auth/") ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 ถ้าอยู่ในโหมดลืมรหัสผ่าน ให้แสดง UI นี้
  if (isResetMode) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-2xl border dark:border-green-900/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">ibung</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">รีเซ็ตรหัสผ่านของคุณ</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-medium animate-pulse">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm text-center font-medium">{successMsg}</div>}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input type="email" placeholder="กรอกอีเมลที่ใช้สมัคร" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-400 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/30">
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          <button onClick={() => { setIsResetMode(false); setError(""); setSuccessMsg(""); }} className="text-green-600 hover:underline font-bold">
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // 🎯 UI ล็อกอินปกติ
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-2xl border dark:border-green-900/30">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-600 mb-2">ibung</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isLogin ? "ยินดีต้อนรับกลับมา!" : "สร้างบัญชีใหม่เพื่อเริ่มคุยกัน"}
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-medium animate-pulse">{error}</div>}

      <div className="mb-6">
        <button onClick={handleGoogleLogin} disabled={loading} type="button" className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#0D140D] border border-gray-200 dark:border-green-900/30 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-green-900/10 transition-all active:scale-95 shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          เข้าสู่ระบบด้วย Google
        </button>
      </div>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-200 dark:border-green-900/30"></div>
        <span className="px-4 text-xs text-gray-400 font-medium">หรือใช้อีเมล</span>
        <div className="flex-1 border-t border-gray-200 dark:border-green-900/30"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="relative">
            <UserIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="ชื่อแสดงผล (Display Name)" value={name} onChange={e => setName(e.target.value)} required={!isLogin} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          <input type="email" placeholder="อีเมล" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
        </div>
        
        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          {/* 🎯 ปุ่มลืมรหัสผ่าน แอบอยู่ใต้ช่องใส่รหัสผ่านเนียนๆ */}
          {isLogin && (
            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => { setIsResetMode(true); setError(""); setSuccessMsg(""); }} className="text-xs text-gray-500 hover:text-green-600 font-medium transition-colors">
                ลืมรหัสผ่านใช่ไหม?
              </button>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-400 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/30">
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm font-medium text-gray-500">
        {isLogin ? "ยังไม่มีบัญชีใช่ไหม? " : "มีบัญชีอยู่แล้ว? "}
        <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccessMsg(""); }} className="text-green-600 hover:underline font-bold">
          {isLogin ? "สมัครเลย!" : "ล็อกอินที่นี่"}
        </button>
      </div>
    </div>
  );
}
