"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

class PersianDate extends Date {
  constructor(...args: ConstructorParameters<typeof Date>) {
    super(...args);
  }

  toLocaleDateString = () => super.toLocaleDateString('fa-IR-u-nu-latn');
  getParts = () => this.toLocaleDateString().split("/")
  getDay = () => super.getDay() === 6 ? 0 : super.getDay() + 1
  getDate = () => parseInt(this.getParts()[2]);
  getMonth = () => parseInt(this.getParts()[1]) - 1;
  getYear = () => this.getParts()[0];
  getMonthName = () => super.toLocaleDateString("fa-IR", { month: 'long' });
  getDayName = () => super.toLocaleDateString("fa-IR", { weekday: 'long' });
}

function formatPersianDate(date: Date): string {
  const persianDate = new PersianDate(date);
  return `${persianDate.getDate()} ${persianDate.getMonthName()} ${persianDate.getYear()}`;
}

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  setDate,
  placeholder = "انتخاب تاریخ",
  className,
  disabled = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-right font-normal",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {date ? (
            <div className="flex flex-col items-start">
              <span className="persian-number text-sm">{formatPersianDate(date)}</span>
              {/* <span className="text-xs text-muted-foreground">{format(date, "yyyy/MM/dd")}</span> */}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerProps extends DatePickerProps {
  showTime?: boolean
  time?: string
  setTime?: (time: string) => void
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "انتخاب تاریخ و زمان",
  className,
  disabled = false,
  showTime = true,
  time = "",
  setTime,
}: DateTimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setTime) {
      setTime(e.target.value);
    }
  }

  return (
    <div className="flex flex-row space-x-2">
      <DatePicker
        date={date}
        setDate={setDate}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        className={cn(className, showTime ? "w-2/3" : "w-full")}
      />
      {showTime && setTime && (
        <div className="flex items-center">
          <input
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="persian-number flex h-4.5 w-full shadow rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}