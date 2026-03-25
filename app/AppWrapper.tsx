"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AuthForm from "@/components/AuthForm";
import { Home, PlusSquare, MessageCircle, User, Loader2 } from "lucide-react";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0A0F0A]">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
    </div>
  );

  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* 🖥️ Desktop Side Navigation (Show on md+) */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 flex-col bg-white dark:bg-[#0D140D] border-r dark:border-green-900/20 p-4 z-50">
        <div className="mb-10 px-2 lg:px-4">
          <h1 className="text-2xl font-bold text-green-600 font-serif lg:block hidden">ibung</h1>
          <div className="w-8 h-8 bg-green-500 rounded-lg lg:hidden" />
        </div>
        <div className="space-y-2 flex-1">
          <NavItem href="/" icon={<Home />} label="หน้าหลัก" active={pathname === '/'} />
          <NavItem href="/post" icon={<PlusSquare />} label="สร้างโพสต์" active={pathname === '/post'} />
          <NavItem href="/chat" icon={<MessageCircle />} label="ข้อความ" active={pathname.startsWith('/chat')} />
          <NavItem href={`/profile/${user.uid}`} icon={<User />} label="โปรไฟล์" active={pathname.startsWith('/profile')} />
        </div>
      </nav>

      {/* 📱 Mobile Bottom Navigation (Show on sm-) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 dark:bg-[#0D140D]/80 backdrop-blur-lg border-t dark:border-green-900/20 flex justify-around py-3 z-50">
        <Link href="/" className={pathname === '/' ? 'text-green-500' : 'text-slate-400'}><Home /></Link>
        <Link href="/post" className={pathname === '/post' ? 'text-green-500' : 'text-slate-400'}><PlusSquare /></Link>
        <Link href="/chat" className={pathname.startsWith('/chat') ? 'text-green-500' : 'text-slate-400'}><MessageCircle /></Link>
        <Link href={`/profile/${user.uid}`} className={pathname.startsWith('/profile') ? 'text-green-500' : 'text-slate-400'}><User /></Link>
      </nav>

      {/* 🏠 Main Content Area */}
      <main className="md:pl-20 lg:pl-64 pb-20 md:pb-0 min-h-screen flex justify-center">
        <div className="w-full max-w-2xl lg:max-w-4xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? 'bg-green-50 dark:bg-green-900/20 text-green-600 font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-green-900/10'}`}>
      {icon}
      <span className="hidden lg:block text-sm">{label}</span>
    </Link>
  );
}