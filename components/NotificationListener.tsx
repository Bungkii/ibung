"use client";
import { useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onChildAdded, remove } from "firebase/database";

export default function NotificationListener() {
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const notifRef = ref(db, `notifications/${user.uid}`);
        onChildAdded(notifRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            if (Notification.permission === "granted") {
              new Notification(`ข้อความใหม่จาก ${data.senderName}`, {
                body: data.text,
                icon: data.senderPhoto || "/favicon.ico",
              });
            }
            remove(ref(db, `notifications/${user.uid}/${snapshot.key}`));
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}