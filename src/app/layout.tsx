import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export const metadata: Metadata = {
  title: "Seabliss Beach Resort | Exclusive Beachfront Villas in Lian, Batangas",
  description:
    "An ultra-private coastal sanctuary spanning 2,750+ sqm in Lian, Batangas. Luxury beachfront villas with private plunge pools, direct ocean access, and discreet island hospitality.",
  icons: {
    icon: "/images/branding/logo.svg",
    apple: "/images/branding/logo.png",
  },
};

// A worker left on a reused localhost origin can serve another app's cached chunks.
// Keep this independent of React so it can run even when those chunks fail to load.
const resetDevelopmentWorker = `(async function () {
  if (!('serviceWorker' in navigator)) return;
  try {
    var registrations = await navigator.serviceWorker.getRegistrations();
    var removed = await Promise.all(registrations.map(function (registration) { return registration.unregister(); }));
    if (removed.some(Boolean) && navigator.serviceWorker.controller) location.reload();
  } catch (error) {
    console.warn('Could not retire a stale development service worker', error);
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-seabliss-linen text-seabliss-charcoal selection:bg-seabliss-teal selection:text-white">
        {process.env.NODE_ENV === 'development' && <script id="seabliss-development-worker-reset" dangerouslySetInnerHTML={{ __html: resetDevelopmentWorker }} />}
        {children}
      </body>
    </html>
  );
}
