"use client";

import { useState } from "react";
import { FaApple, FaBell, FaCalendar, FaCalendarCheck, FaGoogle } from "react-icons/fa";
import { NormalizedEvent } from "@/types/event";
import {
  CalendarIntent,
  isIntentGoing,
  toAppleCalendar,
  toGoogleCalendar,
} from "@/lib/calendar";
import { cn, formatEventDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
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

function downloadICSFile(event: NormalizedEvent, content: string) {
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

  const close = () => setOpen(false);

  const handleAppleCalendar = () => {
    downloadICSFile(event, toAppleCalendar(event, intent));
    close();
  };

  const handleGoogleCalendar = () => {
    window.open(toGoogleCalendar(event, intent), "_blank");
    close();
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title="Add to calendar"
          className="p-1.5 rounded-full border bg-background/80 backdrop-blur hover:bg-background transition-colors shrink-0 shadow-sm text-muted-foreground hover:text-primary"
        >
          <FaCalendar className="h-3.5 w-3.5" />
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
              <FaCalendarCheck className="h-4 w-4" />
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
              <FaBell className="h-4 w-4" />
              Reminder to register
            </button>
          </div>

          {!isIntentGoing(intent) && (
            <p className="text-xs text-muted-foreground">
              Adds «Reminder: {event.title}» with a popup 1 day
              before and the registration link.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Pick one export: Apple Calendar or Google Calendar.
          </p>
        </div>

        <DrawerFooter className="px-6 pb-6">
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button onClick={close} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleAppleCalendar}
              className="gap-1.5"
            >
              <FaApple className="h-4 w-4" />
              Apple Calendar
            </Button>
          </div>
          <Button
            onClick={handleGoogleCalendar}
            variant="outline"
            className="w-full gap-1.5"
          >
            <FaGoogle className="h-4 w-4" />
            Google Calendar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}