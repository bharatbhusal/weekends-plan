import { NormalizedEvent } from "@/types/event";

export interface Ingester {
  readonly id: string;
  fetch(config: Record<string, unknown>): Promise<NormalizedEvent[]>;
}
