/** @type {import('next').NextConfig} */
const config = {
	experimental: {
		serverComponentsExternalPackages: [
			"node-ical",
			"feedparser",
		],
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*",
			},
		],
	},
};

export default config;
