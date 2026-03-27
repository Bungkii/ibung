"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push } from "firebase/database";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

export default function PostCommentPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const currentUser = auth.currentUser;
  
  const [post, setPost] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลโพสต์และคอมเมนต์แบบ Real-time
  useEffect(() => {
    if (!id) return;
    const postRef = ref(db, `posts/${id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        setPost({ id: snapshot.key, ...snapshot.val() });
      } else {
        setPost(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // ฟังก์ชันส่งคอมเมนต์
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      await push(ref(db, `posts/${id}/comments`), {
        text: newComment,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        timestamp: Date.now()
      });
      setNewComment(""); // ล้างช่องพิมพ์หลังส่งเสร็จ
    } catch (error) {
      console.error(error);
      alert("ส่งคอมเมนต์ไม่สำเร็จ!");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0F0A]"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>;
  if (!post) return <div className="flex h-screen items-center justify-center text-gray-500">ไม่พบโพสต์นี้...</div>;

  // เรียงคอมเมนต์จากเก่าไปใหม่
  const commentsList = post.comments ? Object.keys(post.comments).map(k => ({ id: k, ...post.comments[k] })).sort((a,b) => a.timestamp - b.timestamp) : [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] pb-32 flex flex-col">
      
      {/* 🎯 Header แถบบนสุด */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0A0F0A]/90 backdrop-blur-md border-b dark:border-green-900/30 px-4 py-3 flex items-center h-[60px]">
        <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-green-900/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">คอมเมนต์</h1>
      </header>

      <main className="max-w-xl mx-auto w-full flex-1">
        
        {/* 🎯 ส่วนแสดงโพสต์ต้นทาง */}
        <div className="bg-white dark:bg-[#1A241A] p-4 border-b dark:border-green-900/20 shadow-sm mb-2">
          <div className="flex items-center gap-3 mb-3">
            <img src={post.authorPhoto || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div>
              <h3 className="font-bold text-sm">{post.authorName}</h3>
              <p className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString('th-TH')}</p>
            </div>
          </div>
          {post.caption && <p className="text-sm mb-3 whitespace-pre-wrap">{post.caption}</p>}
          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0D140D]">
              <img src={post.imageUrl} className="w-full object-cover max-h-[400px]" alt="Post" />
            </div>
          )}
        </div>

        {/* 🎯 ส่วนแสดงรายการคอมเมนต์ */}
        <div className="p-4 space-y-4">
          {commentsList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีคอมเมนต์ เป็นคนแรกที่คอมเมนต์สิ!</p>
          ) : (
            commentsList.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                <img src={comment.userPhoto || "/api/placeholder/40/40"} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border dark:border-green-900/30" alt="" />
                <div className="flex-1 bg-white dark:bg-[#1A241A] border dark:border-green-900/20 shadow-sm rounded-2xl p-3 rounded-tl-none">
                  <h4 className="font-bold text-xs mb-1 text-gray-900 dark:text-gray-200">{comment.userName}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {new Date(comment.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 🎯 ช่องพิมพ์คอมเมนต์ (ยึดติดขอบล่าง) */}
      <footer className="fixed bottom-[60px] md:bottom-0 left-0 w-full bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20 p-3 z-40">
        <div className="max-w-xl mx-auto flex gap-3 items-center">
          <img src={currentUser?.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
          <form onSubmit={handleComment} className="flex-1 flex gap-2 bg-gray-100 dark:bg-[#1A241A] rounded-full px-4 py-2 border dark:border-green-900/30">
            <input 
              type="text" 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder="แสดงความคิดเห็น..." 
              className="flex-1 bg-transparent outline-none text-sm" 
              required
            />
            <button type="submit" disabled={!newComment.trim()} className="text-green-500 disabled:opacity-30 active:scale-90 transition-transform">
              <Send size={18} />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}