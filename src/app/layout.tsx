import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "万元实盘投资挑战赛",
  description: "真金白银，排名对决",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-surface-950 text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
