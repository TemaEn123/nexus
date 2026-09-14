import AxeBuilder from "@axe-core/playwright";
import { test as base } from "@playwright/test";

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

type AxeFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

type AxeViolations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];

/** Короткий дайджест: в fail Playwright показывает id и html, не весь отчёт axe. */
export function axeViolationDigest(violations: AxeViolations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.html),
  }));
}

/**
 * Общий AxeBuilder: WCAG 2.0/2.1 A+AA, без best-practice/AAA.
 * Exclude — чужой UI, не `disableRules` на свой. Скан во время drag — в спеке, не здесь.
 * a11y-спеки импортируют `test`/`expect` отсюда, не из `@playwright/test`.
 */
export const test = base.extend<AxeFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page })
        .withTags([...AXE_TAGS])
        .exclude(".tsqd-parent-container")
        .exclude("nextjs-portal"),
    );
  },
});

export { expect } from "@playwright/test";
