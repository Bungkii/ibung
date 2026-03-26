"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [myId, setMyId] = useState<string>("");

  useEffect(() => {
    // ดึง UID ของตัวเองเพื่อเอาไปทำลิงก์หน้าโปรไฟล์
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setMyId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // ซ่อนเมนูด้านล่างถ้าอยู่ในหน้า Login หรือ Register
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <div className="fixed bottom-0 w-full max-w-2xl mx-auto left-0 right-0 bg-white dark:bg-[#0A0F0A] border-t dark:border-green-900/30 flex justify-around items-center py-3 px-2 z-50 pb-safe">
      
      {/* 1. หน้าแรก */}
      <Link href="/" className={`p-2 transition-transform active:scale-90 ${pathname === '/' ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}>
        <Home size={26} strokeWidth={pathname === '/' ? 2.5 : 2} />
      </Link>

      {/* 2. ค้นหาเพื่อน (Tinder Mode) 🎯 */}
      <Link href="/discover" className={`p-2 transition-transform active:scale-90 ${pathname === '/discover' ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}>
        <Search size={26} strokeWidth={pathname === '/discover' ? 2.5 : 2} />
      </Link>

      {/* 3. ลงโพสต์/สตอรี่ */}
      <Link href="/post/story" className={`p-2 transition-transform active:scale-90 ${pathname.includes('/post') ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}>
        <PlusSquare size={26} strokeWidth={pathname.includes('/post') ? 2.5 : 2} />
      </Link>

      {/* 4. แชท */}
      <Link href="/chat" className={`p-2 transition-transform active:scale-90 ${pathname.includes('/chat') ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}>
        <MessageCircle size={26} strokeWidth={pathname.includes('/chat') ? 2.5 : 2} />
      </Link>

      {/* 5. โปรไฟล์ตัวเอง */}
      <Link href={myId ? `/profile/${myId}` : "#"} className={`p-2 transition-transform active:scale-90 ${pathname.includes('/profile') ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}>
        <User size={26} strokeWidth={pathname.includes('/profile') ? 2.5 : 2} />
      </Link>

    </div>
  );
}