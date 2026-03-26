import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav"; // 🎯 1. Import ตรงนี้

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ibung - ig เก๊",
  description: "คู่แข่ง ig ไม่นานigเจ้งเพราะเจ้ปอเล้นไม่ได้",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-[#0A0F0A] text-slate-900 dark:text-slate-100 antialiased`}>
        
        {/* หุ้ม content เพื่อเว้นที่ว่างด้านล่าง ไม่ให้เมนูทับเนื้อหา */}
        <div className="pb-20"> 
          {children}
        </div>

        {/* 🎯 2. เรียกใช้งานแถบเมนูตรงนี้ */}
        <BottomNav />
        
      </body>
    </html>
  );
}