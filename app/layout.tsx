import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Serif, Manrope } from "next/font/google";
import { SiteNav } from "@/components/ui/SiteNav";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = DM_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Runs before first paint, so the sky theme and Safety Car never flash, and returning
// visitors and deep links never see the start screen. The sky follows the visitor's clock
// until they choose for themselves.
const earlyModesScript = `(function(){var d=document.documentElement;try{var sky=localStorage.getItem("sp75-sky")||"golden";if(sky==="day")d.dataset.day="1";if(sky==="golden")d.dataset.golden="1";var calm=matchMedia("(prefers-reduced-motion: reduce)").matches,saved=localStorage.getItem("sp75-safety");if(saved==="1"||(saved===null&&calm))d.dataset.safety="1";if(d.dataset.safety||calm||sessionStorage.getItem("sp75-lights")||location.hash)d.dataset.lights="done"}catch(e){d.dataset.golden="1";d.dataset.lights="done"}})()`;

export const metadata: Metadata = {
  title: {
    default: `${profile.name} | #${profile.number}`,
    template: `%s | ${profile.name}`,
  },
  description: profile.summary,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: `${profile.name} Portfolio`,
    title: `${profile.name} | #${profile.number}`,
    description: profile.summary,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: earlyModesScript }} />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
