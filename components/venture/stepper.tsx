import Link from "next/link";
import { STEP_TITLES, STEPS, type Step } from "@/lib/venture-steps";

export function Stepper({ current, done, hasStartup }: { current?: Step | "team" | "financials"; done: Record<Step, boolean>; hasStartup: boolean }) {
  return (
    <nav aria-label="Venture profile steps" className="stepper">
      <ol>
        {STEPS.map((step, index) => {
          const locked = !hasStartup && step !== "founder" && step !== "basics";
          const label = (
            <>
              <span className={`step-dot${done[step] ? " done" : ""}`} aria-hidden="true">
                {done[step] ? "✓" : index + 1}
              </span>
              <span>
                {STEP_TITLES[step]}
                {step === "traction" ? <span className="optional"> (optional)</span> : null}
                <span className="visually-hidden">{done[step] ? " (complete)" : " (not complete)"}</span>
              </span>
            </>
          );
          return (
            <li key={step}>
              {locked ? (
                <span className="step-link locked" title="Save the startup basics first">
                  {label}
                </span>
              ) : (
                <Link href={`/venture/edit/${step}`} className="step-link" aria-current={current === step ? "step" : undefined}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
        <li>
          {hasStartup ? (
            <Link href="/venture/team" className="step-link" aria-current={current === "team" ? "step" : undefined}>
              <span className="step-dot" aria-hidden="true">
                👥
              </span>
              <span>Team</span>
            </Link>
          ) : (
            <span className="step-link locked">Team</span>
          )}
        </li>
        <li>
          {hasStartup ? (
            <Link href="/venture/financials" className="step-link" aria-current={current === "financials" ? "step" : undefined}>
              <span className="step-dot" aria-hidden="true">
                ₹
              </span>
              <span>
                Financials <span className="optional">(optional, private)</span>
              </span>
            </Link>
          ) : (
            <span className="step-link locked">Financials</span>
          )}
        </li>
      </ol>
    </nav>
  );
}
