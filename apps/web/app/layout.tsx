import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";
export const metadata: Metadata = { title: "AcademyOS", description: "The operations desk for modern schools and academies." };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="en" suppressHydrationWarning><body><AppProviders>{children}</AppProviders></body></html>; }
