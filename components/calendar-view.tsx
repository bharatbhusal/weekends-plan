"use client"

import * as React from "react"
import { DayPicker, DayProps } from "react-day-picker"
import { NormalizedEvent } from "@/types/event"
import { cn } from "@/lib/utils"
import { isSameDay, startOfDay } from "date-fns"

interface CalendarViewProps {
  events: NormalizedEvent[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onSelectEvent: (event: NormalizedEvent) => void
  onSelectDayEvents: (date: Date, events: NormalizedEvent[]) => void
}

export function CalendarView({
  events,
  currentMonth,
  onMonthChange,
  onSelectEvent,
  onSelectDayEvents,
}: CalendarViewProps) {
  
  // Helper to determine if an event occurs on a specific day (checks both start and span to end)
  const isEventOnDay = React.useCallback((event: NormalizedEvent, day: Date) => {
    const eventStart = startOfDay(new Date(event.startDateTime))
    const targetDay = startOfDay(day)
    
    if (isSameDay(eventStart, targetDay)) {
      return true
    }
    
    if (event.endDateTime) {
      const eventEnd = startOfDay(new Date(event.endDateTime))
      return targetDay >= eventStart && targetDay <= eventEnd
    }
    
    return false
  }, [])

  // Custom Day Cell Component
  const CustomDay = React.useCallback(({ date, displayMonth }: DayProps) => {
    const isOutside = date.getMonth() !== displayMonth.getMonth()
    const isToday = isSameDay(date, new Date())
    
    // Filter events scheduled for this cell's date
    const dayEvents = events.filter((e) => isEventOnDay(e, date))

    const handleCellClick = () => {
      if (dayEvents.length > 0) {
        onSelectDayEvents(date, dayEvents)
      }
    }

    return (
      <div
        onClick={handleCellClick}
        className={cn(
          "w-full h-full p-1.5 flex flex-col justify-between text-left transition-colors select-none",
          dayEvents.length > 0 ? "cursor-pointer hover:bg-accent/40" : "cursor-default",
          isToday && "bg-accent/20",
          isOutside && "opacity-40 bg-muted/5"
        )}
      >
        <span
          className={cn(
            "text-xs font-semibold px-1 py-0.5 rounded-md inline-block w-fit",
            isToday && "bg-primary text-primary-foreground font-bold"
          )}
        >
          {date.getDate()}
        </span>

        {/* Desktop View: Show up to 3 event titles, truncated, plus "+n" */}
        <div className="hidden md:flex flex-col gap-1 mt-1.5 w-full overflow-hidden">
          {dayEvents.slice(0, 3).map((event) => (
            <button
              key={event._id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectEvent(event)
              }}
              className="text-[10px] leading-tight text-left bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 rounded truncate w-full transition-colors border border-primary/5 font-medium"
              title={event.title}
            >
              {event.title}
            </button>
          ))}
          {dayEvents.length > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectDayEvents(date, dayEvents)
              }}
              className="text-[9px] leading-none text-left bg-muted hover:bg-muted/80 text-muted-foreground px-1.5 py-1 rounded font-bold border w-full transition-colors"
            >
              +{dayEvents.length - 3} more
            </button>
          )}
        </div>

        {/* Mobile View: Small Indicator Dots for Events */}
        <div className="flex md:hidden gap-1 mt-1 justify-center flex-wrap max-w-full overflow-hidden py-0.5">
          {dayEvents.slice(0, 3).map((event) => (
            <span
              key={event._id}
              className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-fade-in"
            />
          ))}
          {dayEvents.length > 3 && (
            <span className="text-[8px] leading-none font-bold text-muted-foreground select-none">
              +
            </span>
          )}
        </div>
      </div>
    )
  }, [events, isEventOnDay, onSelectEvent, onSelectDayEvents])

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm p-4 overflow-x-auto">
      <DayPicker
        mode="single"
        month={currentMonth}
        onMonthChange={onMonthChange}
        disableNavigation
        className="p-0 w-full min-w-[320px]"
        classNames={{
          months: "w-full",
          month: "w-full space-y-4",
          caption: "hidden", // We use external pagination title instead
          table: "w-full border-collapse",
          head_row: "flex w-full mb-1",
          head_cell: "text-muted-foreground rounded-md w-[14.28%] font-medium text-xs text-center py-2 bg-muted/20 border-b border-border",
          row: "flex w-full",
          cell: "w-[14.28%] min-h-[64px] md:min-h-[110px] p-0 relative border-b border-r border-border last:border-r-0 [&:has([aria-selected])]:bg-accent/10 focus-within:relative focus-within:z-20",
          day: "w-full h-full p-0 flex flex-col justify-stretch items-stretch",
          day_today: "",
          day_outside: "day-outside",
          day_selected: "",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        components={{
          Day: CustomDay,
        }}
      />
    </div>
  )
}
