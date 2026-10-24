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
      className="max-[359px]:gap-1! max-[359px]:px-2! flex-1 whitespace-nowrap"
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
      className="max-[359px]:gap-1! max-[359px]:px-2! flex-1 whitespace-nowrap"
      onClick={askChatGPT}
    >
      <ChatGptIcon aria-hidden="true" className="size-5" />
      Ask ChatGPT
    </Button>
  );
}
