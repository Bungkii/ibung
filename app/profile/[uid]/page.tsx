"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, equalTo, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { useParams } from "next/navigation";
import { Grid, LogOut, Camera, Loader2, Check, X } from "lucide-react";

export default function ProfilePage() {
  const { uid } = useParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔑 API Key เดิมของพี่
  const IMGBB_API_KEY = "fd4168dbacd1e283e3e1158bfbb36028"; 

  useEffect(() => {
    if (!uid) return;
    // 🎯 ดึงข้อมูล User จาก Database (ชัวร์กว่าดึงจาก Auth อย่างเดียว)
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (s) => {
      const data = s.val();
      setUser(data);
      if (data) setNewName(data.displayName || "");
    });

    // ดึงโพสต์ของ User คนนี้
    const pRef = query(ref(db, 'posts'), orderByChild('authorId'), equalTo(uid as string));
    onValue(pRef, s => {
      const data = s.val();
      setPosts(data ? Object.values(data).reverse() : []);
    });
  }, [uid]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      let photoURL = user.photoURL;

      // 1. ถ้ามีการเลือกรูปใหม่ ให้ส่งไป ImgBB
      if (newFile) {
        const formData = new FormData();
        formData.append("image", newFile);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body: formData,
        });
        const imgData = await res.json();
        if (imgData.success) photoURL = imgData.data.url;
      }

      // 2. อัปเดตใน Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: newName,
        photoURL: photoURL
      });

      // 3. อัปเดตใน Realtime Database (เพื่อให้คนอื่นเห็นด้วย)
      await update(ref(db, `users/${auth.currentUser.uid}`), {
        displayName: newName,
        photoURL: photoURL
      });

      setIsEditing(false);
      setNewFile(null);
      alert("อัปเดตโปรไฟล์เรียบร้อยครับ!");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" /></div>;

  const isOwner = auth.currentUser?.uid === uid;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in duration-700">
      
      {/* --- Profile Header --- */}
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14 mb-16">
        <div className="relative group">
          <img 
            src={newFile ? URL.createObjectURL(newFile) : (user.photoURL || "https://via.placeholder.com/150")} 
            className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-green-900 shadow-2xl object-cover transition-transform group-hover:scale-105" 
            alt="Profile"
          />
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {isEditing ? (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-green-900/30 p-1 rounded-xl border dark:border-green-800">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-transparent px-3 py-1 outline-none font-bold text-lg w-40"
                />
                <button onClick={handleUpdateProfile} disabled={isUpdating} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => {setIsEditing(false); setNewFile(null);}} className="p-2 bg-gray-200 dark:bg-green-800 text-gray-600 dark:text-gray-300 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
                {isOwner && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-1.5 bg-white dark:bg-green-900 border dark:border-green-800 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                      แก้ไขโปรไฟล์
                    </button>
                    <button onClick={() => auth.signOut()} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                      <LogOut size={18}/>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
            <span><b className="text-gray-900 dark:text-white">{posts.length}</b> โพสต์</span>
            <span><b className="text-gray-900 dark:text-white">0</b> ผู้ติดตาม</span>
            <span><b className="text-gray-900 dark:text-white">0</b> กำลังติดตาม</span>
          </div>
        </div>
      </div>

      {/* --- Posts Grid --- */}
      <div className="border-t dark:border-green-900/20 pt-10">
        <div className="flex justify-center gap-10 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          <span className="flex items-center gap-2 text-green-600 border-t-2 border-green-600 pt-3 -mt-[41px]">
            <Grid size={14}/> POSTS
          </span>
        </div>
        
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-6 px-1">
            {posts.map((p: any, i) => (
              <div key={i} className="aspect-square bg-gray-100 dark:bg-green-900/10 rounded-2xl overflow-hidden group relative shadow-sm border dark:border-green-900/10">
                <img 
                  src={p.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt="Post"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">ดูโพสต์</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Grid className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-sm">ยังไม่มีโพสต์ในขณะนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}