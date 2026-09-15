import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { TelegramProvider } from "@/components/TelegramProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "FORMA — become better, systematically",
  description:
    "Personal improvement system: diagnose → prioritize → daily actions → adapt.",
  applicationName: "FORMA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FORMA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F2F3F0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${jakarta.variable} ${instrument.variable} h-full`}>
      <body className="min-h-full antialiased">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
