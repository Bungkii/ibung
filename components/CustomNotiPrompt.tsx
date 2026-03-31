"use client";
import { useState, useEffect } from "react";

export default function CustomNotiPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleAccept = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setShowPrompt(false);
    }
  };

  const handleDecline = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* 🎯 กล่องคลีนๆ ไม่มีโลโก้ตัว I. แล้ว */}
      <div className="bg-white dark:bg-[#1A241A] rounded-xl p-6 w-full max-w-[340px] shadow-2xl relative">
        
        <p className="text-gray-800 dark:text-gray-200 font-medium text-[15px] leading-relaxed mb-6">
          เนื่องจาก <span className="text-green-500 font-bold">ibung</span> มีความประสงค์ส่งข้อความหรือโทรแจ้งเตือน กรุณาให้ความยินยอมเพื่อรับการแจ้งเตือน
        </p>
        
        <div className="flex items-center justify-end gap-3 mt-2">
          <button 
            onClick={handleDecline} 
            className="text-[#0078D4] dark:text-[#3da0f5] font-medium text-sm px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            ไม่ยินยอม
          </button>
          <button 
            onClick={handleAccept} 
            className="bg-[#0078D4] text-white font-medium text-sm px-5 py-2 rounded hover:bg-[#006abc] transition-colors shadow-sm"
          >
            ยินยอม
          </button>
        </div>

      </div>
    </div>
  );
}
