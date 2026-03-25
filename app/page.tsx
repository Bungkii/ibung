"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, query, limitToLast } from "firebase/database";
import PostCard from "@/components/PostCard";
import { Loader2 } from "lucide-react";

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = query(ref(db, 'posts'), limitToLast(50));
    return onValue(postsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse();
        setPosts(list);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8 md:hidden">
        <h1 className="text-2xl font-bold text-green-600 font-serif">ibung</h1>
      </header>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}