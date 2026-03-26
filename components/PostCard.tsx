"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, update, push, onValue } from "firebase/database";
import Link from "next/link";
import { Heart, MessageCircle, Send, MoreHorizontal, Share2, AlertTriangle } from "lucide-react";

export default function PostCard({ post }: any) {
  const currentUser = auth.currentUser;
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  // โหลดคอมเม้นต์แบบ Real-time
  useEffect(() => {
    if (!post.id) return;
    const cRef = ref(db, `posts/${post.id}/comments`);
    return onValue(cRef, s => {
      const data = s.val();
      setComments(data ? Object.values(data) : []);
    });
  }, [post.id]);

  // ระบบไลก์
  const toggleLike = () => {
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบก่อนครับ");
    const isLiked = post.likes?.[currentUser.uid];
    const updates: any = {};
    updates[`posts/${post.id}/likes/${currentUser.uid}`] = isLiked ? null : true;
    update(ref(db), updates);
  };

  // ระบบคอมเม้นต์
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบก่อนครับ");
    
    try {
      await push(ref(db, `posts/${post.id}/comments`), {
        text: commentText,
        authorName: currentUser.displayName || "ไม่ระบุชื่อ",
        timestamp: Date.now()
      });
      setCommentText("");
    } catch (err) {
      console.error(err);
      alert("คอมเม้นต์ไม่สำเร็จ ลองเช็ค Firebase Rules อีกทีครับ");
    }
  };

  // ระบบรายงาน (Report)
  const handleReport = async () => {
    if (!currentUser) return;
    if (confirm("คุณต้องการรายงานโพสต์นี้ใช่หรือไม่?")) {
      await push(ref(db, `reports`), {
        postId: post.id,
        reporterId: currentUser.uid,
        timestamp: Date.now()
      });
      alert("รับเรื่องเรียบร้อยครับ");
      setShowMenu(false);
    }
  };

  // ระบบแชร์
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${post.authorId}`;
    if (navigator.share) {
      navigator.share({ title: 'ibung', url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!");
    }
  };

  const isLiked = currentUser ? post.likes?.[currentUser.uid] : false;
  const likeCount = post.likes ? Object.keys(post.likes).length : 0;

  return (
    <div className="bg-white dark:bg-[#0D140D] rounded-3xl overflow-hidden border dark:border-green-900/20 shadow-sm transition-all hover:shadow-md mb-8">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between relative">
        <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={post.authorPhoto || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full border dark:border-green-800 object-cover" alt="" />
          <span className="font-bold text-sm dark:text-slate-200">{post.authorName}</span>
        </Link>
        
        <div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-gray-100 dark:hover:bg-green-900/30 rounded-full transition">
            <MoreHorizontal className="text-slate-400 w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-4 top-12 w-48 bg-white dark:bg-[#1A241A] border dark:border-green-900/30 rounded-2xl shadow-xl z-20 overflow-hidden">
              <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                <AlertTriangle size={16} /> รายงานโพสต์นี้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} className="w-full aspect-square md:aspect-video object-cover" alt="Post" />
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex gap-4 mb-3">
          <button onClick={toggleLike} className={`transition-transform active:scale-125 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
            <Heart className={isLiked ? 'fill-current' : ''} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-slate-400 hover:text-green-500 transition-colors">
            <MessageCircle />
          </button>
          <button onClick={handleShare} className="text-slate-400 hover:text-blue-500 transition-colors">
            <Share2 />
          </button>
        </div>
        
        {likeCount > 0 && <p className="text-xs font-bold mb-1">{likeCount} Likes</p>}
        <p className="text-sm dark:text-slate-300">
          <span className="font-bold mr-2">{post.authorName}</span>
          {post.caption}
        </p>

        {/* Comment Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t dark:border-green-900/10 animate-in slide-in-from-top-2 duration-300">
            <div className="max-h-40 overflow-y-auto space-y-3 mb-4 no-scrollbar">
              {comments.map((c, i) => (
                <div key={i} className="text-[13px] flex gap-2">
                  <span className="font-bold text-green-600 dark:text-green-400 shrink-0">{c.authorName}</span>
                  <span className="text-gray-600 dark:text-gray-300 break-words">{c.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder="เขียนคอมเม้นต์..." 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-[#1A241A] rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500/50 transition-all"
              />
              <button type="submit" className="p-2 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}