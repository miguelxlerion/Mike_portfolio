import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colonia Zacamil — an open air museum",
  description:
    "Zacamil is more than just buildings. An interactive flight over the largest social housing complex in El Salvador, now a living open air museum.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d0c0b] text-[#f4efe6] antialiased">{children}</body>
    </html>
  );
}
