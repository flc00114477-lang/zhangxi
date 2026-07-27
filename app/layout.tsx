import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "賬析｜信用卡月結單整理助手",
  description: "上載信用卡月結單 PDF，自動整合商戶、分類消費，30 秒睇清使費去向。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="stylesheet" href="/zhangxi/restore.css?v=2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
