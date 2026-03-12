import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

const CLICKABLE_SELECTOR = [
    'button',
    'a[href]',
    'a[onclick]',
    '[onclick]',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    'select[onchange]',
].join(',');

function getTextSnippet(el) {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > 60 ? text.slice(0, 57) + '…' : text;
}

function getElLabel(el) {
    const tag = el.tagName;
    const id = $(el).attr('id');
    const cls = ($(el).attr('class') || '').trim();
    const text = getTextSnippet(el);
    const attrs = [];
    if (id) attrs.push(`#${id}`);
    if (cls) attrs.push('.' + cls.split(/\s+/).slice(0, 3).join('.'));
    return `${tag}${attrs.join('')}${text ? ` — "${text}"` : ''}`;
}

function getFeatureGate(el) {
    // Returns the closest ancestor-or-self gate info
    let cur = el;
    while (cur) {
        const gate = $(cur).attr('data-feature');
        const gateDisabled = $(cur).attr('data-feature-disabled');
        const inverse = $(cur).attr('data-feature-inverse') != null;
        if (gate) {
            return { type: 'data-feature', key: gate, inverse };
        }
        if (gateDisabled) {
            return { type: 'data-feature-disabled', key: gateDisabled, inverse: false };
        }
        cur = cur.parentNode;
        if (!cur || cur.type === 'root') break;
    }
    return null;
}

const clickables = [];
$(CLICKABLE_SELECTOR).each((_, el) => {
    // Ignore elements inside HTML comments (Cheerio doesn't load comments as nodes for selection)
    const label = getElLabel(el);
    const featureGate = getFeatureGate(el);

    clickables.push({
        label,
        tag: el.tagName,
        id: $(el).attr('id') || null,
        class: ($(el).attr('class') || null),
        onclick: $(el).attr('onclick') || null,
        href: $(el).attr('href') || null,
        gate: featureGate
    });
});

const total = clickables.length;
const gated = clickables.filter(c => c.gate).length;
const ungated = total - gated;

const gatesUsed = new Map();
for (const c of clickables) {
    if (!c.gate) continue;
    const k = `${c.gate.type}:${c.gate.key}${c.gate.inverse ? ':inverse' : ''}`;
    gatesUsed.set(k, (gatesUsed.get(k) || 0) + 1);
}

const ungatedExamples = clickables
    .filter(c => !c.gate)
    .slice(0, 40)
    .map(c => ({ label: c.label, onclick: c.onclick, href: c.href }));

const report = {
    htmlPath,
    selectors: CLICKABLE_SELECTOR,
    totals: { total, gated, ungated },
    gatesUsed: Array.from(gatesUsed.entries())
        .map(([k, count]) => ({ gate: k, count }))
        .sort((a, b) => b.count - a.count),
    ungatedExamples,
};

console.log(JSON.stringify(report, null, 2));
