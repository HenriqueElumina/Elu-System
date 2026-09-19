import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elu System",
  description: "Sistema interno da Elumina Partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
