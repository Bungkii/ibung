"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, X, Send } from "lucide-react";
import Link from "next/link";

export default function CreatePostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [postType, setPostType] = useState<'post' | 'story'>('post'); // เลือกว่าจะลงโพสต์หรือสตอรี่
  const router = useRouter();

  // API Key ของ ImgBB (ดึงมาจากตอนทำโปรไฟล์)
  const IMGBB_API_KEY = "fd4168dbacd1e283e3e1158bfbb36028";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return alert("กรุณาเลือกรูปภาพก่อนครับ!");
    
    setIsUploading(true);
    try {
      // 1. อัปโหลดรูปไปที่ ImgBB
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { 
        method: "POST", 
        body: formData 
      });
      const imgData = await res.json();
      
      if (!imgData.success) throw new Error("อัปโหลดรูปไม่สำเร็จ");
      const imageUrl = imgData.data.url;

      const user = auth.currentUser;
      const userName = user.displayName || "ไม่ระบุชื่อ";
      const userPhoto = user.photoURL || "/api/placeholder/40/40";

      // 2. บันทึกลง Firebase Database ตามประเภทที่เลือก
      if (postType === 'post') {
        // ลงโพสต์หน้าฟีด
        await push(ref(db, 'posts'), {
          authorId: user.uid,
          authorName: userName,
          authorPhoto: userPhoto,
          imageUrl: imageUrl,
          caption: caption,
          timestamp: Date.now()
        });
      } else {
        // ลงสตอรี่ (หายไปใน 24 ชม. ตอนดึงไปโชว์)
        await push(ref(db, 'stories'), {
          userId: user.uid,
          userName: userName,
          userPhoto: userPhoto,
          url: imageUrl,
          type: "image", // ถ้าอนาคตมีวิดีโอค่อยเปลี่ยนตรงนี้
          timestamp: Date.now()
        });
      }

      alert(postType === 'post' ? "ลงโพสต์เรียบร้อย!" : "เพิ่มสตอรี่เรียบร้อย!");
      router.push("/"); // เสร็จแล้วเด้งกลับหน้าแรก
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการโพสต์ครับ");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A] p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-xl mx-auto bg-white dark:bg-[#1A241A] rounded-[2rem] shadow-xl border dark:border-green-900/30 overflow-hidden mt-4 md:mt-10">
        
        {/* Header แถบเลือกประเภท */}
        <div className="flex border-b dark:border-green-900/30">
          <button 
            onClick={() => setPostType('post')} 
            className={`flex-1 py-4 font-bold text-sm transition-colors ${postType === 'post' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            ลงโพสต์หน้าฟีด
          </button>
          <button 
            onClick={() => setPostType('story')} 
            className={`flex-1 py-4 font-bold text-sm transition-colors ${postType === 'story' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            เพิ่มลงสตอรี่
          </button>
        </div>

        {/* ฟอร์มโพสต์ */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* ช่องเลือกรูปภาพ */}
          <div className="relative w-full aspect-square md:aspect-video bg-gray-50 dark:bg-[#0D140D] rounded-2xl border-2 border-dashed border-gray-200 dark:border-green-900/40 flex flex-col items-center justify-center overflow-hidden group">
            {file ? (
              <>
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                <button type="button" onClick={() => setFile(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-all">
                  <X size={20} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-100 dark:hover:bg-green-900/10 transition-colors">
                <ImageIcon className="w-12 h-12 text-gray-300 dark:text-green-900/50 mb-3" />
                <span className="text-sm text-gray-500 font-medium">คลิกเพื่อเลือกรูปภาพ</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          {/* ช่องพิมพ์แคปชั่น (เฉพาะลงโพสต์ปกติ) */}
          {postType === 'post' && (
            <textarea 
              placeholder="เขียนคำบรรยายภาพสักหน่อย..." 
              value={caption} 
              onChange={e => setCaption(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-[#0D140D] rounded-2xl outline-none border dark:border-transparent focus:border-green-500/50 text-sm resize-none h-24"
            />
          )}

          {/* ปุ่มส่ง */}
          <div className="flex gap-3 mt-2">
            <Link href="/" className="flex-1 py-3 text-center rounded-xl text-sm font-bold text-gray-500 bg-gray-100 dark:bg-green-900/20 hover:bg-gray-200 dark:hover:bg-green-900/40 transition-colors">
              ยกเลิก
            </Link>
            <button 
              type="submit" 
              disabled={isUploading || !file}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-green-900/50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
            >
              {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <>
                  <Send size={18} /> {postType === 'post' ? "แชร์โพสต์" : "เพิ่มลงสตอรี่"}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}