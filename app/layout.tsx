import "./globals.css";
// 🎯 แก้ไขการ Import ให้ชื่อตรงตามที่ Library กำหนด
import { IBM_Plex_Sans_Thai } from "next/font/google";
import AppWrapper from "./AppWrapper";

// 🎯 ปรับ Subsets ให้มี 'latin' ควบคู่กับ 'thai' เสมอ
const ibmPlexThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-thai",
});

export const metadata = {
  title: "ibung - Minimal Social App",
  description: "Share your moments in a clean way",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${ibmPlexThai.variable}`}>
      <body className="font-sans antialiased bg-[#F9FAFB] dark:bg-[#0A0F0A]">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}