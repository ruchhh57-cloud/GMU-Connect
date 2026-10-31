import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMU Connect | Campus Portal",
  description: "A unified student and faculty campus management portal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}