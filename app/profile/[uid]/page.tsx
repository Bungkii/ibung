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
  
  // States สำหรับแก้ไขโปรไฟล์
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // States สำหรับ Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const IMGBB_API_KEY = "fd4168dbacd1e283e3e1158bfbb36028";

  useEffect(() => {
    if (!uid) return;
    
    // ดึงข้อมูล User & Posts
    onValue(ref(db, `users/${uid}`), s => {
      const data = s.val();
      setUser(data);
      if (data) setNewName(data.displayName || "");
    });
    onValue(query(ref(db, 'posts'), orderByChild('authorId'), equalTo(uid as string)), s => {
      setPosts(s.val() ? Object.values(s.val()).reverse() : []);
    });

    // ดึงข้อมูล Follow
    onValue(ref(db, `followers/${uid}`), s => setFollowerCount(s.val() ? Object.keys(s.val()).length : 0));
    onValue(ref(db, `following/${uid}`), s => setFollowingCount(s.val() ? Object.keys(s.val()).length : 0));
    
    if (auth.currentUser) {
      onValue(ref(db, `following/${auth.currentUser.uid}/${uid}`), s => setIsFollowing(!!s.val()));
    }
  }, [uid]);

  // 🎯 ระบบฟอลโล่ (แก้ให้ทำงานได้จริง)
  const toggleFollow = async () => {
    if (!auth.currentUser || uid === auth.currentUser.uid) return;
    const myId = auth.currentUser.uid;
    const updates: any = {};
    updates[`following/${myId}/${uid}`] = isFollowing ? null : true;
    updates[`followers/${uid}/${myId}`] = isFollowing ? null : true;
    
    try {
      await update(ref(db), updates);
      setIsFollowing(!isFollowing); // บังคับให้ปุ่มเปลี่ยนสีทันที
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการติดตาม");
    }
  };

  // 🎯 ระบบเปลี่ยนโปรไฟล์
  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      let photoURL = user?.photoURL;
      if (newFile) {
        const formData = new FormData();
        formData.append("image", newFile);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const imgData = await res.json();
        if (imgData.success) photoURL = imgData.data.url;
      }
      await updateProfile(auth.currentUser, { displayName: newName, photoURL });
      await update(ref(db, `users/${auth.currentUser.uid}`), { displayName: newName, photoURL });
      setIsEditing(false); setNewFile(null);
      alert("อัปเดตโปรไฟล์เรียบร้อย!");
    } catch (err) {
      alert("อัปเดตไม่สำเร็จ เช็คการเชื่อมต่อครับ");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-500" /></div>;
  const isOwner = auth.currentUser?.uid === uid;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14 mb-16">
        <div className="relative group">
          <img src={newFile ? URL.createObjectURL(newFile) : (user.photoURL || "/api/placeholder/150/150")} className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-green-900 shadow-2xl object-cover" alt="Profile" />
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer">
              <Camera className="text-white w-8 h-8" />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {isEditing ? (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-green-900/30 p-1 rounded-xl">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-transparent px-3 py-1 outline-none font-bold w-40" />
                <button onClick={handleUpdateProfile} disabled={isUpdating} className="p-2 bg-green-500 text-white rounded-lg">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => {setIsEditing(false); setNewFile(null);}} className="p-2 bg-gray-200 text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <div className="flex gap-3">
                  {isOwner ? (
                    <>
                      <button onClick={() => setIsEditing(true)} className="px-6 py-1.5 bg-white dark:bg-green-900 border dark:border-green-800 rounded-xl text-xs font-bold shadow-sm">แก้ไขโปรไฟล์</button>
                      <button onClick={() => auth.signOut()} className="p-2 text-red-500 rounded-xl"><LogOut size={18}/></button>
                    </>
                  ) : (
                    <button onClick={toggleFollow} className={`px-8 py-1.5 rounded-xl text-xs font-bold transition-all ${isFollowing ? 'bg-gray-200 dark:bg-green-900 text-gray-700' : 'bg-green-500 text-white shadow-lg'}`}>
                      {isFollowing ? 'ติดตามแล้ว' : 'ติดตาม'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center md:justify-start gap-8 text-sm text-gray-500">
            <span><b className="text-gray-900 dark:text-white">{posts.length}</b> โพสต์</span>
            <span><b className="text-gray-900 dark:text-white">{followerCount}</b> ผู้ติดตาม</span>
            <span><b className="text-gray-900 dark:text-white">{followingCount}</b> กำลังติดตาม</span>
          </div>
        </div>
      </div>

      <div className="border-t dark:border-green-900/20 pt-10">
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map((p: any, i) => (
            <div key={i} className="aspect-square bg-gray-100 dark:bg-green-900/10 rounded-xl overflow-hidden group">
              <img src={p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Post" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}