import type { Metadata } from "next";
import { Bodoni_Moda, Figtree } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: "italic",
  weight: "400",
  variable: "--font-petrona",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { absolute: "Lately" },
  description: "Lately",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodoni.variable} ${figtree.variable}`}>
      <body className="bg-[#ece6e8] font-sans text-black">{children}</body>
    </html>
  );
}
