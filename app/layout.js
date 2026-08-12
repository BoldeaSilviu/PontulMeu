import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "CotaVerde - Analize fotbal pe date reale",
  description: "Analize profesioniste de fotbal fundamentate pe statistici reale: formă, xG, confruntări directe și cote. Verdicte verificabile, joacă responsabil, 18+.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CotaVerde",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0B120E",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CotaVerde" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <footer style={{
          textAlign: "center", padding: "28px 16px 36px", fontSize: 12,
          color: "var(--muted)", lineHeight: 1.8
        }}>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 6 }}>
            <a href="/termeni" style={{ color: "var(--muted2)" }}>Termeni</a>
            <a href="/confidentialitate" style={{ color: "var(--muted2)" }}>Confidențialitate</a>
          </div>
          CotaVerde {new Date().getFullYear()} · Operat de PDF 33 LLC<br />
          Analize strict informative · Joacă responsabil · 18+
        </footer>
      </body>
    </html>
  );
}
