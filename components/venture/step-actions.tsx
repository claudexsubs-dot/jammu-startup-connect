import { SubmitButton } from "@/components/form";

export function StepActions({ last = false }: { last?: boolean }) {
  return (
    <div className="actions">
      <SubmitButton name="intent" value="next" pendingText="Saving…">
        {last ? "Save and finish" : "Save and continue"}
      </SubmitButton>
      <SubmitButton name="intent" value="save" variant="secondary" pendingText="Saving…">
        Save draft
      </SubmitButton>
    </div>
  );
}
