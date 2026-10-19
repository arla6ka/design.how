import {createPlugin} from './core.mjs';

const SITE = 'https://design.how/systems/glaze';
const FOUNDATIONS = ['anti-slop', 'color', 'typography', 'space', 'radius', 'borders-and-lines', 'elevation', 'motion', 'iconography'];
const COMPONENTS = ['activity', 'alert', 'attachment', 'avatar', 'badge', 'breadcrumb', 'bulk-action-bar', 'button', 'button-group', 'card', 'chart', 'checkbox', 'chip', 'code-block', 'collapsible', 'combobox', 'command', 'conversation', 'copy-button', 'data-grid', 'data-list', 'date-picker', 'dialog', 'dropdown-menu', 'empty-state', 'field', 'filter-bar', 'input', 'item', 'json-view', 'kbd', 'log-viewer', 'mention', 'message', 'number-input', 'otp-input', 'pagination', 'panel', 'popover', 'progress', 'prompt-input', 'radio-group', 'reasoning', 'relative-time', 'response', 'segmented-control', 'select', 'send-button', 'sheet', 'skeleton', 'slider', 'status', 'steps', 'switch', 'table', 'tabs', 'textarea', 'timeline', 'toast', 'tool-call', 'tooltip', 'truncate'];

const PRESSABLE = new Set(['Button', 'CopyButton', 'SendButton', 'Toggle', 'SegmentedControlItem', 'Switch', 'Checkbox', 'Radio', 'RadioGroupItem']);
const PRESSABLE_ROLE = /^(?:button|switch|checkbox|radio|tab|menuitemcheckbox|menuitemradio)$/;
const GLASS = /^(?:glass(?:-ink|-coral|-green|-paper)?|glaze-sm)$/;
const PRIMARY = new Set(['primary', 'destructive', 'confirm']);
const GROUP = /(?:Card|Footer|Actions|Toolbar|ButtonGroup|Dialog|AlertDialog|Sheet|Popover)$/;
const GROUP_CLASS = new Set(['shell', 'shell-foot']);

