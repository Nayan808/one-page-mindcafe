import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700"] });
const serifItalic = Instrument_Serif({
  variable: "--font-serif-italic",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});
const body = Inter({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "feelz by mindcafé — order",
  description: "A paper-thin strip. Sixty seconds on the tongue. Four moods, on demand — delivered or picked up at a Zostel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serifItalic.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <Providers>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
