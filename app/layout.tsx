import type { Metadata } from "next";
// 🎯 1. เปลี่ยนจาก Inter เป็น IBM_Plex_Sans_Thai
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";
import NotificationListener from "@/components/NotificationListener";
import CustomNotiPrompt from "@/components/CustomNotiPrompt";

// 🎯 2. ตั้งค่าฟอนต์
const ibmPlex = IBM_Plex_Sans_Thai({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ibung",
  description: "ไอจีเก้",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="th">
      {/* 🎯 3. เรียกใช้ ibmPlex.className ตรง body */}
      <body className={`${ibmPlex.className} bg-gray-50 dark:bg-[#0A0F0A] text-slate-900 dark:text-slate-100 antialiased`}>
        <AuthProvider>
          <NotificationListener />
          <CustomNotiPrompt />
          <div className="pb-20"> 
            {children}
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