const plugin = createPlugin({
  name: 'glaze',
  title: 'Glaze',
  site: SITE,
  pages: {glaze: '', ...Object.fromEntries(FOUNDATIONS.map(slug => [slug, `/foundations/${slug}`])), ...Object.fromEntries(COMPONENTS.map(slug => [slug, `/components/${slug}`]))},
  docs: {
    'unknown-class': 'glaze-tokens-only', 'no-raw-color': 'glaze-tokens-only', 'no-arbitrary-value': 'space-grid', 'no-inline-style': 'glaze-tokens-only',
    'no-dynamic-class': 'glaze-tokens-only', 'no-dark-variant': 'color-roles-only', 'no-caps': 'anti-slop-no-caps', 'no-transition-all': 'motion-name-properties',
    'no-outline-none': 'glaze-focus-ink', 'no-gradient': 'anti-slop-no-decoration', 'no-native-control': 'glaze-components-first', 'field-label': 'glaze-components-first',
    'no-restyle': 'glaze-components-first', 'one-primary': 'button-one-primary', 'no-emoji-or-em-dash': 'anti-slop-no-emoji',
    'dialog-controlled': 'anti-slop-dialog-controlled', 'no-side-rail': 'anti-slop-no-side-rail', 'skeleton-still': 'motion-one-loop',
    'no-scroll-reveal': 'anti-slop-no-scroll-reveal', 'no-second-icon-set': 'iconography-one-source',
  },
  roles: {text: ['text-1', 'text-2', 'text-3'], bg: ['page', 'paper', 'shell', 'field'], line: ['line-faint', 'line', 'line-control'], other: ['text-1', 'paper', 'line-faint']},
  examples: {text: 'text-text-1', muted: 'text-text-2', surface: 'bg-paper', tint: 'bg-fail-tint', selected: 'bg-pressed'},
  tracking: ['heading', 'label', 'body', 'normal'],
  hints: {
    font: 'a type-* role such as type-heading or type-label, which carries its own weight',
    textSize: 'a type-* role such as type-body, type-body-sm, type-label or type-caption',
    caps: 'and let the type-* role set the tracking',
    white: 'text on ink is text-text-inverse',
    focusRing: 'Glaze\'s 2px ink :focus-visible ring',
    duration: 'duration-(--dur-state)',
    gradient: {description: 'No gradients; the glass on pressables is Glaze\'s only one.', use: 'a flat role such as bg-paper, and Button for the glass'},
  },
  natives: ui => ({button: `Button from '${ui}/button'`, textarea: `Textarea from '${ui}/textarea'`, select: `Select from '${ui}/select'`,
    dialog: `Dialog or Sheet from '${ui}/'`, checkbox: `Checkbox from '${ui}/checkbox'`, radio: `RadioGroup from '${ui}/radio-group'`,
    range: `Slider from '${ui}/slider'`, file: `Attachment from '${ui}/attachment'`, input: `Input from '${ui}/input' inside a Field`}),
  restyle: {
    sized: ['Skeleton', 'ScrollArea'],
    controls: ['Button', 'CopyButton', 'Input', 'Textarea', 'SelectTrigger', 'ComboboxInput', 'Chip', 'Badge', 'Avatar', 'Switch', 'Checkbox',
      'RadioGroupItem', 'SegmentedControl', 'SegmentedControlItem', 'Slider', 'TabsList', 'TabsTrigger', 'Progress', 'Kbd', 'SendButton'],
  },
  overlays: ['Dialog', 'Sheet', 'AlertDialog'],
  appOnly: ['glass-on-pressables'],

  rules: kit => {
    const {meta, classRule, elementTokens, elementName, attribute, stringOf, hasSpread, ownImports} = kit;
    const jsx = node => node?.type === 'JSXElement' || node?.type === 'JSXFragment';

    return {
      'one-primary': {
        meta: meta('At most one primary Button (ink, coral or green glass) in a card, footer, dialog or any group of actions; every other action beside it is flat (secondary).', 'button-one-primary'),
        create(context) {
          let imports;
          const counts = new Map();
          const message = 'A second primary Button in this group; primary, destructive and confirm are one glass family and a card, footer, dialog or row of actions leads with one of them, so make this one variant="secondary" (flat).';
          const parentOf = element => {
            const path = [];
            let child = element;
            for (let p = element.parent; p; child = p, p = p.parent) {
              if (jsx(p)) return {parent: p, branch: path.join('|')};
              if (p.type === 'ConditionalExpression') { if (child === p.test) return undefined; path.push(`${p.range[0]}${child === p.consequent ? 'c' : 'a'}`); continue; }
              if (['JSXExpressionContainer', 'LogicalExpression', 'ParenthesizedExpression'].includes(p.type)) continue;
              return undefined;
            }
            return undefined;
          };
          const groupOf = element => {
            for (let p = element.parent; p; p = p.parent) {
              if (p.type !== 'JSXElement') continue;
              const opening = p.openingElement;
              const name = elementName(opening);
              if (name && GROUP.test(imports.get(name)?.imported ?? name)) return p;
              if (elementTokens(context.sourceCode, opening).some(({c}) => !c.variants.length && GROUP_CLASS.has(c.base))) return p;
            }
            return undefined;
          };
          const count = key => { const n = (counts.get(key) ?? 0) + 1; counts.set(key, n); return n; };
          return {
            JSXOpeningElement(node) {
              imports ??= ownImports(context);
              if (imports.get(elementName(node))?.imported !== 'Button') return;
              const variant = attribute(node, 'variant');
              if (variant ? !PRIMARY.has(stringOf(variant)) : hasSpread(node)) return;
              const element = node.parent;
              const at = parentOf(element);
              const group = groupOf(element);
              const siblings = at ? count(`p${at.parent.range[0]}:${at.branch}`) : 0;
              const inGroup = group ? count(`g${group.range[0]}:${at?.branch ?? ''}`) : 0;
              if (siblings > 1 || inGroup > 1) context.report({node, message});
            },
          };
        },
      },

      'no-shadow': classRule(meta('No shadows: depth is drawn inside the shape, and an overlay lifts with a 1px ring.', 'elevation-no-shadows'), c => {
        const root = c.root ?? '';
        const base = c.base;
        const named = /^(?:shadow|inset-shadow|drop-shadow|text-shadow)$/.test(root) && !['none', 'transparent', 'current', 'inherit'].includes(c.value ?? '') && !c.modifier;
        const bare = ['shadow', 'drop-shadow', 'inset-shadow'].includes(base);
        const raw = /^\[(?:box-shadow|text-shadow|filter:drop-shadow)/.test(base);
        if (!named && !bare && !raw) return undefined;
        return `"${c.utility}" casts a shadow, and Glaze has none: every shadow class draws nothing here. Lift a card with the shell, an overlay with the overlay recipe (paper and a 1px ring), and leave depth on a control to Button's glass.`;
      }),

      'glass-on-pressables': {
        meta: meta('Glass and small glaze go only on what a person presses: a button, an icon button, the selected segment, the switch, a checked box. Never on a secondary, which is the plain card surface.', 'glaze-glass-on-pressables'),
        create(context) {
          let imports;
          return {
            JSXOpeningElement(node) {
              imports ??= ownImports(context);
              const glass = elementTokens(context.sourceCode, node).find(({c}) => GLASS.test(c.base));
              if (!glass) return;
              const name = elementName(node) ?? '';
              if (stringOf(attribute(node, 'variant')) === 'secondary') {
                context.report({loc: glass.loc, message: `"${glass.c.utility}" puts glass on a secondary; only the primary family is glass, and the secondary is the plain card surface (paper, the panel's hairline, text-1). Drop the glass, or make this the group's one primary.`});
                return;
              }
              const lower = /^[a-z]/.test(name);
              const role = stringOf(attribute(node, 'role')) ?? '';
              const pressable = lower ? name === 'button' || PRESSABLE_ROLE.test(role) : PRESSABLE.has(imports.get(name)?.imported ?? name);
              if (pressable) return;
              context.report({loc: glass.loc, message: `"${glass.c.utility}" puts glass on a <${name}>, which nobody presses; glass is the sign that something can be pressed. Keep it flat, on bg-paper, the shell or the field recipe, and use Button for the action.`});
            },
          };
        },
      },

      'no-status-dot': {
        meta: meta('No status dots: a glyph and a word. A small round fill or ring marks nothing a word or a glyph cannot.', 'anti-slop-no-status-dots'),
        create(context) {
          const SMALL = /^(?:0\.5|1|1\.5|2|2\.5)$/;
          const quiet = new Set(['current', 'transparent', 'inherit', '']);
          return {
            JSXOpeningElement(node) {
              const all = elementTokens(context.sourceCode, node).filter(({c}) => !c.variants.length);
              const round = all.find(({c}) => c.base === 'rounded-full' || c.base === 'rounded-pill');
              if (!round) return;
              const small = (root, piece) => all.some(t => t.c.root === root && !t.c.modifier && SMALL.test(t.c.value ?? '') && (!piece || t.piece === piece));
              const square = all.some(t => t.c.root === 'h' && small('h', t.piece) && small('w', t.piece));
              if (!small('size') && !square) return;
              const filled = all.some(({c}) => c.root === 'bg' && !c.arbitrary && !quiet.has(c.value ?? ''));
              const ringed = all.some(({c}) => c.root === 'border' && !c.arbitrary && !quiet.has(c.value ?? '') && !/^\d/.test(c.value ?? ''));
              if (!filled && !ringed) return;
              context.report({loc: round.loc, message: `"${round.c.utility}" on a sub-8px box in a role colour draws a status dot, which says only that something is there. Show a status with Status (a glyph and a word), a count as a number, today with a hairline underline.`});
            },
          };
        },
      },

      'mono-roles': classRule(meta('Set mono through its roles: mono inline, at 0.8 of the text around it, a type-code role beside sans, or type-code-block in a block.', 'typography-mono-scale'), c => {
        if (c.base !== 'font-mono') return undefined;
        return `"${c.utility}" sets Glaze Mono at the sans size, where its wider letters look a size bigger; use mono inside a line of text (0.8 of the size around it, same line height) or type-code, type-code-sm or type-code-xs for mono beside sans, or type-code-block for a block of code.`;
      }),
    };
  },
});

plugin.configs.app.rules['glaze/one-primary'] = 'error';

export default plugin;
