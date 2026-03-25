"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, User, Send, Loader2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("id");
  const currentUser = auth.currentUser;
  const [targetUser, setTargetUser] = useState<any>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll ไปล่างสุด
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setChatUsers(Object.values(data).filter((u: any) => u.uid !== currentUser.uid));
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
        <div className="p-6">
          <Link href="/">
            <h1 className="text-xl font-bold text-green-600 dark:text-green-500 tracking-tight">ibung</h1>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {chatUsers.map(user => (
            <Link href={`/chat?id=${user.uid}`} key={user.uid} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${user.uid === targetUid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'hover:bg-gray-50 dark:hover:bg-green-900/10 text-gray-600 dark:text-gray-400'}`}>
              <img src={user.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" />
              <span className="font-medium text-sm">{user.displayName}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0A0F0A] md:m-4 md:rounded-3xl md:shadow-2xl md:border dark:border-green-900/20 overflow-hidden">
        
        {targetUid ? (
          <>
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b dark:border-green-900/20 bg-white/80 dark:bg-[#0D140D]/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Link href="/chat" className="md:hidden"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
                <img src={targetUser?.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full border dark:border-green-800" alt="" />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 leading-none">{targetUser?.displayName}</h2>
                  <span className="text-[10px] text-green-500 font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-transparent">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#1A241A] text-gray-800 dark:text-gray-200 border dark:border-green-900/30 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <footer className="p-4 bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20">
              <form onSubmit={sendMessage} className="flex items-center gap-3 bg-gray-100 dark:bg-[#1A241A] rounded-2xl px-4 py-2 border dark:border-transparent focus-within:border-green-500 transition-all">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent py-2 outline-none text-sm dark:text-white" />
                <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-transform active:scale-90">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <div className="w-20 h-20 mb-4 rounded-full bg-gray-50 dark:bg-[#0D140D] flex items-center justify-center border dark:border-green-900/20">
              <User className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}