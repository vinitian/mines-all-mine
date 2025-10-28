import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import ChatContextObj from "@/components/ChatContext";
import GlobalSocket from "@/components/GlobalSocket";
import CheckAuth from "@/components/CheckAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mines, All Mine!",
  description: "Minesweeper socket programming project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <CheckAuth>
            <GlobalSocket>
              <ChatContextObj>{children}</ChatContextObj>
            </GlobalSocket>
          </CheckAuth>
        </SessionProvider>
      </body>
    </html>
  );
}
