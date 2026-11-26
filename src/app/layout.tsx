import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { BarraSuperior } from "@/components/auth/BarraSuperior";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma Aula · Sketch Doodle Art",
  description: "Plataforma educativa Sketch Doodle Art + Minimalism Kidcore",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#FEFEFA] font-sans text-[#123850] antialiased">
        <AuthProvider>
          <BarraSuperior />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
