import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movie Tracker",
  description: "Log and rate movies you've watched.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
