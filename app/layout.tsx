import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
	title: "Weekends Plan — Event Aggregator",
	description:
		"Discover events across India — aggregated from Luma, FOSS, and more. Find tech meetups, workshops, and community events in your city.",
	openGraph: {
		title: "Weekends Plan — Event Aggregator",
		description:
			"Discover events across India — aggregated from Luma, FOSS, and more. Find tech meetups, workshops, and community events in your city.",
		siteName: "Weekends Plan",
		type: "website",
		locale: "en_IN",
	},
	twitter: {
		card: "summary_large_image",
		title: "Weekends Plan — Event Aggregator",
		description:
			"Discover events across India — aggregated from Luma, FOSS, and more. Find tech meetups, workshops, and community events in your city.",
	},
	icons: {
		apple: "/icon.png",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
