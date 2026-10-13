import {createPlugin} from './core.mjs';

const SITE = 'https://design.how/systems/quartz';
const FOUNDATIONS = ['anti-slop', 'color', 'typography', 'elevation', 'radius', 'iconography', 'motion', 'space', 'borders-and-lines', 'grid'];
const COMPONENTS = ['button', 'field', 'skeleton', 'dialog', 'link', 'status', 'badge', 'empty-state', 'alert', 'card'];

const TROUBLE = /warn|fail|error|danger|destructive|invalid|critical|alert|reject|denied|revoked/i;
const WARM = /^(?:warn|fail|destructive)(?:-|$)/;
const HUE_FILL = /^(?:accent-(?:mark|field|tint)|warn|fail|destructive)$/;
const MONO = new Set(['font-mono', 'type-code', 'type-tag', 'type-code-sm', 'type-code-touch', 'type-code-display']);
const NUMBERISH = /^[+\-−~]?[$€£]?\d[\d.,]*\s*(?:%|ms|s|m|h|d|min|k|K|M|B|x|KB|MB|GB|TB|tokens?)?(?:\s+\d[\d.,]*\s*(?:ms|s|m|h|d|min))*$/;
const COPYABLE = /^(?:[a-z]{2,10}_[A-Za-z0-9]{6,}|sk-[A-Za-z0-9_-]{8,}|0x[0-9a-fA-F]{8,}|(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const MONO_PARTS = new Set(['CopyButton', 'CodeBlock', 'CodeEditor', 'CodeTag', 'MaskedKey', 'Timeline', 'Kbd', 'KbdGroup', 'BreadcrumbId', 'EmptyCode', 'JsonView', 'LogViewer']);
const GREY_FIELD = new Set(['bg-surface', 'bg-card', 'bg-muted']);
const WELL_ELEMENTS = new Set(['pre', 'code', 'samp', 'output', 'kbd']);
const ARROW_END = /(?:→|↗|↘|›|»|->|⟶|➜|➔)\s*$/;
const VAGUE_LINK = /^(?:learn more|read more|see more|more|click here|here|this)$/i;
const OVERLAY_ROLES = /^(?:dialog|alertdialog|menu|listbox|tooltip)$/;
const RADIUS_SCALE = /^(?:xs|sm|md|lg|xl)$/;
const INK_FILL = /^(?:ink|inverse|primary)$/;
const STRUCTURE = /^(?:h[1-6]|header|th|nav|aside|section)$/;

export default createPlugin({
  name: 'quartz',
  title: 'Quartz',
  site: SITE,
  pages: {quartz: '', ...Object.fromEntries(FOUNDATIONS.map(slug => [slug, `/foundations/${slug}`])), ...Object.fromEntries(COMPONENTS.map(slug => [slug, `/components/${slug}`]))},
  docs: {
    'unknown-class': 'quartz-tokens-only', 'no-raw-color': 'quartz-tokens-only', 'no-arbitrary-value': 'space-scale-only', 'no-inline-style': 'quartz-tokens-only',
    'no-dynamic-class': 'quartz-tokens-only', 'no-dark-variant': 'quartz-tokens-only', 'no-caps': 'anti-slop-no-caps', 'no-transition-all': 'motion-declare-transitions',
    'no-outline-none': 'quartz-keyboard', 'no-gradient': 'quartz-no-decoration', 'no-native-control': 'quartz-components-first', 'field-label': 'field-label-bound',
    'no-restyle': 'quartz-components-first', 'one-primary': 'button-one-primary', 'no-emoji-or-em-dash': 'anti-slop-no-em-dash',
    'dialog-controlled': 'dialog-controlled-not-mounted', 'no-side-rail': 'anti-slop-no-side-rail', 'skeleton-still': 'skeleton-no-sweep',
    'no-scroll-reveal': 'anti-slop-no-decorative-motion', 'no-second-icon-set': 'iconography-import',
  },
  roles: {text: ['text-1', 'text-2', 'text-3'], bg: ['page', 'surface', 'raised'], line: ['hair', 'strong', 'accent-line'], other: ['text-1', 'surface', 'hair']},
  examples: {text: 'text-text-1', muted: 'text-text-3', surface: 'well', tint: 'text-fail-text', selected: 'bg-accent-wash'},
  tracking: ['display', 'heading', 'body', 'text', 'normal'],
  hints: {
    font: 'a type-* role such as type-heading or type-label, which carries its own weight',
    textSize: 'a type-* role such as type-body, type-body-sm, type-label or type-heading',
    caps: 'and let the type-* role set the tracking',
    white: 'text on ink is text-text-inverse',
    focusRing: 'Quartz\'s 2px ink :focus-visible ring',
    duration: 'duration-(--dur-fast)',
    gradient: {description: 'No gradients; Quartz is flat.', use: 'a flat role such as bg-page'},
  },
  natives: ui => ({button: `Button from '${ui}/button'`, textarea: `Textarea from '${ui}/textarea'`, select: `Select from '${ui}/select'`,
    dialog: `Dialog or Sheet from '${ui}/'`, checkbox: `Checkbox from '${ui}/checkbox'`, radio: `RadioGroup from '${ui}/radio-group'`,
    range: `Slider from '${ui}/slider'`, file: `AttachmentDrop from '${ui}/attachment'`, input: `Input from '${ui}/input' inside a Field`}),
  restyle: {
    sized: ['Skeleton', 'ScrollArea', 'ResizablePanel', 'CodeEditor', 'LogViewer'],
    controls: ['Button', 'CopyButton', 'Input', 'InputRoot', 'Textarea', 'SelectTrigger', 'ComboboxInput', 'Chip', 'ChipButton', 'Badge', 'Avatar', 'Switch',
      'Checkbox', 'RadioGroupItem', 'SegmentedControl', 'SegmentedControlItem', 'Slider', 'TabsList', 'TabsTrigger', 'Progress', 'Kbd', 'SendButton'],
  },
  primary: {toggles: ['pressed', 'defaultPressed', 'onPressedChange'], group: 'ButtonGroup', description: 'One primary Button per view.', message: 'A second primary Button in this view; primary is the default variant, so keep one and make the others secondary or ghost.'},
  overlays: ['Dialog', 'Sheet', 'AlertDialog', 'Wizard'],
  appOnly: ['no-hue-fill', 'warm-is-trouble', 'no-status-dot', 'no-flat-shadow', 'mono-for-copyable', 'no-pill', 'type-role', 'well-only', 'one-frame', 'radius-soft-only', 'ink-is-a-hand', 'one-ink-slot'],
  warn: ['mono-for-copyable', 'no-dot-separator', 'ink-is-a-hand', 'one-ink-slot'],

  rules: kit => {
    const {meta, own, classRule, elementTokens, elementName, attribute, attrName, stringOf, ownImports, isNumber} = kit;

    const jsxElements = node => { const out = []; for (let p = node.parent; p; p = p.parent) if (p.type === 'JSXElement') out.push(p); return out; };
    const lower = name => Boolean(name && /^[a-z]/.test(name));
    const content = element => (element?.children ?? []).filter(k => !(k.type === 'JSXText' && !k.value.trim()) && !(k.type === 'JSXExpressionContainer' && k.expression.type === 'JSXEmptyExpression'));
    const textOf = element => content(element).map(k => k.type === 'JSXText' ? k.value : k.type === 'JSXExpressionContainer' && k.expression.type === 'Literal' && typeof k.expression.value === 'string' ? k.expression.value : '\u0000').join('').replace(/\s+/g, ' ').trim();
    const small = all => {
      const dim = root => all.find(({c}) => !c.variants.length && c.root === root && (isNumber(c.value) || c.value === 'px'))?.c.value;
      const fits = v => v === 'px' || (v !== undefined && Number(v) <= 3);
      const size = dim('size');
      return size !== undefined ? fits(size) : fits(dim('w')) && fits(dim('h'));
    };
    const colorFill = c => c.root === 'bg' && (own.colors.has(c.value) || kit.stock.colors.has(c.value) || Boolean(kit.rawColor(c))) && !['transparent', 'current'].includes(c.value);

    const troubleAround = (context, opening, piece) => {
      const text = node => context.sourceCode.getText(node);
      for (let n = piece?.node, child; n && n.type !== 'JSXAttribute'; child = n, n = n.parent) {
        if (n.type === 'ConditionalExpression' && child !== n.test && TROUBLE.test(text(n.test))) return true;
        if (n.type === 'LogicalExpression' && child === n.right && TROUBLE.test(text(n.left))) return true;
        if (n.type === 'Property' && child === n.value && TROUBLE.test(text(n.key))) return true;
      }
      const says = el => el.attributes.some(a => a.type === 'JSXAttribute' && !kit.isClassAttr(attrName(a)) && /^(?:data-status|status|tone|variant|severity|intent|aria-invalid|data-invalid|role|kind)$/.test(attrName(a)) && TROUBLE.test(text(a)));
      return says(opening) || jsxElements(opening).some(el => says(el.openingElement));
    };

    return {
      'no-hue-fill': {
        meta: meta('Hue never fills a region; it goes in a kind label, a chart line or the selected row.', 'color-no-hue-fills'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              const name = elementName(node);
              if (!lower(name) || !content(node.parent).length) return;
              for (const {c, loc} of elementTokens(context.sourceCode, node)) {
                if (c.root !== 'bg' || !HUE_FILL.test(c.value ?? '')) continue;
                const trouble = WARM.test(c.value);
                context.report({loc, message: `"${c.utility}" fills a <${name}> with ${trouble ? 'a trouble color' : 'a kind hue'}; ${trouble ? 'show trouble with <Status> or <Alert>, which keep the fill to the mark' : 'name the kind with <Badge kind/>, and mark a selected row with bg-accent-wash'}.`});
              }
            },
          };
        },
      },

      'warm-is-trouble': {
        meta: meta('Amber and red mean warn and fail, nothing else.', 'color-warm-is-trouble'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              const filled = lower(elementName(node)) && content(node.parent).length;
              for (const {c, loc, piece} of elementTokens(context.sourceCode, node)) {
                if (!c.root || !own.colorRoots.has(c.root) || !WARM.test(c.value ?? '') || !own.colors.has(c.value)) continue;
                if (c.root === 'bg' && filled) continue;
                if (troubleAround(context, node, piece)) continue;
                context.report({loc, message: `"${c.utility}" puts a trouble color on something that is not warn or fail; use text-text-2 or <Badge kind/>, and when it is trouble say so with data-status="warn" or a condition such as failed && '${c.utility}'.`});
              }
            },
          };
        },
      },

      'no-status-dot': {
        meta: meta('Write the status word; never a colored dot or square.', 'anti-slop-no-status-dots'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              if (!lower(elementName(node)) || content(node.parent).length) return;
              const all = elementTokens(context.sourceCode, node);
              const fill = all.find(({c}) => !c.variants.length && colorFill(c));
              if (fill && small(all)) context.report({loc: fill.loc, message: 'A colored dot carries status by hue alone, which grayscale, forced colors and screen readers lose; use <Status status="ok"/>, which writes the word.'});
            },
          };
        },
      },

      'no-flat-shadow': {
        meta: meta('Only overlays cast a shadow; everything else is flat.', 'elevation-overlays-only'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              const name = elementName(node);
              if (!lower(name)) return;
              const role = stringOf(attribute(node, 'role')) ?? '';
              const surface = stringOf(attribute(node, 'data-surface')) ?? '';
              if (OVERLAY_ROLES.test(role) || /^(?:raised|overlay)$/.test(surface)) return;
              for (const {c, loc} of elementTokens(context.sourceCode, node)) {
                if (c.root !== 'shadow' || c.value === 'none' || /^\[inset[_\s]/.test(c.value ?? '')) continue;
                const empty = ['xs', 'sm'].includes(c.value);
                context.report({loc, message: empty
                  ? `"${c.utility}" draws nothing in Quartz, and a flat <${name}> needs no lift; draw its edge with the frame utility.`
                  : `"${c.utility}" lifts a flat <${name}>; only menus, popovers, dialogs, sheets, tooltips and toasts cast shadow-overlay. Draw its edge with the frame utility.`});
              }
            },
          };
        },
      },

      'mono-for-copyable': {
        meta: meta('Mono is for code, paths, ids, keys and hashes; numbers take the data utility.', 'typography-mono-ids', 'suggestion'),
        create(context) {
          let imports;
          const isMono = opening => {
            const name = elementName(opening);
            if (['code', 'pre', 'kbd', 'samp'].includes(name) || MONO_PARTS.has(imports.get(name)?.imported) || attribute(opening, 'mono')) return true;
            return elementTokens(context.sourceCode, opening).some(({c}) => !c.variants.length && MONO.has(c.base));
          };
          return {
            JSXOpeningElement(node) {
              imports ??= ownImports(context);
              const mono = elementTokens(context.sourceCode, node).find(({c}) => !c.variants.length && MONO.has(c.base));
              const kids = content(node.parent);
              if (!mono || !kids.length || !kids.every(k => k.type === 'JSXText')) return;
              const text = textOf(node.parent);
              if (NUMBERISH.test(text)) context.report({loc: mono.loc, message: `"${mono.c.utility}" sets the number ${text} in mono, which marks what a person copies; use a type-body or type-label role with the data utility for tabular figures.`});
            },
            JSXText(node) {
              imports ??= ownImports(context);
              const text = node.value.trim();
              if (!COPYABLE.test(text)) return;
              const parent = node.parent;
              if (parent?.type !== 'JSXElement') return;
              if ([parent, ...jsxElements(parent)].some(el => isMono(el.openingElement))) return;
              context.report({node, message: `${text} reads as an id, key or hash; set it in mono with type-code-sm (or <code>), so people know it is the thing to copy.`});
            },
          };
        },
      },

      'no-arrow-link': {
        meta: meta('Link text names the place; no arrow, no Learn more.', 'anti-slop-no-arrow-links'),
        create(context) {
          let imports;
          return {
            JSXOpeningElement(node) {
              imports ??= ownImports(context);
              const name = elementName(node);
              const imported = imports.get(name)?.imported;
              const link = name === 'a' || /Link$/.test(imported ?? '') || (imported === 'Button' && stringOf(attribute(node, 'variant')) === 'link');
              if (!link) return;
              const text = textOf(node.parent).replace(/\u0000/g, '').trim();
              if (ARROW_END.test(text)) context.report({node, message: `"${text}" ends in an arrow; a screen reader reads it aloud, so drop it and let the text name where the link goes.`});
              else if (VAGUE_LINK.test(text)) context.report({node, message: `"${text}" does not say where the link goes; a screen reader's link list hears only that, so name the place, as in "Rotating API keys".`});
            },
          };
        },
      },

      'no-pill': {
        meta: meta('No pills: a box takes rounded-inner (4px), rounded-soft (6px) or rounded-frame (10px); full round is for a person.', 'radius-no-pill'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              if (!lower(elementName(node))) return;
              const all = elementTokens(context.sourceCode, node);
              const full = all.find(({c}) => !c.variants.length && c.base === 'rounded-full');
              if (!full || all.some(({c}) => c.root === 'size')) return;
              const padded = all.some(({c}) => /^(?:px|ps|pe)$/.test(c.root ?? ''));
              if (padded || textOf(node.parent)) context.report({loc: full.loc, message: '"rounded-full" makes a pill, which reads as a toggle; use <Badge> for a tag, or rounded-inner, rounded-soft or rounded-frame for a box you build. Full radius is for a person (an avatar or the presence mark), and for the radio and the switch, which have their own components.'});
            },
          };
        },
      },

      'no-dot-separator': {
        meta: meta('One element per fact; no middle dots between them.', 'anti-slop-no-dot-separator', 'suggestion'),
        create(context) {
          const message = 'A middle dot between facts is read aloud and wraps mid-fact on a phone; give each fact its own element in a flex row with a gap.';
          const check = (node, text) => { if (typeof text === 'string' && /·|\s•\s/.test(text)) context.report({node, message}); };
          const inJsx = node => node.parent?.type === 'JSXExpressionContainer' || (node.parent?.type === 'JSXAttribute' && !kit.isClassAttr(attrName(node.parent)));
          return {
            JSXText(node) { check(node, node.value); },
            Literal(node) { if (inJsx(node)) check(node, node.value); },
            TemplateLiteral(node) { if (node.parent?.type === 'JSXExpressionContainer') for (const q of node.quasis) check(q, q.value.cooked); },
          };
        },
      },

      'well-only': {
        meta: meta('The grey field is a well for code, output and read-only values; a container is a frame.', 'elevation-well-not-container'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              const name = elementName(node);
              if (!lower(name) || WELL_ELEMENTS.has(name)) return;
              for (const {c, loc} of elementTokens(context.sourceCode, node)) {
                if (c.variants.length || !GREY_FIELD.has(c.base)) continue;
                context.report({loc, message: `"${c.utility}" makes a <${name}> a grey box, and boxes stacked on the grey field read as one slab; draw the container with the frame utility, and keep the grey field for code, output or a read-only value with the well utility.`});
              }
            },
          };
        },
      },

      'one-frame': {
        meta: meta('One frame per component; split the inside with row rules or a well.', 'borders-and-lines-one-frame'),
        create(context) {
          const framed = opening => elementTokens(context.sourceCode, opening).some(({c}) => !c.variants.length && c.base === 'frame');
          return {
            JSXOpeningElement(node) {
              if (!framed(node)) return;
              if (stringOf(attribute(node, 'data-frame')) === 'ai') return;
              if (!jsxElements(node.parent).some(el => framed(el.openingElement))) return;
              const at = elementTokens(context.sourceCode, node).find(({c}) => c.base === 'frame');
              context.report({loc: at.loc, message: 'A frame inside a frame stacks two edges, so no one can tell which group a line closes; split the inside with rule-row, rule-col or a well, and keep the one frame on the component\'s root.'});
            },
          };
        },
      },

      'no-glass': classRule(meta('No glass: overlays and bars are solid.', 'elevation-no-glass'), c => {
        if (/^backdrop-(?:blur|filter|saturate)/.test(c.base)) return `"${c.utility}" blurs what is behind; use solid paper, bg-page with shadow-overlay.`;
        if (c.root === 'bg' && c.modifier && ['page', 'surface', 'raised', 'paper', 'background', 'card', 'popover'].includes(c.value)) return `"${c.utility}" lets the page show through, which pulls text under its contrast floor; use the solid ${c.base}.`;
        return undefined;
      }),

      'radius-soft-only': classRule(meta('Three corners: rounded-inner (4px) inside a control or row, rounded-soft (6px) on a control, rounded-frame (10px) on a component and an overlay; full only for a person and the radio.', 'radius-roles'), c => {
        if (c.root !== 'rounded' && !/^rounded-[se][se]?$|^rounded-[trblse]{1,2}$/.test(c.root ?? '')) return undefined;
        const v = c.value ?? '';
        if (RADIUS_SCALE.test(v) || /^\(--radius-/.test(v) || v.startsWith('[')) return `"${c.utility}" is a stock or arbitrary corner; name the role instead: rounded-inner (4px, a box inside a control or row), rounded-soft (6px, a control) or rounded-frame (10px, a component's edge or an overlay), and leave a component's own corner alone.`;
        return undefined;
      }),

      'ink-is-a-hand': {
        meta: meta('Ink fill is for the primary action (one per view), a pressed chip and a checked control; headings, landmarks and kinds stay on paper.', 'color-ink-fill', 'suggestion'),
        create(context) {
          return {
            JSXOpeningElement(node) {
              const name = elementName(node);
              if (!lower(name)) return;
              const structure = STRUCTURE.test(name);
              const kinded = Boolean(attribute(node, 'data-kind'));
              if (!structure && !kinded) return;
              const fill = elementTokens(context.sourceCode, node).find(({c}) => !c.variants.length && c.root === 'bg' && INK_FILL.test(c.value ?? ''));
              if (fill) context.report({loc: fill.loc, message: `"${fill.c.utility}" fills ${structure ? `a <${name}>` : 'an element with a kind'} with ink, and ink fill is for the primary action and checked controls; use Button for the action or InkSlot, the soft grey label, for what waits on a person, and leave headers and kinds on paper.`});
            },
          };
        },
      },

      'one-ink-slot': {
        meta: meta('At most one InkSlot (the soft waiting label) per frame: the one thing waiting on a person.', 'color-ink-fill', 'suggestion'),
        create(context) {
          let imports;
          const seen = new Map();
          const framed = el => {
            const opening = el.openingElement;
            const name = elementName(opening);
            if (imports.get(name)?.imported === 'Card') return true;
            return elementTokens(context.sourceCode, opening).some(({c}) => !c.variants.length && c.base === 'frame');
          };
          return {
            JSXOpeningElement(node) {
              imports ??= ownImports(context);
              const imported = imports.get(elementName(node))?.imported;
              const slot = imported === 'InkSlot' || (imported === 'Status' && stringOf(attribute(node, 'status')) === 'waiting');
              if (!slot) return;
              const frame = jsxElements(node).find(framed);
              if (!frame) return;
              const count = (seen.get(frame) ?? 0) + 1;
              seen.set(frame, count);
              if (count === 2) context.report({node, message: 'A second InkSlot (or waiting Status) in one frame; the soft waiting label marks the one thing waiting on a person, so keep one and write the others as text or a count.'});
            },
          };
        },
      },

      'type-role': classRule(meta('Set text with a type-* role, never a raw size or weight.', 'typography-roles'), c => {
        if (c.root === 'text' && /^(?:xs|sm|base|lg|\d?xl)$/.test(c.value ?? '')) return `"${c.utility}" is a raw size; use a type-* role such as type-body, type-body-sm, type-label or type-heading, which sets size, line height and tracking together.`;
        if (c.root === 'font' && ['light', 'medium', 'semibold', 'bold'].includes(c.value)) return `"${c.utility}" sets a weight by hand; make hierarchy with size through a type-* role, which carries its own weight.`;
        return undefined;
      }),
    };
  },
});
