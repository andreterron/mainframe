import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "../components/theme-provider";
import { Sidebar } from "../components/sidebar";
import { PageHeader } from "../components/page-header";
import { Sheet } from "../components/ui/sheet";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mainframe Docs",
  description: "API aggregator for React devs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Sheet>
              <PageHeader className="grow-0" />
              <div className="flex-1 flex">
                <Sidebar />
                {children}
              </div>
            </Sheet>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
