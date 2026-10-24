import { FilePdfIcon } from "@phosphor-icons/react";
import { Button } from "@/components/arc/button/button";
import { SplitButton } from "@/components/arc/split-button/split-button";
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
      className="w-full max-[359px]:gap-1! max-[359px]:px-2! whitespace-nowrap sm:w-auto"
      onClick={savePdf}
    >
      <FilePdfIcon aria-hidden="true" className="size-5" />
      Save as PDF
    </Button>
  );
}

export function ChartAskChatGPTButton() {
  const {
    actions: { askAI },
  } = useChartSession();
  return (
    <SplitButton
      label="Ask ChatGPT"
      onClick={() => askAI("chatgpt")}
      icon={<ChatGptIcon aria-hidden="true" className="size-5" />}
      className="w-full sm:w-auto"
      actions={[
        { label: "Ask Claude", onSelect: () => askAI("claude") },
        { label: "Ask Gemini", onSelect: () => askAI("gemini") },
      ]}
    />
  );
}
