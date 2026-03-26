"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // ล็อกอินสำเร็จ เด้งไปหน้าแรก
    } catch (err: any) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้องครับ!");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0F0A] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1A241A] p-8 rounded-[2rem] shadow-xl border dark:border-green-900/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-500 mb-2">ibung</h1>
          <p className="text-gray-500 text-sm">เข้าสู่ระบบเพื่อเชื่อมต่อกับเพื่อนๆ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="รหัสผ่าน" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D140D] border dark:border-transparent focus:border-green-500/50 outline-none text-sm"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "เข้าสู่ระบบ"}
          </button