"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, query, limitToLast, push, serverTimestamp } from "firebase/database";
import PostCard from "@/components/PostCard";
import { Loader2, Plus, X, Send } from "lucide-react";
import Link from "next/link";

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [viewedStories, setViewedStories] = useState<string[]>([]);

  useEffect(() => {
    // โหลดโพสต์
    const postsRef = query(ref(db, 'posts'), limitToLast(50));
    onValue(postsRef, (snap) => {
      const data = snap.val();
      if (data) setPosts(Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse());
      setLoading(false);
    });

    // โหลดสตอรี่ (24 ชม.)
    onValue(ref(db, 'stories'), (snap) => {
      const data = snap.val();
      if (data) {
        const now = Date.now();
        const active = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter((s: any) => now - s.timestamp < 24 * 60 * 60 * 1000)
          .reverse();
        setStories(active);
      }
    });

    // ดึงประวัติการดูสตอรี่จากเครื่อง
    const savedViews = localStorage.getItem("viewedStories");
    if (savedViews) setViewedStories(JSON.parse(savedViews));
  }, []);

  // เมื่อกดดูสตอรี่ ให้บันทึกว่าดูแล้ว (เปลี่ยนเป็นสีเทา)
  const handleOpenStory = (story: any) => {
    setSelectedStory(story);
    if (!viewedStories.includes(story.id)) {
      const newViews = [...viewedStories, story.id];
      setViewedStories(newViews);
      localStorage.setItem("viewedStories", JSON.stringify(newViews));
    }
  };

  // ส่งข้อความตอบกลับสตอรี่ (เข้าแชทส่วนตัว)
  const handleReplyStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !auth.currentUser || !selectedStory) return;
    
    const myId = auth.currentUser.uid;
    const targetId = selectedStory.userId;
    if (myId === targetId) return alert("ตอบกลับสตอรี่ตัวเองไม่ได้ครับ");

    // สร้าง ID ห้องแชทแบบเดียวกับหน้า Chat
    const chatId = myId < targetId ? `${myId}_${targetId}` : `${targetId}_${myId}`;
    
    await push(ref(db, `chats/${chatId}`), {
      text: `[ตอบกลับสตอรี่]: ${replyText}`,
      senderId: myId,
      timestamp: serverTimestamp()
    });
    
    setReplyText("");
    setSelectedStory(null);
    alert("ส่งข้อความตอบกลับแล้ว!");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 🌈 Story Bar */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 mb-8 items-center">
        <Link href="/post/story" className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="relative p-0.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700">
            <img src={auth.currentUser?.photoURL || "/api/placeholder/40/40"} className="w-14 h-14 rounded-full object-cover" alt="" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#0A0F0A]"><Plus size={12} strokeWidth={4}/></div>
          </div>
          <span className="text-[10px] font-bold text-gray-500">สตอรี่ของคุณ</span>
        </Link>

        {stories.map((s, i) => {
          const isViewed = viewedStories.includes(s.id);
          return (
            <div key={i} onClick={() => handleOpenStory(s)} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95">
              <div className={`w-[68px] h-[68px] rounded-full p-[2px] ${isViewed ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'}`}>
                <div className="w-full h-full bg-white dark:bg-[#0A0F0A] rounded-full p-0.5">
                  <img src={s.userPhoto || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className={`text-[10px] truncate w-16 text-center ${isViewed ? 'text-gray-400 font-normal' : 'font-medium'}`}>{s.userName}</span>
            </div>
          );
        })}
      </div>

      {/* 📮 Feed */}
      <div className="space-y-6">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" /></div> : posts.map(post => <PostCard key={post.id} post={post} />)}
      </div>

      {/* 📱 Story Viewer Modal & Reply */}
      {selectedStory && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 md:p-10 animate-in fade-in duration-300">
          <button onClick={() => setSelectedStory(null)} className="absolute top-6 right-6 text-white/50 hover:text-white z-50"><X size={32}/></button>
          
          <div className="relative w-full max-w-md aspect-[9/16] bg-[#111] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header สตอรี่ */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/20 p-2 rounded-full backdrop-blur-md">
              <img src={selectedStory.userPhoto} className="w-8 h-8 rounded-full border border-white/20 object-cover" alt="" />
              <span className="text-white font-bold text-sm">{selectedStory.userName}</span>
            </div>

            {/* เนื้อหาสตอรี่ */}
            <div className="flex-1 relative flex items-center justify-center">
              {selectedStory.type === "video" ? (
                <video src={selectedStory.url} autoPlay playsInline className="w-full h-full object-contain" onEnded={() => setSelectedStory(null)} />
              ) : (
                <img src={selectedStory.url} className="w-full h-full object-contain" alt="" />
              )}
            </div>

            {/* แถบ Reply ด้านล่าง */}
            {selectedStory.userId !== auth.currentUser?.uid && (
              <form onSubmit={handleReplyStory} className="absolute bottom-4 left-4 right-4 flex gap-2">
                <input 
                  type="text" 
                  placeholder={`ตอบกลับ ${selectedStory.userName}...`} 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-black/40 backdrop-blur-md text-white border border-white/30 rounded-full px-5 py-3 text-sm outline-none placeholder:text-white/50 focus:border-white transition-all"
                />
                <button type="submit" className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}