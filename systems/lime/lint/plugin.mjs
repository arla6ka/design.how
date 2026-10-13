import {createPlugin} from './core.mjs';

const SITE = 'https://design.how/systems/lime';

export default createPlugin({
  name: 'lime',
  title: 'Lime',
  site: SITE,
  pages: {lime: '', 'anti-slop': '/foundations/anti-slop', color: '/foundations/color', typography: '/foundations/typography',
    motion: '/foundations/motion', iconography: '/foundations/iconography', spacing: '/foundations/spacing', skeleton: '/components/skeleton'},
  docs: {
    'unknown-class': 'lime-tokens-only', 'no-raw-color': 'lime-tokens-only', 'no-arbitrary-value': 'spacing-scale-only', 'no-inline-style': 'lime-tokens-only',
    'no-dynamic-class': 'lime-tokens-only', 'no-dark-variant': 'color-roles-only', 'no-caps': 'anti-slop-no-caps', 'no-transition-all': 'motion-properties',
    'no-outline-none': 'lime-focus', 'no-gradient': 'anti-slop-no-decoration', 'no-native-control': 'lime-components-first', 'field-label': 'lime-field-label',
    'no-restyle': 'lime-components-first', 'one-primary': 'lime-one-action', 'no-emoji-or-em-dash': 'lime-sentence-case',
    'dialog-controlled': 'anti-slop-dialog-controlled', 'no-side-rail': 'anti-slop-no-side-rail', 'skeleton-still': 'skeleton-still',
    'no-scroll-reveal': 'anti-slop-no-scroll-reveal', 'no-second-icon-set': 'iconography-one-source',
  },
  roles: {text: ['fg', 'fg-2', 'fg-3'], bg: ['page', 'surface', 'surface-2'], line: ['line', 'line-strong', 'accent-line'], other: ['fg', 'surface', 'line']},
  examples: {text: 'text-fg', muted: 'text-fg-3', surface: 'bg-surface', tint: 'bg-success-tint', selected: 'bg-accent-wash'},
  tracking: ['tight', 'normal'],
  hints: {
    font: 'font-semibold for headings, font-medium for controls and labels, font-normal for the rest',
    caps: 'and use tracking-tight only on text-xl and larger',
    white: 'text on lime is text-on-accent, on ink text-fg-inverse',
    focusRing: 'Lime\'s 2px olive :focus-visible ring',
    duration: 'duration-(--dur-fast)',
    gradient: {description: 'No gradients; the glow is Lime\'s only one.', use: 'a flat role such as bg-surface, and the Button primary variant for the one glow'},
  },
  natives: ui => ({button: `Button from '${ui}/button'`, textarea: `Textarea from '${ui}/textarea'`, select: `Select from '${ui}/select'`,
    dialog: `Dialog, AlertDialog or Sheet from '${ui}/'`, checkbox: `Checkbox from '${ui}/checkbox'`, radio: `Radio from '${ui}/radio'`,
    range: `Slider from '${ui}/slider'`, file: `Dropzone from '${ui}/dropzone'`, input: `Input from '${ui}/input' inside a Field`}),
  restyle: {
    sized: ['Skeleton', 'ScrollArea'],
    controls: ['Button', 'CopyButton', 'Input', 'Textarea', 'SelectTrigger', 'ComboboxInput', 'Chip', 'Badge', 'Avatar', 'Switch', 'Checkbox',
      'Radio', 'Segmented', 'SegmentedItem', 'Keypad', 'Slider', 'Amount', 'Balance', 'TabsList', 'TabsTrigger', 'ToolbarButton', 'ToolbarToggle', 'ChatInput', 'Progress'],
  },
  primary: {description: 'One lime primary action per view.', message: 'A second primary Button in this view; keep one lime action and make the others solid, secondary, outline or ghost.'},
  appOnly: ['no-money-sign', 'lime-scarce'],

  rules: ({meta, elementName, elementTokens}) => ({
    'lime-scarce': {
      meta: meta('Lime fills the one primary action, never a surface.', 'lime-lime-scarce'),
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name = elementName(node);
            if (!name || !/^[a-z]/.test(name)) return;
            for (const {c, loc} of elementTokens(context.sourceCode, node)) {
              if (/^bg-accent(?:-hover|-active)?$/.test(c.base)) context.report({loc, message: `"${c.utility}" fills a <${name}> with lime; lime is for the primary Button. Use bg-accent-wash for a chosen row, bg-surface for a panel.`});
            }
          },
        };
      },
    },

    'section-heading': {
      meta: meta('A section heading is a real heading at text-lg.', 'lime-section-heading'),
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name = elementName(node);
            if (!/^h[2-6]$/.test(name ?? '')) return;
            for (const {c, loc} of elementTokens(context.sourceCode, node)) {
              if (c.variants.length || !['text-xs', 'text-sm', 'label', 'caption'].includes(c.base)) continue;
              context.report({loc, message: `<${name}> set at ${c.base} reads as a small label; head a section with an h2 at text-lg font-semibold in text-fg, or drop the heading.`});
            }
          },
        };
      },
    },

    'no-money-sign': {
      meta: meta('Format amounts with formatAmount or Amount, never by hand.', 'lime-money-sign'),
      create(context) {
        const message = 'A currency sign built by hand; use formatAmount(value) for text or <Amount value={value}/> from \'@/components/lime/ui/amount\', which bring the minus, separators and tabular figures.';
        return {
          TemplateLiteral(node) {
            node.expressions.forEach((expr, i) => { if (/\$$/.test(node.quasis[i].value.cooked ?? '')) context.report({node: expr, message}); });
          },
          JSXExpressionContainer(node) {
            const kids = node.parent?.children;
            const before = kids?.[kids.indexOf(node) - 1];
            if (before?.type === 'JSXText' && /\$$/.test(before.value) && node.expression.type !== 'JSXEmptyExpression') context.report({node, message});
          },
        };
      },
    },
  }),
});
