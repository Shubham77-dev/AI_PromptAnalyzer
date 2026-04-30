import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/app/_components/ToasterProvider";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageMetaProvider } from "@/components/layout/PageMetaProvider";
import { RootShell } from "@/components/layout/RootShell";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Library",
  description: "Prompt Library with AI Rating System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser().catch(() => null);
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F9F9F7] text-zinc-950">
        <AuthProvider initialEmail={user?.email ?? null}>
          <PageMetaProvider>
            <RootShell>
              <main>{children}</main>
            </RootShell>
          </PageMetaProvider>
        </AuthProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
