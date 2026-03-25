"use client";
import { useState, useRef, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { 
  signInWithPopup, GoogleAuthProvider, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile 
} from "firebase/auth";
import { ref as dbRef, set, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🛡️ State สำหรับเก็บข้อความแจ้งเตือนรหัสผ่าน
  const [passError, setPassError] = useState("");

  // 🛡️ ฟังก์ชันเช็คความแข็งแกร่งของรหัสผ่านแบบ Real-time
  useEffect(() => {
    if (isLogin || password.length === 0) {
      setPassError("");
      return;
    }
    
    if (password.length < 8) setPassError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    else if (!/[A-Z]/.test(password)) setPassError("ต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว");
    else if (!/[a-z]/.test(password)) setPassError("ต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว");
    else if (!/[0-9]/.test(password)) setPassError("ต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว");
    else if (!/[!@#$%^&*_=+-]/.test(password)) setPassError("ต้องมีอักขระพิเศษ (!@#$...) อย่างน้อย 1 ตัว");
    else setPassError(""); // ผ่านเงื่อนไขทั้งหมด

  }, [password, isLogin]);

  // ระบบล็อกอินด้วย Google
  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      
      const userSnapshot = await get(dbRef(db, `users/${user.uid}`));
      if (!userSnapshot.exists()) {
        await set(dbRef(db, `users/${user.uid}`), {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        });
      }
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ระบบสมัครสมาชิก
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return alert("กรุณากรอกข้อมูลให้ครบ");
    
    // 🛡️ เช็คด่านสุดท้ายก่อนส่งไป Firebase
    if (passError) return alert("รหัสผ่านยังไม่ปลอดภัยพอ กรุณาแก้ไขตามคำแนะนำ");

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = "https://via.placeholder.com/150";
      if (file) {
        const imageRef = storageRef(storage, `profiles/${user.uid}_${file.name}`);
        await uploadBytes(imageRef, file);
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, { displayName: username, photoURL });
      await set(dbRef(db, `users/${user.uid}`), {
        uid: user.uid,
        displayName: username,
        photoURL: photoURL,
        email: email,
      });

    } catch (error: any) {
      // ดัก Error จาก Firebase กรณีอีเมลซ้ำ
      if (error.code === 'auth/email-already-in-use') alert("อีเมลนี้ถูกใช้งานแล้ว!");
      else alert("สมัครสมาชิกไม่สำเร็จ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ระบบล็อกอินด้วย Email/Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-green-950 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-green-900 rounded-3xl shadow-xl overflow-hidden border dark:border-green-800">
        
        <div className="flex">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 font-bold transition ${isLogin ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-green-800 text-gray-500 dark:text-green-300'}`}>
            เข้าสู่ระบบ
          </button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 font-bold transition ${!isLogin ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-green-800 text-gray-500 dark:text-green-300'}`}>
            สมัครสมาชิก
          </button>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-green-600 dark:text-green-400 font-serif mb-6">ibung</h2>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            
            {!isLogin && (
              <div className="flex flex-col items-center gap-3">
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-full bg-gray-200 dark:bg-green-800 border-2 border-dashed border-green-500 flex items-center justify-center cursor-pointer overflow-hidden">
                  {file ? <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">เลือกรูปโปรไฟล์</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />

                <input type="text" placeholder="ชื่อผู้ใช้งาน (Username)" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border dark:border-green-700 bg-gray-50 dark:bg-green-950 dark:text-white outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            )}

            <input type="email" placeholder="อีเมล" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border dark:border-green-700 bg-gray-50 dark:bg-green-950 dark:text-white outline-none focus:ring-2 focus:ring-green-400" />
            
            <div className="relative">
              <input type="password" placeholder="รหัสผ่าน" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-green-950 dark:text-white outline-none focus:ring-2 ${!isLogin && passError ? 'border-red-500 focus:ring-red-400' : 'dark:border-green-700 focus:ring-green-400'}`} />
              
              {/* 🛡️ ข้อความแจ้งเตือน (โชว์เฉพาะตอนสมัครสมาชิก และมีข้อผิดพลาด) */}
              {!isLogin && password.length > 0 && (
                <div className={`text-xs mt-2 ml-1 font-bold ${passError ? 'text-red-500' : 'text-green-500'}`}>
                  {passError ? `❌ ${passError}` : '✅ รหัสผ่านปลอดภัยเยี่ยมมาก!'}
                </div>
              )}
            </div>

            {/* ปุ่มสมัครจะถูกปิดการใช้งาน ถ้ารหัสผ่านยังไม่ผ่านเงื่อนไข */}
            <button type="submit" disabled={loading || (!isLogin && passError !== "")} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "กำลังโหลด..." : (isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก")}
            </button>
          </form>

          {/* ปุ่ม Google ซ่อนไว้สั้นๆ เพื่อประหยัดพื้นที่ */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300 dark:border-green-700"></div><span className="flex-shrink-0 mx-4 text-gray-400 text-sm">หรือ</span><div className="flex-grow border-t border-gray-300 dark:border-green-700"></div>
          </div>
          <button onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 bg-white dark:bg-green-800 border dark:border-green-700 text-gray-700 dark:text-green-100 font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-green-700 transition flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google" className="w-5 h-5" /> ดำเนินการต่อด้วย Google
          </button>
        </div>
      </div>
    </div>
  );
}