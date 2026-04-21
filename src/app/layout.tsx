import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comic Studio — AI-directed comics on fal.ai",
  description:
    "Describe a story, pick a style, cast characters, get a finished comic. Powered by openai/gpt-image-2 on fal.",
  metadataBase: new URL("https://comic-studio.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bangers&family=Anton&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
