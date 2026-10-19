import { MapPin } from "@phosphor-icons/react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { PlaceOption } from "@/lib/place";

interface CityPickerProps {
  value: PlaceOption | null;
  options: PlaceOption[];
  open: boolean;
  query: string;
  invalid?: boolean;
  describedBy?: string;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (option: PlaceOption) => void;
}

function subline(option: PlaceOption): string {
  return [option.region, option.country].filter(Boolean).join(", ");
}

export function CityPicker({
  value,
  options,
  open,
  query,
  invalid = false,
  describedBy,
  onOpenChange,
  onQueryChange,
  onSelect,
}: CityPickerProps) {
  return (
    <Combobox
      items={options}
      filter={null}
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onSelect(next);
        }
      }}
      inputValue={query}
      onInputValueChange={(next) => onQueryChange(next)}
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      itemToStringValue={(option) => option.name}
      itemToStringLabel={(option) => option.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxInput
        id="chart-place"
        placeholder="e.g. Satyamangalam"
        className="rounded-md"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <ComboboxContent positionMethod="fixed" collisionPadding={16} side="top">
        <ComboboxList>
          {(option: PlaceOption) => (
            <ComboboxItem key={option.id} value={option}>
              <MapPin className="me-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{option.name}</div>
                {subline(option) !== "" ? (
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    {subline(option)}
                  </div>
                ) : null}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
