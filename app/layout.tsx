import "./globals.css";
// 🎯 นำเข้าฟอนต์จาก Google Fonts
import { IBMPlexSansThai } from 'next/font/google'
import AppWrapper from "./AppWrapper";

// 🎯 ตั้งค่าฟอนต์
const ibmPlexThai = IBMPlexSansThai({
  subsets: ['thai'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-thai', // ตั้งค่าเป็นตัวแปร CSS
})

export const metadata = {
  title: "ibung - IG เก๊",
  description: "IG ที่เจ้ปอไม่โดนแบน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 🎯 ใส่ className ของฟอนต์ที่นี่
    <html lang="th" className={`${ibmPlexThai.variable}`}>
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}