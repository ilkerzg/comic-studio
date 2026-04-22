import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comic Studio — AI-directed comics on fal.ai",
  description:
    "Describe a story, pick a style, cast characters, get a finished comic. Powered by openai/gpt-image-2 on fal.",
  metadataBase: new URL("https://comic-studio.vercel.app"),
  applicationName: "Comic Studio",
  appleWebApp: {
    capable: true,
    title: "Comic Studio",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#17161c",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Comic Studio" />
      </head>
      <body>{children}</body>
    </html>
  );
}
