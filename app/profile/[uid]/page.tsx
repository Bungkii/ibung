"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { useParams } from "next/navigation";
import { Grid, LogOut, Settings } from "lucide-react";

export default function ProfilePage() {
  const { uid } = useParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    onValue(ref(db, `users/${uid}`), s => setUser(s.val()));
    const pRef = query(ref(db, 'posts'), orderByChild('authorId'), equalTo(uid as string));
    onValue(pRef, s => {
      const data = s.val();
      setPosts(data ? Object.values(data).reverse() : []);
    });
  }, [uid]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16 px-6">
        <img src={user.photoURL} className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-green-900 shadow-xl object-cover" />
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            {auth.currentUser?.uid === uid && (
              <div className="flex gap-2">
                <button className="px-6 py-1.5 bg-white dark:bg-green-900 border rounded-lg text-sm font-bold shadow-sm">แก้ไขโปรไฟล์</button>
                <button onClick={() => auth.signOut()} className="p-2 text-red-500"><LogOut size={20}/></button>
              </div>
            )}
          </div>
          <div className="flex justify-center md:justify-start gap-8 text-sm">
            <span><b>{posts.length}</b> โพสต์</span>
            <span><b>0</b> ผู้ติดตาม</span>
            <span><b>0</b> กำลังติดตาม</span>
          </div>
        </div>
      </div>

      <div className="border-t dark:border-green-900/20 pt-10">
        <div className="flex justify-center gap-10 mb-8 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span className="flex items-center gap-2 text-green-600 border-t-2 border-green-600 pt-2"><Grid size={14}/> Posts</span>
        </div>
        <div className="grid grid-cols-3 gap-1 md:gap-4 px-1">
          {posts.map((p: any, i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-green-900/20 rounded-lg overflow-hidden group relative">
              <img src={p.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}