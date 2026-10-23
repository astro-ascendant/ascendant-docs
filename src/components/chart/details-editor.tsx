import { useEffect } from "react";
import { Chart } from "@/components/chart";
import { useChartSession } from "@/components/chart/context";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const TITLE = "Enter Birth Details";

/** One form, two shapes: the same fields and action in either overlay. */
function DetailsFields() {
  return (
    <div className="flex flex-col gap-4">
      <Chart.NameField />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Chart.DateField />
        <Chart.TimeField />
      </div>
      <Chart.SexField />
      <Chart.PlaceField />
    </div>
  );
}

/**
 * Birth-details editor. A centred dialog on pointer-first screens and a
 * bottom drawer on touch-first screens, matching the shadcn responsive
 * overlay pattern for Base UI.
 */
export function ChartDetailsEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const {
    state: { status },
  } = useChartSession();

  // Calculating is the user's signal to dismiss; the result updates behind.
  useEffect(() => {
    if (open && status === "calculating") {
      onOpenChange(false);
    }
  }, [open, status, onOpenChange]);

  // Reflect the open overlay in the document title, and restore on close.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.title;
    document.title = `${TITLE} - Ascendant`;
    return () => {
      document.title = previous;
    };
  }, [open]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{TITLE}</DrawerTitle>
          </DrawerHeader>
          <DetailsFields />
          <DrawerFooter>
            <Chart.CalculateButton />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
        </DialogHeader>
        <DetailsFields />
        <DialogFooter>
          <Chart.CalculateButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
