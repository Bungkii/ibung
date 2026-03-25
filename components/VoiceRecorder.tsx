"use client";
import { useState, useRef } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// นำเข้า Icon จาก lucide-react (มีอนิเมชันตอนกำลังโหลดด้วย)
import { Mic, MicVocal, Loader2 } from "lucide-react";

interface VoiceRecorderProps {
  onVoiceReady: (url: string) => void;
}

export default function VoiceRecorder({ onVoiceReady }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsUploading(true);
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        audioChunks.current = []; 

        try {
          const audioRef = ref(storage, `voices/${Date.now()}.webm`);
          await uploadBytes(audioRef, audioBlob);
          const url = await getDownloadURL(audioRef);
          
          onVoiceReady(url);
        } catch (err) {
          console.error("Upload voice error:", err);
          alert("อัปโหลดเสียงไม่สำเร็จ");
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("กรุณาอนุญาตการเข้าถึงไมโครโฟน");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col items-center w-full my-4">
      <button 
        type="button"
        onMouseDown={startRecording} 
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isUploading}
        className={`w-full py-4 rounded-xl text-white font-bold shadow-md transition-all select-none ${
          isRecording 
            ? "bg-red-500" 
            : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {/* จัดกลุ่ม Icon และข้อความให้อยู่ตรงกลาง */}
        <div className="flex items-center justify-center gap-2">
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> กำลังอัปโหลดเสียง...</>
          ) : isRecording ? (
            <><MicVocal className="w-5 h-5 animate-pulse" /> กำลังอัด... (ปล่อยเพื่อส่ง)</>
          ) : (
            <><Mic className="w-5 h-5" /> กดค้างเพื่ออัดเสียง</>
          )}
        </div>
      </button>
    </div>
  );
}