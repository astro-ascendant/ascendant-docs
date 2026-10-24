import { FilePdfIcon } from "@phosphor-icons/react";
import { Button } from "@/components/arc/button/button";
import { ChatGptIcon } from "@/components/chart/chatgpt-icon";
import { useChartSession } from "@/components/chart/context";

export function ChartSavePdfButton() {
  const {
    actions: { savePdf },
  } = useChartSession();
  return (
    <Button
      type="button"
      variant="secondary"
      className="flex-1 whitespace-nowrap sm:flex-none"
      onClick={savePdf}
    >
      <FilePdfIcon aria-hidden="true" className="size-5" />
      Save as PDF
    </Button>
  );
}

export function ChartAskChatGPTButton() {
  const {
    actions: { askChatGPT },
  } = useChartSession();
  return (
    <Button
      type="button"
      variant="primary"
      className="flex-1 whitespace-nowrap sm:flex-none"
      onClick={askChatGPT}
    >
      <ChatGptIcon aria-hidden="true" className="size-5" />
      Ask ChatGPT
    </Button>
  );
}
