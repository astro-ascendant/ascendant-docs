import { ChatGptIcon } from "@/components/chart/chatgpt-icon";
import { useChart } from "@/components/chart/context";
import { Button } from "@/components/ui/button";

export function ChartSavePdfButton() {
  const {
    actions: { savePdf },
  } = useChart();
  return (
    <Button
      type="button"
      variant="secondary"
      className="flex-1 whitespace-nowrap sm:flex-none"
      onClick={savePdf}
    >
      Save as PDF
    </Button>
  );
}

export function ChartAskChatGPTButton() {
  const {
    actions: { askChatGPT },
  } = useChart();
  return (
    <Button
      type="button"
      variant="inverted"
      className="flex-1 whitespace-nowrap sm:flex-none"
      onClick={askChatGPT}
    >
      <ChatGptIcon data-icon="inline-start" aria-hidden="true" className="size-5" />
      Ask ChatGPT
    </Button>
  );
}
