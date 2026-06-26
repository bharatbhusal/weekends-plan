import { NormalizedEvent } from "@/types/event";

export interface Ingester {
	readonly id: string;
	fetch(): Promise<NormalizedEvent[]>;
}
