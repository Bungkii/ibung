"use client";
import { auth, db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";

export default function PostCard({ post }: any) {
  const currentUser = auth.currentUser;
  const isLiked = currentUser ? post.likes?.[currentUser.uid] : false;
  const likeCount = post.likes ? Object.keys(post.likes).length : 0;

  const toggleLike = () => {
    if (!currentUser) return;
    const updates: any = {};
    updates[`posts/${post.id}/likes/${currentUser.uid}`] = isLiked ? null : true;
    update(ref(db), updates);
  };

  return (
    <div className="bg-white dark:bg-[#0D140D] rounded-3xl overflow-hidden border dark:border-green-900/20 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3">
          <img src={post.authorPhoto || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full border dark:border-green-800 object-cover" alt="" />
          <span className="font-bold text-sm dark:text-slate-200">{post.authorName}</span>
        </Link>
        <MoreHorizontal className="text-slate-400 w-5 h-5 cursor-pointer" />
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
          <MessageCircle className="text-slate-400 cursor-pointer hover:text-green-500" />
        </div>
        
        {likeCount > 0 && <p className="text-xs font-bold mb-1">{likeCount} Likes</p>}
        <p className="text-sm dark:text-slate-300">
          <span className="font-bold mr-2">{post.authorName}</span>
          {post.caption}
        </p>
      </div>
    </div>
  );
}