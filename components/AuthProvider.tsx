"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // 🎯 ถ้ายังไม่ล็อกอิน และไม่ได้อยู่หน้า login/register ให้เด้งไปหน้า login
      if (!user && pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      } 
      // 🎯 ถ้าล็อกอินแล้ว แต่เผลอกดไปหน้า login ให้เด้งกลับหน้าหลัก
      else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // โชว์หน้าโหลดดิ้งหมุนๆ ระหว่างรอยืนยันตัวตน
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0F0A]">
        <Loader2 className="animate-spin text-green-500 w-10 h-10" />
      </div>
    );
  }

  return <>{children}</>;
}