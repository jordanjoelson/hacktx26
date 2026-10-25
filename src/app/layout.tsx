import type { Metadata } from "next";
import { Inter, Petrona } from "next/font/google";
import "./globals.css";

const petrona = Petrona({
  subsets: ["latin"],
  variable: "--font-petrona",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { absolute: "Lately" },
  description: "Lately",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${petrona.variable} ${inter.variable}`}>
      <body className="bg-white font-sans text-black">{children}</body>
    </html>
  );
}
