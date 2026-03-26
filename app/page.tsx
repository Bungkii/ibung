"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, update } from "firebase/database";
import { Heart, MessageCircle, Repeat, Loader2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลโพสต์ทั้งหมดจาก Firebase
  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // แปลง Object เป็น Array แล้วเรียงจากโพสต์ใหม่สุดไปเก่าสุด
        const postsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🎯 ฟังก์ชันรีโพสต์ (นำโพสต์คนอื่นมาแชร์ลงฟีดตัวเอง)
  const handleRepost = async (post: any) => {
    if (!auth.currentUser) return alert("กรุณาล็อกอินก่อนครับ!");
    
    // ห้ามรีโพสต์ซ้ำของตัวเองที่เพิ่งรีโพสต์มา (กันงง)
    if (post.reposterId === auth.currentUser.uid) {
      return alert("คุณได้รีโพสต์ไปแล้วครับ!");
    }

    const confirmRepost = confirm("ต้องการรีโพสต์นี้ไปที่หน้าฟีดของคุณหรือไม่?");
    if (!confirmRepost) return;

    try {
      // เอาข้อมูลโพสต์เดิม มาสร้างโพสต์ใหม่โดยแปะป้ายว่า "รีโพสต์"
      const newPost = {
        authorId: post.authorId,
        authorName: post.authorName,
        authorPhoto: post.authorPhoto,
        imageUrl: post.imageUrl || "",
        caption: post.caption || "",
        reposterId: auth.currentUser.uid,
        reposterName: auth.currentUser.displayName,
        isRepost: true, // ป้ายกำกับว่าเป็นโพสต์ที่ถูกแชร์มา
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
    if (newLikes[myId]) {
      newLikes[myId] = null; // เลิกไลก์
    } else {
      newLikes[myId] = true; // กดไลก์
    }
    await update(ref(db), { [`posts/${postId}/likes`]: newLikes });
  };

  // แปลงเวลาให้ดูง่ายๆ (เช่น 5 นาทีที่แล้ว)
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "เมื่อสักครู่";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชม. ที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] pb-24">
      
      {/* Header โลโก้แอป */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A0F0A]/80 backdrop-blur-md border-b dark:border-green-900/30 px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-500 tracking-tight">ibung</h1>
        <Link href="/post/story" className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-bold text-sm">
          + สร้างโพสต์
        </Link>
      </header>

      {/* Main Feed */}
      <main className="max-w-xl mx-auto mt-4 px-4 flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">ยังไม่มีโพสต์เลย เริ่มโพสต์คนแรกสิ!</div>
        ) : (
          posts.map(post => (
            <article key={post.id} className="bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-sm border dark:border-green-900/20 overflow-hidden">
              
              {/* 🎯 ป้ายกำกับรีโพสต์ (จะโชว์ก็ต่อเมื่อเป็นโพสต์ที่ถูกแชร์มา) */}
              {post.isRepost && (
                <div className="flex items-center gap-2 px-6 pt-4 pb-1 text-gray-500 dark:text-gray-400 text-xs font-bold">
                  <Repeat size={14} className="text-green-500" />
                  <span>{post.reposterName} รีโพสต์สิ่งนี้</span>
                </div>
              )}

              {/* ส่วนหัวของโพสต์ (รูปโปรไฟล์ + ชื่อ) */}
              <div className={`flex items-center justify-between px-6 pb-3 ${post.isRepost ? 'pt-1' : 'pt-5'}`}>
                <div className="flex items-center gap-3">
                  <img src={post.authorPhoto || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-green-900/30" alt="" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{post.authorName}</h3>
                    <p className="text-xs text-gray-400">{timeAgo(post.timestamp)}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
              </div>

              {/* เนื้อหาโพสต์ (แคปชั่น + รูปภาพ) */}
              <div className="px-6 pb-4">
                {post.caption && <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">{post.caption}</p>}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border dark:border-green-900/20">
                    <img src={post.imageUrl} className="w-full object-cover max-h-[500px]" alt="Post" />
                  </div>
                )}
              </div>

              {/* แถบเครื่องมือ (Like, Comment, Repost) */}
              <div className="px-4 py-3 border-t dark:border-green-900/20 flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)} 
                    className={`flex items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 ${post.likes?.[auth.currentUser?.uid || ''] ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10'}`}
                  >
                    <Heart size={20} className={post.likes?.[auth.currentUser?.uid || ''] ? "fill-current" : ""} />
                    <span className="text-sm font-medium">{Object.keys(post.likes || {}).length || 0}</span>
                  </button>

                  <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10 rounded-xl transition-all active:scale-95">
                    <MessageCircle size={20} />
                    <span className="text-sm font-medium">คอมเมนต์</span>
                  </Link>

                  {/* 🎯 ปุ่มรีโพสต์ */}
                  <button 
                    onClick={() => handleRepost(post)} 
                    className={`flex items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 ${post.reposterId === auth.currentUser?.uid ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-green-900/10 hover:text-green-500'}`}
                  >
                    <Repeat size={20} />
                    <span className="text-sm font-medium">รีโพสต์</span>
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