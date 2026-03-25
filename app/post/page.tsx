"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { ref as dbRef, push } from "firebase/database";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";

export default function CreatePost() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const currentUser = auth.currentUser;

  // 🔑 ใส่ API Key ของพี่ไว้ตรงนี้ที่เดียว
  const IMGBB_API_KEY = "fd4168dbacd1e283e3e1158bfbb36028"; 

  const handlePost = async () => {
    if (!file && !caption.trim()) return;
    setIsUploading(true);

    try {
      let imageUrl = null;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        // 🚀 เรียกใช้ตัวแปร IMGBB_API_KEY
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          imageUrl = data.data.url; 
        } else {
          throw new Error("ImgBB upload failed");
        }
      }

      await push(dbRef(db, 'posts'), {
        caption,
        imageUrl,
        authorId: currentUser?.uid,
        authorName: currentUser?.displayName,
        authorPhoto: currentUser?.photoURL,
        timestamp: Date.now()
      });

      router.push("/");
    } catch (error) {
      console.error(error);
      alert("โพสต์ไม่สำเร็จ ลองเช็ค API Key อีกทีครับ");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col bg-white dark:bg-green-950">
      <h2 className="text-2xl font-bold mb-6 text-green-600 dark:text-green-400 text-center font-serif">ibung</h2>
      
      <div className="flex-1 flex flex-col gap-4">
        {file && (
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-64 object-cover rounded-xl border-2 border-green-500 shadow-md" />
        )}

        <label className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-8 text-center cursor-pointer hover:bg-green-50 dark:hover:bg-green-900 transition flex flex-col items-center">
          <UploadCloud className="w-10 h-10 text-green-500 mb-2" />
          <span className="text-green-600 dark:text-green-400 font-bold">{file ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        <textarea 
          placeholder="เขียนแคปชันครับผม..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-4 border dark:border-green-800 rounded-xl bg-gray-50 dark:bg-green-900 dark:text-white outline-none focus:ring-2 focus:ring-green-400 min-h-[120px]"
        />
      </div>

      <button 
        onClick={handlePost} 
        disabled={isUploading}
        className="mt-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition w-full shadow-lg flex justify-center items-center gap-2"
      >
        {isUploading ? <><Loader2 className="animate-spin" /> กำลังแชร์...</> : "แชร์โพสต์"}
      </button>
    </div>
  );
}