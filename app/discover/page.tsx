"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import dynamic from "next/dynamic";
const TinderCard = dynamic(() => import("react-tinder-card"), { ssr: false });
import { Heart, X, Loader2, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  const [usersToSwipe, setUsersToSwipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🎯 เก็บ Ref ของการ์ดแต่ละใบ เพื่อให้ปุ่มกดใช้งานได้
  const cardRefs = useRef<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const myId = auth.currentUser.uid;

    // 🎯 เปลี่ยนมาใช้ get() แทน onValue เพื่อไม่ให้การ์ดกระตุกเวลาปัด
    const fetchUsers = async () => {
      const usersSnap = await get(ref(db, 'users'));
      const followSnap = await get(ref(db, `following/${myId}`));
      
      const allUsers = usersSnap.val() || {};
      const following = followSnap.val() || {};
      
      // คัดกรอง: 1. ไม่ใช่ตัวเอง 2. ยังไม่ได้ฟอลโล่
      const potentialFriends = Object.values(allUsers).filter((u: any) => 
        u.uid !== myId && !following[u.uid]
      );
      
      setUsersToSwipe(potentialFriends);
      setLoading(false);
    };
    
    fetchUsers();
  }, []);

  const swiped = async (direction: string, targetUserId: string) => {
    // ปัดขวา = ฟอลโล่
    if (direction === 'right' && auth.currentUser) {
      const myId = auth.currentUser.uid;
      const updates: any = {};
      updates[`following/${myId}/${targetUserId}`] = true;
      updates[`followers/${targetUserId}/${myId}`] = true;
      
      try {
        await update(ref(db), updates);
      } catch (err) {
        console.error("Follow error", err);
      }
    }
  };

  // 🎯 เมื่อการ์ดปลิวออกจากจอไปแล้ว ให้ลบออกจาก Array (เพื่อขยับใบต่อไปขึ้นมา)
  const outOfFrame = (uid: string) => {
    setUsersToSwipe(prev => prev.filter(u => u.uid !== uid));
  };

  // 🎯 ฟังก์ชันสั่งปัดด้วยปุ่มกด
  const swipe = (dir: 'left' | 'right') => {
    const cardsLeft = usersToSwipe.length;
    if (cardsLeft > 0) {
      const topCardIndex = cardsLeft - 1; // เลือกการ์ดใบบนสุด
      cardRefs.current[topCardIndex]?.swipe(dir); // สั่งการ์ดให้ปลิว
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-500 w-8 h-8" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen items-center justify-center overflow-hidden bg-[#F9FAFB] dark:bg-[#0A0F0A]">
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="text-green-500" /> ค้นหาเพื่อนใหม่
        </h1>
        <p className="text-gray-500 text-sm mt-2">ปัดขวาเพื่อติดตาม ปัดซ้ายเพื่อข้าม</p>
      </div>

      <div className="relative w-[300px] h-[400px]">
        {usersToSwipe.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-green-900/30 rounded-[2rem]">
            <UserPlus size={48} className="mb-4 opacity-20" />
            <p>คุณติดตามทุกคนหมดแล้ว!</p>
            <Link href="/" className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-sm font-bold">กลับหน้าหลัก</Link>
          </div>
        ) : (
          usersToSwipe.map((user, index) => (
            <TinderCard
              key={user.uid}
              ref={el => (cardRefs.current[index] = el)} // ส่ง Ref เก็บไว้
              className="absolute inset-0"
              onSwipe={(dir) => swiped(dir, user.uid)}
              onCardLeftScreen={() => outOfFrame(user.uid)}
              preventSwipe={['up', 'down']} // ห้ามปัดขึ้นลง
            >
              <div className="w-full h-full bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-xl border dark:border-green-900/30 overflow-hidden relative cursor-grab active:cursor-grabbing flex flex-col">
                <img 
                  src={user.photoURL || "/api/placeholder/300/300"} 
                  className="w-full h-3/4 object-cover pointer-events-none" 
                  alt={user.displayName}
                />
                <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-t from-black/60 to-transparent absolute inset-0">
                  <div className="mt-auto">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">{user.displayName}</h2>
                    <p className="text-white/80 text-sm mt-1">ผู้ใช้งาน ibung</p>
                  </div>
                </div>
              </div>
            </TinderCard>
          ))
        )}
      </div>

      {/* 🎯 ปุ่มกด ใช้งานได้จริงแล้ว! กดปุ๊บการ์ดปลิวปั๊บ */}
      <div className="flex gap-6 mt-10 z-10">
        <button 
          onClick={() => swipe('left')} 
          disabled={usersToSwipe.length === 0}
          className="w-14 h-14 bg-white dark:bg-[#1A241A] rounded-full shadow-lg flex items-center justify-center border dark:border-green-900/30 text-red-500 hover:scale-110 active:scale-90 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <X size={28} strokeWidth={3} />
        </button>
        <button 
          onClick={() => swipe('right')} 
          disabled={usersToSwipe.length === 0}
          className="w-14 h-14 bg-white dark:bg-[#1A241A] rounded-full shadow-lg flex items-center justify-center border dark:border-green-900/30 text-green-500 hover:scale-110 active:scale-90 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <Heart size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}