import * as React from "react";
import type { ReactNode } from "react";
import { parseDate } from "chrono-node";
import { CalendarBlankIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { CityPicker } from "@/components/chart/city-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChart } from "@/components/chart/context";

export function ChartFormFrame({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function ChartNameField() {
  const {
    state: { birth, savedProfiles, fieldErrors },
    actions: { updateBirth, applyProfile },
  } = useChart();
  const error = fieldErrors.name;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="chart-name">Name</Label>
      <Input
        id="chart-name"
        type="text"
        placeholder="e.g. Harini"
        autoComplete="off"
        list="chart-saved-names"
        value={birth.name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "chart-name-error" : undefined}
        onChange={(event) => {
          const value = event.target.value;
          updateBirth({ name: value });
          applyProfile(value);
        }}
        className="rounded-md"
      />
      <datalist id="chart-saved-names">
        {savedProfiles.map((profile) => (
          <option key={profile.name} value={profile.name} />
        ))}
      </datalist>
      <FieldError id="chart-name-error" message={error} />
    </div>
  );
}

function parseBirthDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toBirthDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBirthDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ChartDateField() {
  const {
    state: { birth, fieldErrors },
    actions: { updateBirth },
  } = useChart();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => formatBirthDate(parseBirthDate(birth.date)));
  React.useEffect(() => {
    setText(formatBirthDate(parseBirthDate(birth.date)));
  }, [birth.date]);
  const preview = text.trim() === "" ? undefined : (parseDate(text) ?? undefined);
  const today = new Date();
  const error = fieldErrors.date;

  const commitText = () => {
    if (preview) {
      updateBirth({ date: toBirthDateString(preview) });
      setText(formatBirthDate(preview));
    } else {
      setText(formatBirthDate(parseBirthDate(birth.date)));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="chart-date">Birth date</Label>
      <InputGroup className="rounded-md">
        <InputGroupInput
          id="chart-date"
          value={text}
          placeholder="23 Jul 2003"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "chart-date-error" : undefined}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={<InputGroupButton size="icon-xs" variant="ghost" aria-label="Select date" />}
            >
              <CalendarBlankIcon aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
              <Calendar
                mode="single"
                selected={preview}
                onSelect={(date) => {
                  if (date) {
                    updateBirth({ date: toBirthDateString(date) });
                    setText(formatBirthDate(date));
                    setOpen(false);
                  }
                }}
                captionLayout="dropdown"
                startMonth={new Date(today.getFullYear() - 120, today.getMonth())}
                endMonth={today}
                disabled={{ after: today }}
                defaultMonth={preview ?? new Date(today.getFullYear() - 30, today.getMonth())}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id="chart-date-error" message={error} />
    </div>
  );
}

export function ChartTimeField() {
  const {
    state: { birth, fieldErrors },
    actions: { updateBirth },
  } = useChart();
  const error = fieldErrors.time;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="chart-time">Birth time</Label>
      <Input
        id="chart-time"
        type="time"
        step="1"
        value={birth.time}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "chart-time-error" : undefined}
        onChange={(event) => updateBirth({ time: event.target.value })}
        className="appearance-none rounded-md [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-calendar-picker-indicator]:[display:none]"
      />
      <FieldError id="chart-time-error" message={error} />
    </div>
  );
}

const SEX_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "", label: "Prefer not to say" },
] as const;

export function ChartSexField() {
  const {
    state: { birth },
    actions: { updateBirth },
  } = useChart();
  const selected = birth.sex ?? "";
  return (
    <fieldset className="m-0 flex flex-col border-0 p-0">
      <legend className="mb-1.5 text-sm font-medium">Gender</legend>
      <div className="bg-input/50 grid min-h-9 grid-cols-3 gap-1 rounded-full p-1">
        {SEX_OPTIONS.map((option) => {
          const checked = selected === option.value;
          return (
            <label
              key={option.label}
              className={`flex cursor-pointer items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight transition-colors focus-within:ring-2 focus-within:ring-ring ${
                checked
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name="chart-sex"
                value={option.value}
                checked={checked}
                onChange={() =>
                  updateBirth({
                    sex: option.value === "" ? undefined : (option.value as "Male" | "Female"),
                  })
                }
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ChartPlaceField() {
  const {
    state: { selectedPlace, placeOptions, searchError, fieldErrors },
    actions: { queryPlaces, selectPlace },
  } = useChart();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const error = fieldErrors.place;
  React.useEffect(() => {
    if (selectedPlace !== null) {
      setQuery(selectedPlace.name);
    }
  }, [selectedPlace]);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="chart-place">Birth place</Label>
      <CityPicker
        value={selectedPlace}
        options={placeOptions}
        open={open}
        query={query}
        invalid={Boolean(error)}
        describedBy={error ? "chart-place-error" : undefined}
        onOpenChange={setOpen}
        onQueryChange={(value) => {
          setQuery(value);
          queryPlaces(value);
        }}
        onSelect={(option) => {
          selectPlace(option);
          setQuery(option.name);
          setOpen(false);
        }}
      />
      <FieldError id="chart-place-error" message={error} />
      {searchError !== "" ? (
        <Alert variant="destructive">
          <AlertTitle>Place search</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function ChartCalculateButton() {
  const {
    state: { status },
    actions: { calculate },
  } = useChart();
  const busy = status === "calculating";
  return (
    <Button type="button" disabled={busy} aria-busy={busy} onClick={calculate} className="w-fit">
      {busy ? <CircleNotchIcon className="motion-safe:animate-spin" aria-hidden="true" /> : null}
      Calculate chart
    </Button>
  );
}
