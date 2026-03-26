import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider"; // 🎯 1. นำเข้า AuthProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ibung",
  description: "Social media app for friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-[#0A0F0A] text-slate-900 dark:text-slate-100 antialiased`}>
        
        {/* 🎯 2. เอา AuthProvider มาห่อแอปทั้งหมดไว้ */}
        <AuthProvider>
          <div className="pb-20"> 
            {children}
          </div>
          <BottomNav />
        </AuthProvider>

      </body>
    </html>
  );
}