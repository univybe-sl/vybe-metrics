import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import "./globals.css";

/* UniVybe brand type: Lora for body/UI, Cormorant Garamond for headings. */
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Univybe Dashboard",
  description: "Live overview of Univybe users, revenue, vybecoins and courses.",
  robots: { index: false, follow: false },
};

/** Applies the saved/system theme before paint to avoid a light→dark flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lora.variable} ${cormorant.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
