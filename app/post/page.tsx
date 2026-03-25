"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, X } from "lucide-react";

export default function CreatePost() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    if (!file && !caption.trim()) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=fd4168dbacd1e283e3e1158bfbb36028`, { method: "POST", body: formData });
        const data = await res.json();
        imageUrl = data.data.url;
      }
      await push(ref(db, 'posts'), {
        caption, imageUrl, authorId: auth.currentUser?.uid, authorName: auth.currentUser?.displayName,
        authorPhoto: auth.currentUser?.photoURL, timestamp: Date.now()
      });
      router.push("/");
    } catch (err) { alert("Error!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white dark:bg-[#0D140D] rounded-[2rem] p-8 shadow-sm border dark:border-green-900/20">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-green-400">สร้างโพสต์ใหม่</h2>
        {file ? (
          <div className="relative mb-6">
            <img src={URL.createObjectURL(file)} className="w-full h-80 object-cover rounded-2xl shadow-md" />
            <button onClick={() => setFile(null)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full"><X size={16} /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-green-900/30 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-green-900/10 transition-all mb-6">
            <UploadCloud size={40} className="text-green-500 mb-2" />
            <span className="text-sm text-gray-400">เลือกรูปภาพเพื่อแชร์</span>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        )}
        <textarea placeholder="เขียนอะไรบางอย่าง..." value={caption} onChange={e => setCaption(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-2xl outline-none min-h-[120px] mb-6 border dark:border-transparent focus:border-green-500 transition-all" />
        <button onClick={handlePost} disabled={loading} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "โพสต์เลย"}
        </button>
      </div>
    </div>
  );
}