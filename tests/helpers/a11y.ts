import AxeBuilder from '@axe-core/playwright';
import {expect, type Page} from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];
type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

function formatAxeViolations(violations: AxeViolation[]) {
    if (violations.length === 0) return 'no accessibility violations';
    return violations.map((violation) => {
        const nodes = violation.nodes
            .map((node) => `  ${node.target.join(' ')}\n    ${node.failureSummary ?? ''}`)
            .join('\n');
        return `${violation.id} [${violation.impact}] ${violation.help}\n${violation.helpUrl}\n${nodes}`;
    }).join('\n\n');
}

export async function expectNoA11yViolations(
    page: Page,
    options?: {
        include?: string | string[];
        exclude?: string | string[];
        rules?: string[];
    },
) {
    let builder = options?.rules?.length
        ? new AxeBuilder({page}).withRules(options.rules)
        : new AxeBuilder({page}).withTags(WCAG_TAGS);

    const include = options?.include
        ? (Array.isArray(options.include) ? options.include : [options.include])
        : [];
    const exclude = options?.exclude
        ? (Array.isArray(options.exclude) ? options.exclude : [options.exclude])
        : [];

    for (const selector of include) {
        builder = builder.include(selector);
    }
    for (const selector of exclude) {
        builder = builder.exclude(selector);
    }

    const results = await builder.analyze();
    expect(results.violations, formatAxeViolations(results.violations)).toEqual([]);
}

export async function expectNoContrastViolations(
    page: Page,
    options?: {include?: string | string[]; exclude?: string | string[]},
) {
    await expectNoA11yViolations(page, {
        ...options,
        rules: ['color-contrast'],
    });
}
