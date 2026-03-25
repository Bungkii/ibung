"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, User, Send, Loader2, Search, X } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("id");
  const currentUser = auth.currentUser;
  const [targetUser, setTargetUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]); // เก็บรายชื่อทั้งหมด
  const [searchTerm, setSearchTerm] = useState(""); // 🎯 คำค้นหา
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // กรองรายชื่อเพื่อนจาก Username (Live Search)
  const filteredUsers = allUsers.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllUsers(Object.values(data).filter((u: any) => u.uid !== currentUser.uid));
      }
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !targetUid) return;
    setLoading(true);
    onValue(ref(db, `users/${targetUid}`), (snapshot) => setTargetUser(snapshot.val()));
    const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
    return onValue(ref(db, `chats/${chatId}`), (snapshot) => {
      const data = snapshot.val();
      setMessages(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
      setLoading(false);
    });
  }, [currentUser, targetUid]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !targetUid) return;
    const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
    await push(ref(db, `chats/${chatId}`), { text: newMessage, senderId: currentUser.uid, timestamp: serverTimestamp() });
    setNewMessage("");
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] font-sans">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex w-80 flex-col bg-white dark:bg-[#0D140D] border-r dark:border-green-900/30">
        <div className="p-6 pb-2">
          <Link href="/"><h1 className="text-xl font-bold text-green-600 dark:text-green-500 mb-6">ibung</h1></Link>
          
          {/* 🎯 ช่องค้นหา (Desktop) */}
          <div className="relative group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อผู้ใช้งาน..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A241A] rounded-xl text-sm outline-none border border-transparent focus:border-green-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <Link href={`/chat?id=${user.uid}`} key={user.uid} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${user.uid === targetUid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'hover:bg-gray-50 dark:hover:bg-green-900/10 text-gray-600 dark:text-gray-400'}`}>
              <img src={user.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover" alt="" />
              <span className="font-medium text-sm">{user.displayName}</span>
            </Link>
          )) : (
            <p className="text-center text-xs text-gray-400 mt-10">ไม่พบผู้ใช้งานชื่อนี้</p>
          )}
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0A0F0A] md:m-4 md:rounded-3xl md:border dark:border-green-900/20 overflow-hidden relative">
        
        {targetUid ? (
          <>
            <header className="px-6 py-4 flex items-center gap-3 border-b dark:border-green-900/20 bg-white/80 dark:bg-[#0D140D]/80 backdrop-blur-md z-10">
              <Link href="/chat" className="md:hidden"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
              <img src={targetUser?.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full border dark:border-green-800" alt="" />
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 leading-none">{targetUser?.displayName}</h2>
                <span className="text-[10px] text-green-500 font-medium">ONLINE</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20 dark:bg-transparent">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] shadow-sm ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#1A241A] text-gray-800 dark:text-gray-200 border dark:border-green-900/20 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <footer className="p-4 bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20">
              <form onSubmit={sendMessage} className="flex items-center gap-3 bg-gray-100 dark:bg-[#1A241A] rounded-2xl px-4 py-2 border dark:border-transparent focus-within:border-green-500 transition-all">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-transparent py-2 outline-none text-sm dark:text-white" />
                <button type="submit" className="p-2 bg-green-600 text-white rounded-xl transition-transform active:scale-90"><Send className="w-4 h-4" /></button>
              </form>
            </footer>
          </>
        ) : (
          /* 📱 หน้าเลือกเพื่อน (Mobile) */
          <div className="flex-1 flex flex-col">
            <div className="p-6 md:hidden">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-green-500 mb-6 font-serif tracking-tight">ibung chat</h1>
                {/* 🎯 ช่องค้นหา (Mobile) */}
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                    type="text" 
                    placeholder="ค้นหา username เพื่อน..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#0D140D] border dark:border-green-900/30 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:hidden">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">ผู้ใช้งานทั้งหมด</p>
                <div className="grid grid-cols-1 gap-2">
                    {filteredUsers.map(user => (
                    <Link href={`/chat?id=${user.uid}`} key={user.uid} className="flex items-center gap-4 p-4 bg-white dark:bg-[#0D140D] border dark:border-green-900/10 rounded-2xl active:scale-[0.98] transition-all">
                        <img src={user.photoURL || "/api/placeholder/40/40"} className="w-12 h-12 rounded-full shadow-sm" alt="" />
                        <span className="font-bold text-gray-700 dark:text-gray-200">{user.displayName}</span>
                    </Link>
                    ))}
                </div>
            </div>
            {/* Empty State สำหรับ Desktop */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-[#0D140D] flex items-center justify-center border dark:border-green-900/20"><User className="opacity-20" /></div>
              <p className="text-xs">เลือกเพื่อนจากทางซ้ายเพื่อเริ่มคุย</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}