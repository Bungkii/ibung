"use client";
import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
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
      // 🎯 ใช้ AppID จากโปรเจกต์ Voice & Video Call ที่แจก 10000 นาที
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
        onLeaveRoom: () => {
          router.back();
        }
      });
    };

    myMeeting(containerRef.current);
  }, [currentUser, roomId, callType, isGroup, router]);

  if (!currentUser) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>;

  return <div className="h-screen w-full bg-black"><div className="w-full h-full" ref={containerRef}></div></div>;
}