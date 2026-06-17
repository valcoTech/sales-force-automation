import "@/app/globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Sales Order PBF",
  description: "Aplikasi management sales order PBF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
