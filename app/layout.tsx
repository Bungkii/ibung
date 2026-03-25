import "./globals.css";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import AppWrapper from "./AppWrapper";

const ibmPlexThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-thai",
});

export const metadata = {
  title: "ibung - ig เก๊",
  description: "คู่แข่ง ig ไม่นานigเจ้งเพราะเจ้ปอเล้นไม่ได้",
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