export interface NormalizedEvent {
	_id: string;
	title: string;
	description: string;
	startDateTime: Date;
	endDateTime?: Date;
	location: {
		name: string;
		address?: string;
		coordinates?: { lat: number; lng: number };
		city?: string;
	};
	sourceName: string;
	originalUrl: string;
	imageUrl?: string;
	category: string;
	tags?: string[];
	updatedAt: Date;
}

export type IngestType = "API" | "ICS" | "RSS" | "SCRAPE";

export interface SourceConfig {
	id: string;
	name: string;
	type: IngestType;
	enabled: boolean;
}
