import { FilePdfIcon } from "@phosphor-icons/react";
import { Button } from "@/components/arc/button/button";
import { SplitButton } from "@/components/arc/split-button/split-button";
import { ChatGptIcon } from "@/components/chart/chatgpt-icon";
import { useChartSession } from "@/components/chart/context";
import { ClaudeAiIcon } from "@/components/ui/svgs/claudeAiIcon";
import { Gemini } from "@/components/ui/svgs/gemini";

export function ChartSavePdfButton() {
  const {
    actions: { savePdf },
  } = useChartSession();
  return (
    <Button
      type="button"
      variant="secondary"
      className="max-[399px]:gap-1! max-[399px]:px-2! flex-none whitespace-nowrap"
      onClick={savePdf}
    >
      <FilePdfIcon aria-hidden="true" className="size-5 max-[399px]:size-4" />
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
      icon={
        <ChatGptIcon aria-hidden="true" className="size-5 max-[399px]:size-4" />
      }
      className="min-w-0 flex-1 sm:flex-none"
      actions={[
        {
          label: "Ask Claude",
          icon: <ClaudeAiIcon aria-hidden="true" className="size-4" />,
          onSelect: () => askAI("claude"),
        },
        {
          label: "Ask Gemini",
          icon: <Gemini aria-hidden="true" className="size-4" />,
          onSelect: () => askAI("gemini"),
        },
      ]}
    />
  );
}
