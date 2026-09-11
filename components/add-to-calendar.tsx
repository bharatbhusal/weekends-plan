"use client";

import { useState } from "react";
import {
  BellRing,
  Calendar,
  CalendarCheck,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import { NormalizedEvent } from "@/types/event";
import {
  CalendarIntent,
  CalendarTicket,
  googleCalendarUrl,
  isIntentGoing,
  isIOS,
  toICS,
} from "@/lib/calendar";
import { cn, formatEventDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface AddToCalendarProps {
  event: NormalizedEvent;
}

interface TicketFile {
  name: string;
  mime: string;
  data: string;
}

function fileToBase64(file: File): Promise<TicketFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        mime: file.type || "application/octet-stream",
        data: String(reader.result).split(",")[1] ?? "",
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadICS(event: NormalizedEvent, content: string) {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const blob = new Blob([content], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AddToCalendar({ event }: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<CalendarIntent>(
    CalendarIntent.Going,
  );
  const [ticketFile, setTicketFile] = useState<TicketFile | null>(
    null,
  );

  const handleSave = () => {
    const ticket: CalendarTicket | undefined = isIntentGoing(intent)
      ? { file: ticketFile ?? undefined }
      : undefined;
    const opts = { intent, ticket };

    if (isIntentGoing(intent) && ticketFile) {
      downloadICS(event, toICS(event, opts));
    } else if (isIOS()) {
      downloadICS(event, toICS(event, opts));
    } else {
      window.open(googleCalendarUrl(event, opts), "_blank");
    }

    setTicketFile(null);
    setOpen(false);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setTicketFile(await fileToBase64(file));
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title="Add to calendar"
          className="p-1.5 rounded-full border bg-background/80 backdrop-blur hover:bg-background transition-colors shrink-0 shadow-sm text-muted-foreground hover:text-primary"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add to calendar</DrawerTitle>
          <DrawerDescription className="px-0">
            {event.title} —{" "}
            {formatEventDate(new Date(event.startDateTime))}
          </DrawerDescription>
        </DrawerHeader>

        <div className="mx-auto w-full max-w-lg overflow-y-auto px-6 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIntent(CalendarIntent.Going)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors",
                intent === CalendarIntent.Going
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <CalendarCheck className="h-4 w-4" />
              Going
            </button>
            <button
              onClick={() => setIntent(CalendarIntent.Reminder)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors",
                intent === CalendarIntent.Reminder
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <BellRing className="h-4 w-4" />
              Reminder to register
            </button>
          </div>

          {!isIntentGoing(intent) && (
            <p className="text-xs text-muted-foreground">
              Adds «Reminder: {event.title}» with a popup 1 day
              before and the registration link. No ticket.
            </p>
          )}

          {isIntentGoing(intent) && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Ticket file (optional, PDF or image)
                </label>
                {!ticketFile ? (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-accent transition-colors">
                    <Paperclip className="h-4 w-4" />
                    Choose ticket file
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFile(e.target.files?.[0])
                      }
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 text-sm">
                      {ticketFile.name}
                    </span>
                    <button
                      onClick={() => setTicketFile(null)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                      title="Remove ticket"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Embedded in the .ics file (Apple/Android
                  calendar). Without a file opens Google Calendar.
                </p>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="px-6 pb-6">
          <Button onClick={handleSave} className="w-full">
            Save to calendar
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}