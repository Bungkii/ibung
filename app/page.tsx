"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, update, query, orderByChild, startAt } from "firebase/database";
import { Heart, MessageCircle, Repeat, Loader2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);

  // 1. ดึงข้อมูลโพสต์ (Feed + Repost)
  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
      setLoadingPosts(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. ดึงข้อมูลสตอรี่ (กรองเอาแค่ 24 ชม. ล่าสุด)
  useEffect(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const storiesRef = query(ref(db, 'stories'), orderByChild('timestamp'), startAt(oneDayAgo));
    
    const unsubscribe = onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersWithStories: { [key: string]: any } = {};
        Object.values(data).forEach((story: any) => {
          if (!usersWithStories[story.userId]) {
            usersWithStories[story.userId] = story;
          }
        });
        
        const storiesArray = Object.values(usersWithStories).sort((a: any, b: any) => b.timestamp - a.timestamp);
        setStories(storiesArray);
      } else {
        setStories([]);
      }
      setLoadingStories(false);
    });
    return () => unsubscribe();
  }, []);

  // ฟังก์ชันรีโพสต์
  const handleRepost = async (post: any) => {
    if (!auth.currentUser) return alert("กรุณาล็อกอินก่อนครับ!");
    if (post.reposterId === auth.currentUser.uid) {
      return alert("คุณได้รีโพสต์สิ่งนี้ไปแล้วครับ!");
    }
    const confirmRepost = confirm("ต้องการรีโพสต์นี้ไปที่หน้าฟีดของคุณหรือไม่?");
    if (!confirmRepost) return;

    try {
      const newPost = {
        authorId: post.authorId,
        authorName: post.authorName,
        authorPhoto: post.authorPhoto,
        imageUrl: post.imageUrl || "",
        caption: post.caption || "",
        reposterId: auth.currentUser.uid,
        reposterName: auth.currentUser.displayName,
        isRepost: true,
        timestamp: Date.now()
      };
      await push(ref(db, 'posts'), newPost);
      alert("รีโพสต์สำเร็จ! โพสต์นี้ไปอยู่บนหน้าฟีดของคุณแล้วครับ 🚀");
    } catch (err) {
      console.error("Repost Error:", err);
      alert("เกิดข้อผิดพลาดในการรีโพสต์ครับ");
    }
  };

  // ฟังก์ชันกดหัวใจ (กดไลก์)
  const handleLike = async (postId: string, currentLikes: any = {}) => {
    if (!auth.currentUser) return alert("กรุณาล็อกอินก่อนครับ!");
    const myId = auth.currentUser.uid;
    const postRef = ref(db, `posts/${postId}/likes`);
    const newLikes = { ...currentLikes };
    if (newLikes[myId]) { newLikes[myId] = null; } 
    else { newLikes[myId] = true; }
    await update(ref(db), { [`posts/${postId}/likes`]: newLikes });
  };

  // แปลงเวลาให้ดูง่ายๆ
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "เมื่อสักครู่";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชม. ที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] pb-24 font-sansantialiased text-slate-900 dark:text-slate-100 antialiased font-sans">
      
      {/* 🎯 Header โลโก้แอป ( sticky + จัด ibung อยู่กลาง ) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0A0F0A]/90 backdrop-blur-md border-b dark:border-green-900/30 px-5 py-3 flex items-center h-[60px] relative">
        {/* ชื่อแอปอยู่ตรงกลางเป๊ะ */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-2xl font-bold text-green-500 tracking-tighter">ibung</h1>
        </div>
        
        {/* ปุ่มบวกอยู่มุมขวา */}
        <div className="ml-auto">
          <Link href="/post/story" className="p-2 bg-green-500 text-white rounded-full font-bold active:scale-95 transition-all flex items-center justify-center">
            <Plus size={18} />
          </Link>
        </div>
      </header>

      {/* สตอรี่บาร์ */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 py-5 bg-white dark:bg-[#0D140D] border-b dark:border-green-900/20">
        
        {/* ปุ่มเพิ่มสตอรี่ของตัวเอง */}
        <Link href="/post/story" className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
          <div className="relative w-16 h-16 rounded-full p-1 border-2 border-dashed border-gray-300 dark:border-green-800 flex items-center justify-center group-hover:border-green-500 transition-colors">
            <img src={auth.currentUser?.photoURL || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
            <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-[#0D140D]">
              <Plus size={14} />
            </div>
          </div>
          <span className="text-[11px] text-gray-400 group-hover:text-green-500 font-bold">สตอรี่</span>
        </Link>

        {/* สตอรี่ของเพื่อนๆ */}
        {loadingStories ? (
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-green-900/20" />
                <div className="w-12 h-2.5 bg-gray-100 dark:bg-green-900/20 rounded-full" />
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex items-center text-xs text-gray-400 font-bold px-2 pt-5">ยังไม่มีสตอรี่ใหม่...</div>
        ) : (
          stories.map((story, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-16 h-16 rounded-full p-1 ring-2 ring-green-500">
                <img src={story.userPhoto || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              <span className="text-[11px] text-gray-500 w-16 truncate text-center">{story.userName}</span>
            </div>
          ))
        )}
      </div>

      {/* Main Feed */}
      <main className="max-w-xl mx-auto mt-6 px-4 flex flex-col gap-6">
        {loadingPosts ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">ยังไม่มีโพสต์เลย เริ่มโพสต์คนแรกสิ!</div>
        ) : (
          posts.map(post => (
            <article key={post.id} className="bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-sm border dark:border-green-900/20 overflow-hidden animate-in fade-in duration-300">
              
              {post.isRepost && (
                <div className="flex items-center gap-2 px-6 pt-4 pb-1 text-gray-500 dark:text-gray-400 text-xs font-bold">
                  <Repeat size={14} className="text-green-500" />
                  <span>{post.reposterName} รีโพสต์สิ่งนี้</span>
                </div>
              )}

              <div className={`flex items-center justify-between px-6 pb-3 ${post.isRepost ? 'pt-1' : 'pt-5'}`}>
                <div className="flex items-center gap-3">
                  <img src={post.authorPhoto || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-green-900/30" alt="" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{post.authorName}</h3>
                    <p className="text-xs text-gray-400">{timeAgo(post.timestamp)}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 active:scale-90 transition-all"><MoreHorizontal size={20} /></button>
              </div>

              <div className="px-6 pb-4">
                {post.caption && <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">{post.caption}</p>}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border dark:border-green-900/20">
                    <img src={post.imageUrl} className="w-full object-cover max-h-[500px]" alt="Post" />
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t dark:border-green-900/20 flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)} 
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl transition-all active:scale-95 ${post.likes?.[auth.currentUser?.uid || ''] ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10'}`}
                  >
                    <Heart size={20} className={post.likes?.[auth.currentUser?.uid || ''] ? "fill-current" : ""} />
                    <span className="text-sm font-bold">{Object.keys(post.likes || {}).length || 0}</span>
                  </button>

                  <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 p-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10 rounded-xl transition-all active:scale-95">
                    <MessageCircle size={20} />
                    <span className="text-sm font-bold">คอมเมนต์</span>
                  </Link>

                  <button 
                    onClick={() => handleRepost(post)} 
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl transition-all active:scale-95 ${post.reposterId === auth.currentUser?.uid ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10 hover:text-green-500'}`}
                  >
                    <Repeat size={20} />
                    <span className="text-sm font-bold">รีโพสต์</span>
                  </button>
                </div>
              </div>

            </article>
          ))
        )}
      </main>
    </div>
  );
}