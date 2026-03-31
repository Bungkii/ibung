"use client";
import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; // 🎯 นำเข้า db
import { ref, push } from "firebase/database"; // 🎯 นำเข้าคำสั่ง push
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Loader2 } from "lucide-react";

export default function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const callType = searchParams.get("type") || "video"; 
  const isGroup = searchParams.get("isGroup") === "true";
  const currentUser = auth.currentUser;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || !containerRef.current) return;

    const myMeeting = async (element: HTMLDivElement) => {
      const appID = 534081230;
      const serverSecret = "989779f053c976fd8755052020d93f16";

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        currentUser.uid,
        currentUser.displayName || "User"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: element,
        sharedLinks: [{ name: 'คัดลอกลิงก์', url: window.location.href }],
        scenario: {
          mode: isGroup ? ZegoUIKitPrebuilt.GroupCall : ZegoUIKitPrebuilt.OneONoneCall,
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: callType === "video",
        showMyCameraToggleButton: callType === "video",
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        
        // 🎯 ฟังก์ชันตอนกดปุ่มวางสายสีแดง!
        onLeaveRoom: async () => {
          try {
            // เช็คว่าเป็นวิดีโอหรือเสียง
            const endText = callType === "video" ? "สิ้นสุดวิดีโอคอลแล้ว" : "สิ้นสุดการโทรด้วยเสียงแล้ว";
            const chatRef = isGroup ? ref(db, `groupChats/${roomId}`) : ref(db, `chats/${roomId}`);
            
            // ยิงข้อความบอกว่าวางสายลงในแชท!
            await push(chatRef, {
              type: 'call_end', // 🎯 กำหนดประเภทเป็นสายจบแล้ว
              text: endText,
              senderId: currentUser.uid,
              senderName: currentUser.displayName,
              timestamp: Date.now()
            });
          } catch (err) {
            console.error("ส่งข้อความวางสายไม่สำเร็จ", err);
          }
          
          router.back(); // วาร์ปกลับหน้าแชท
        }
      });
    };

    myMeeting(containerRef.current);
  }, [currentUser, roomId, callType, isGroup, router]);

  if (!currentUser) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>;

  return <div className="h-screen w-full bg-black"><div className="w-full h-full" ref={containerRef}></div></div>;
}
