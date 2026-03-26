"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Loader2 } from "lucide-react";

function CallRoom() {
  const searchParams = useSearchParams();
  const roomID = searchParams.get("room");
  const containerRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // รอยืนยันตัวตน และหาห้องให้เจอ
    if (!roomID || !auth.currentUser || !containerRef.current || joined) return;

    const initCall = async () => {
      // 🎯 ใส่ App ID กับ ServerSecret ของพี่ตรงนี้
      const appID = 534081230; 
      const serverSecret = "989779f053c976fd8755052020d93f16"; 

      // สร้าง Token สำหรับเข้าห้อง
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        auth.currentUser!.uid,
        auth.currentUser!.displayName || "User"
      );

      // เริ่มสร้างหน้าจอโทร...

      // เริ่มสร้างหน้าจอโทร
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // โหมดโทร 1 ต่อ 1
        },
        showPreJoinView: false, // ปิดหน้าเช็คกล้องก่อนเข้า เข้าห้องเลย
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        onLeaveRoom: () => {
          // วางสายปุ๊บ เด้งกลับหน้าแชท
          window.location.href = '/chat'; 
        }
      });
      setJoined(true);
    };

    initCall();
  }, [roomID, joined]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative">
      <div ref={containerRef} className="w-full h-full max-w-4xl mx-auto shadow-2xl" />
    </div>
  );
}

// 🎯 ห่อ Suspense ไว้กัน Vercel ด่างอแงแบบรอบที่แล้ว
export default function CallPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>}>
      <CallRoom />
    </Suspense>
  );
}