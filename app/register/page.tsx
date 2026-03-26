"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. สร้างบัญชี Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. อัปเดตชื่อในโปรไฟล์
      await updateProfile(user, { displayName: name });

      // 3. บันทึกข้อมูลลง Realtime Database เพื่อให้ระบบค้นหาเพื่อนและแชททำงานได้
      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        displayName: name,
        email: email,
        photoURL: "", // ค่าเริ่มต้นว่างไว้ ไปเปลี่ยนในหน้าโปรไฟล์
        timestamp: Date.now()
      });

      router.push("/"); // สมัครเสร็จ เด้งไปหน้าแรก
    } catch (err: any) {
      alert("สมัครไม่สำเร็จครับ อาจจะรหัสผ่านสั้นไป (ต้อง 6 ตัวขึ้นไป) หรืออีเมลซ้ำ");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0F0A] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1A241A] p-8 rounded-[2rem] shadow-xl border dark:border-green-900/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-500 mb-2">ibung</h1>
          <p className="text-gray-500 text-sm">สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="ชื่อที่ใช้แสดง (Display Name)" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D140D] border dark:border-transparent focus:border-green-500/50 outline-none text-sm"
              required 
            />
          </div>
          <div>
            <input 
              type="email" 
              placeholder="อีเมล" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D140D] border dark:border-transparent focus:border-green-500/50 outline-none text-sm"
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="รหัสผ่าน (6 ตัวอักษรขึ้นไป)" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D140D] border dark:border-transparent focus:border-green-500/50 outline-none text-sm"
              required 
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-green-500 font-bold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}