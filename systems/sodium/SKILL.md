---
name: sodium
description: Sodium design system rules for this project's UI. Use when building or changing any screen, component, form or style, when porting an existing screen onto Sodium, or when checking UI against Sodium.
---

# Sodium

Sodium is compact and ruled, for infrastructure and data tools: white and warm near-black grounds, 1px rules for structure, mono capitals for every interface word, Inter Display for headlines and prose, zero radius, and one sodium yellow for the thing to act on. Build with its recipes and components before writing markup.

## Setup
Once, in the root layout: put the "sodium" class on `<body>` or the root element of the UI, with `SodiumPortalProvider` inside it. Sodium's styles and tokens apply only inside that class.
Menus, dialogs, popovers and toasts render at the end of the body; SodiumPortalProvider keeps them inside the scope, and without it they lose every token. `import {SodiumPortalProvider} from '@/lib/sodium/portal'`
`<body className="sodium"><SodiumPortalProvider>{children}</SodiumPortalProvider></body>`

## Steps
1. For a whole screen, start from a block under Blocks when one fits: install it, then swap its sample data and copy for the real ones.
2. Pick the components the screen needs from the index below. Fetch each one's page before using it: it has the props, variants and that component's rules.
3. Build only from those components and the tokens under Tokens, inside an element with the "sodium" class. Import each from the path in the index; support pieces are under Imports. Dark mode: put data-theme="dark" on the sodium element or any ancestor, such as <html>. The theme does not follow the system setting (prefers-color-scheme) on its own.
4. Frame the screen with the Page shell. If a token or component is missing, stop and say so. Do not invent one.
5. Ask the person only when the screen needs a fact you were not given, such as a region or a limit; decide everything else from these rules and say what you chose.
6. Porting an existing screen: swap one piece at a time for its component, keep the behavior and copy, and delete the old styles once nothing uses them. For a whole app, run migrate-design-system when it is installed.
7. Lint: install it once with `npx shadcn@latest add https://design.how/r/sodium/lint.json`, then run `npx eslint -c sodium.eslint.config.mjs .`. Each message names the fix.
8. Review before you finish: run the lint and fix every error, then render the screen at 390 and 1280 wide, check it against the global rules and the anti-slop list, fix the worst defect, and check again. Done when no MUST or NEVER is broken and no raw color, size or font is left. Run ui-review when it is installed.

## Priority order
When rules conflict, the earlier item wins.
1. Accessibility and keyboard behaviour
2. Tokens by role, never raw values
3. Existing components and recipes, never rebuilt
4. The signatures: mono capitals through the label roles, rules as structure, the one yellow action, square corners
5. Compact spacing and type

## Global rules
1. sodium-components-first MUST Use a Sodium component or recipe before writing markup; fetch its page before you build. Because each one already carries the focus ring, the states and the yellow rules a hand-built copy forgets.
   - Correct: `import {Button} from '@/components/sodium/ui/button'`
2. sodium-scope MUST Wrap Sodium UI in className="sodium" with SodiumPortalProvider inside it, so overlays keep the tokens. Because a menu or dialog renders at the end of the body, outside the scope, and would lose every colour.
   - Correct: `<div className="sodium"><SodiumPortalProvider>{children}</SodiumPortalProvider></div>`
3. sodium-tokens-only MUST Use only the roles Sodium defines, such as text-text-2, bg-panel and border-line; never a hex, an arbitrary px or a dark: variant. Because the dark theme swaps the roles, and a raw value stays behind.
   - Correct: `<p className="text-text-2">`
   - Wrong: `<p className="text-[#55524a]">`
4. sodium-one-primary MUST Lead a frame, footer, dialog or any group of actions with at most one primary Button (the yellow slab, or the destructive); every other action beside it is variant="secondary" or "ghost". Because the slab is how a person finds the next action, and two of them side by side split the eye.
   - Correct: `<Button variant="secondary">Keep</Button><Button>Run</Button>`
   - Wrong: `<Button>Keep</Button><Button>Run</Button>`
5. sodium-yellow-on-light NEVER Set text, an icon or a lone line in solid yellow; yellow-family text is text-accent-text. Because sodium yellow on white is 1.4:1, and light is the default theme.
   - Correct: `<span className="text-accent-text">Running</span>`
   - Wrong: `<span className="text-accent-fill">Running</span>`
6. sodium-caps-through-roles MUST Set every interface word (button, tab, tag, table head, axis) in a label role, and every sentence in the sans. Because the role carries the mono face, the capitals and the tracking together, and a sentence in capitals reads slowly.
   - Correct: `<span className="type-label-sm">Queued</span>`
   - Wrong: `<span className="uppercase">Queued</span>`
7. sodium-rules-not-boxes MUST Box a region once with frame and divide its parts with rules; never a box in a box and never a grid behind the page. Because rules carry Sodium's layout, and extra edges or a background grid bury them.
   - Correct: `<main><div className="frame"><div className="rule-row">`
   - Wrong: `<main className="dots"><div className="frame"><div className="frame">`
8. sodium-square NEVER Round a corner anywhere. Because square corners meet the 1px rules cleanly, and one rounded part reads as another system.
   - Correct: `<div className="frame">`
   - Wrong: `<div className="frame rounded-lg">`
9. sodium-focus-ring MUST Keep the 2px focus ring on every control and never outline: none; a field shows focus on its own edge. Because keyboard users lose their place without it.
10. sodium-sentence-case MUST Write sentence case in the source and a verb with its object on actions; the label roles set the capitals. No emoji, no em dash. Because the source then reads as plain words to a screen reader, and every screen sounds like one person.
   - Correct: `<Button>Run pipeline</Button>`
   - Wrong: `<Button>OK</Button>`

## Page shell
Every screen sits in this frame.
- Root: `<div className="sodium min-h-dvh bg-page text-text-1">` with `SodiumPortalProvider` inside it
- A region: `<section className="frame">` with a `panel-head` row and parts divided by `rule-row` or `rule-col`
- Several numbers: a status strip: one ruled row of cells, a `type-micro` label over a `type-code` value
- Page title: `<h1 className="type-title">`, one per page
- A run's steps: `ToolCallStack` beside or under the frame, never inside it
- A phone moment: a component at `w-full max-w-sm`, sized to its content, with no device frame; its one slab sits in a row of Buttons

## Anti-slop
The habits of generated UI that Sodium bans. Details: https://design.how/systems/sodium/foundations/anti-slop.md
- anti-slop-no-cell-grid NEVER Draw a cell grid or a dot field behind the page or behind content. Because the owner ruled it out: a grid behind every word fights the rules that carry the layout, and it is the first thing a generated "technical" screen reaches for.
  - Wrong: `<main className="dots min-h-dvh">`
- anti-slop-no-terminal-costume NEVER Dress a screen as a terminal: green or amber on black, scanlines, a > prompt before a headline, ASCII boxes. Because Sodium takes the discipline of a terminal, not its look, and a costume makes a real tool read as a toy.
  - Wrong: `<h1 className="text-ok-text">&gt; pipelines_</h1>`
- anti-slop-no-decoration NEVER Add a gradient, a blob, a glow or a backdrop blur; the one gradient is the light from below that the slab and edged recipes draw on a button. Because Sodium is flat fills and 1px rules, and decoration competes with the one yellow action.
  - Wrong: `<div className="bg-linear-to-br from-page to-well backdrop-blur">`
- anti-slop-no-rounding NEVER Round a corner to soften a region, a control or an avatar. Because every corner is square, and one round corner is the part everyone sees.
  - Wrong: `<div className="frame rounded-xl">`
- anti-slop-no-yellow-everywhere NEVER Spread yellow past the one primary, the selection and a chart series: no yellow headers, header squares, borders, icons or badges. Because yellow marks the thing to act on, and yellow everywhere marks nothing.
  - Wrong: `<header className="bg-accent-fill">`
- anti-slop-no-stat-cards NEVER Lay out a row of equal cards each holding one number. Because equal boxes make every number equally loud; a status strip puts them on one ruled row where they can be compared.
  - Wrong: `<div className="grid grid-cols-4 gap-4"><div className="frame">…</div>…</div>`
- anti-slop-no-box-in-box NEVER Box a part inside a frame; divide it with a rule. Because two edges a few px apart read as a double line.
  - Wrong: `<div className="frame"><div className="frame">`
- anti-slop-no-side-rail NEVER Mark a row with a coloured bar on one edge. Because the bar reads as a status nobody defined; a chosen row takes the selection wash, and a row draws nothing at its start.
  - Wrong: `<div className="border-s-4 border-accent-edge">`
- anti-slop-no-status-dots NEVER Mark a status with a round dot; a status is a square mark and a word. Because a round dot is the one curve on a square screen, and its meaning rides on hue alone.
  - Wrong: `<span className="size-2 rounded-full bg-ok"/> Passed`
- anti-slop-no-label-above-title NEVER Put a small label, a category or a number above a headline. Because the headline already names the section; a name belongs in a panel header row, never stacked over a title.
  - Wrong: `<p className="type-label">Overview</p><h2 className="type-heading">Runs</h2>`
- anti-slop-no-caps-sentences NEVER Set a sentence, a description or a headline in mono capitals. Because mono capitals are for words a person scans, and a sentence in them reads slowly and shouts.
  - Wrong: `<p className="type-label">The backfill wrote 1,204 partitions.</p>`
- anti-slop-no-emoji NEVER Use emoji in copy, titles or buttons, or as icons. Because emoji render differently on every device and turn a tool into a chat thread.
  - Wrong: `<Button>Deploy 🚀</Button>`
- anti-slop-no-hype NEVER Write seamless, effortless, supercharge, unleash or blazing; say what happens. Because people trust a tool that states the fact.
  - Wrong: `Blazing-fast pipelines.`
- anti-slop-no-brackets-everywhere SHOULD Keep brackets for a machine action, a tool call or a step an agent took; never around a person's button. Because the bracket says a machine did this, and on a person's action it blurs who acted.
- anti-slop-no-fake-data SHOULD Fill examples with believable data; never Lorem ipsum, John Doe or 1,234. Because placeholder data hides the truncation and alignment problems real data shows.
- anti-slop-no-blinking-caret NEVER Leave a caret blinking at rest, or type text a person is waiting to read. Because the caret belongs to typing; at rest it reads as a field waiting for input, and slow typing hides an answer behind an effect.
  - Wrong: `<span className="caret animate-[blink_1s_steps(1)_infinite]"/>`
- anti-slop-no-scroll-reveal NEVER Fade or slide content in as it scrolls into view. Because content that hides until scrolled is missed.
  - Wrong: `<motion.section whileInView={{opacity: 1}}>`
- anti-slop-dialog-controlled MUST Open a Dialog with open and onOpenChange; never mount it only while open. Because a dialog that unmounts skips its exit and loses the trigger it returns focus to.

## Reject list
- No rounded corners, no shadow, no gradient, no blur, no grid behind the page.
- No yellow text or icons on light, no yellow warning, no second slab.
- No bold, no capitals outside the label roles, no sentence in capitals.

## Imports
- `import {useOverlayOpen, overlayModel, overlayOpenChanged, overlayMayClose, overlayRunStarted, overlayRunSettled, isThenable, closesAfter, useDefaultAction, useScrollBody, overlaySurface, overlayModal, overlayMotion, overlayHeaderClass, overlayTitleClass, overlayHeadMetaClass, overlayBodyClass, overlayDescriptionClass, overlayFooterClass, overlayMetaClass, overlayErrorClass, scrimClass, menuPopupClass, menuVarsClass, menuItemClass, menuCheckItemClass, menuLabelClass, menuSeparatorClass, menuShortcutClass, optionItemClass, optionCheckClass} from '@/lib/sodium/overlay'`: What every overlay shares: the edged panel surface, the way it arrives, and the list rows of selects, comboboxes and menus.
- `import {useScrollTabStop, findAll} from '@/lib/sodium/scroll'`: Support file: the tab stop a scrolling data region takes while it overflows, and the case-free search matcher.
- `import {motionDefaults, parseDuration, easeOut, useMotionToken, useTimeline} from '@/hooks/sodium/use-timeline'`: The frame clock under Sodium's typing, scrambles and connectors: deterministic given a clock, final at once under reduced motion.
- `import {typedAt, firstChars, useTyping} from '@/hooks/sodium/use-typing'`: Types text in at about 55 characters a second behind a caret shown only while typing.
- `import {scrambleGlyphs, scrambleTick, hash, scrambleAt, useScramble} from '@/hooks/sodium/use-scramble'`: Resolves a mono label through glyphs in about 0.4 seconds.
- `import {drawAt, useDraw} from '@/hooks/sodium/use-draw'`: Draws connectors out one hop at a time, about 0.3 seconds a hop.
- `import {controlHeight, reducedMotion, cn, mergeClass, mergeRefs} from '@/lib/sodium/utils'`: cn, which merges class names and resolves conflicts between Sodium's type roles and button surfaces; mergeClass, which keeps Sodium's classes when a caller passes a className function; mergeRefs; and controlHeight, the one height formula for one-line controls.
- `import {Icon} from '@/components/sodium/icon'`: The one import point for icons: Lucide, squared off with square ends, mitred joins and a 1.25px line.
- `import {SodiumPortalProvider, useSodiumPortal, useSodiumModal, cycleTab, coarsePointer} from '@/lib/sodium/portal'`: Puts overlays inside the .sodium scope so they keep its tokens, and makes the page inert behind a modal.
- `import {SodiumDirection, useDomDirection} from '@/lib/sodium/direction'`: Hands the reading direction to Base UI and to popups opened from a right-to-left subtree.

## Icons
Import a glyph beside Icon from the path under Imports and pass it in: `<Icon icon={Activity} size={16}/>`. These are all the names; another needs adding to that file first.
Activity, Add, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Branch, Calendar, Checkmark, ChevronDown, ChevronLeft, ChevronRight, ChevronSort, ChevronUp, Chip, Close, Code, Copy, Cube, DataBase, DataTable, Document, Download, Edit, ErrorOutline, Filter, Flow, Folder, Information, Launch, Lightning, Locked, Meter, Moon, OverflowMenuHorizontal, Pause, Play, Renew, Search, ServerDns, Settings, StopOutline, Subtract, Sun, Terminal, Time, TrashCan, Undo, Upload, View, ViewOff, WarningAlt, ArrowsHorizontal, CollapseAll, ExpandAll, Misuse, TextWrap

## Tokens
The closed list. Use a token through its class, never a raw value: colors are utilities named after the role (bg-code-surface, text-text-1, border-line-faint); sizes read the scale (type-body, rounded-4xl, h-(--control-lg), duration-(--dur-press)).
The class to use follows each token in brackets. Color names take bg-, text- or border-. A token with no class is read as a value, such as h-(--name).
- Surfaces: --page (bg-page), --panel (bg-panel), --well (bg-well), --code-surface (bg-code-surface), --hover (bg-hover), --pressed (bg-pressed), --selected (bg-selected), --selected-strong (bg-selected-strong), --scrim (bg-scrim)
- Text: --text-1 (text-text-1), --text-2 (text-text-2), --text-3 (text-text-3), --text-disabled (text-text-disabled), --text-inverse (text-text-inverse)
- Lines: --line-faint (border-line-faint), --line (border-line), --line-control (border-line-control), --mark (border-mark), --dot, --line-width, --focus-width (focus-ring), --focus-offset, --dot-pitch, --rail-pitch, --rail-dot, --pending-cell
- Accent: --accent (bg-/text-/border-accent-fill), --accent-text (bg-/text-/border-accent-text), --accent-edge (bg-/text-/border-accent-edge)
- Primary: --primary-bg (bg-/text-/border-primary), --primary-text (bg-/text-/border-primary-foreground), --primary-edge, --primary-hover, --primary-edge-hover, --primary-pressed, --primary-light, --primary-light-hover, --primary-ring
- Secondary: --secondary-bg (bg-/text-/border-secondary-bg), --secondary-hover, --secondary-pressed, --secondary-edge, --secondary-edge-hover, --secondary-light, --secondary-light-hover, --secondary-ring
- Checked: --check-bg, --check-edge, --check-mark, --check-off (bg-/text-/border-check-off), --check-off-hover (bg-/text-/border-check-off-hover), --check-range (bg-/text-/border-check-range)
- Field: --field-bg, --field-hover, --field-edge, --field-edge-hover, --field-ring-hover, --field-focus-bg, --field-focus-edge, --field-ring-focus, --field-ring-fail, --field-inset-sm, --field-inset, --field-inset-lg, --row-highlight, --row-highlight-edge
- Status: --ok (bg-/text-/border-ok), --ok-text (bg-/text-/border-ok-text), --ok-tint (bg-/text-/border-ok-tint), --warn (bg-/text-/border-warn), --warn-text (bg-/text-/border-warn-text), --warn-tint (bg-/text-/border-warn-tint), --fail (bg-/text-/border-fail), --fail-text (bg-/text-/border-fail-text), --fail-tint (bg-/text-/border-fail-tint)
- Data: --data-1 (bg-/text-/border-data-1), --data-2 (bg-/text-/border-data-2), --data-3 (bg-/text-/border-data-3), --data-4 (bg-/text-/border-data-4), --data-5 (bg-/text-/border-data-5), --data-6 (bg-/text-/border-data-6)
- Focus: --focus (bg-/text-/border-focus), --caret
- Elevation: --shadow-none
- Type: --font-sans (font-sans), --font-mono (font-mono), --mono-scale, --weight-normal (font-normal), --type-display (type-display), --type-title (type-title), --type-heading (type-heading), --type-heading-sm (type-heading-sm), --type-figure (type-figure), --type-body (type-body), --type-body-sm (type-body-sm), --type-caption (type-caption), --type-label-lg (type-label-lg), --type-label (type-label), --type-label-sm (type-label-sm), --type-micro (type-micro), --type-code (type-code), --type-code-sm (type-code-sm), --tracking-display (tracking-display), --tracking-title (tracking-title), --tracking-heading (tracking-heading), --tracking-body (tracking-body), --tracking-label, --tracking-label-lg, --tracking-label-sm
- Space: --space-0-5, --space-1, --space-1-5, --space-2, --space-3, --space-4, --space-5, --space-6, --space-8, --space-10, --inset
- Size: --control-sm, --control, --control-lg, --row, --row-sm, --head, --icon, --icon-sm, --marker, --cap, --rail
- Radius: --radius
- Motion: --dur-press, --dur-state, --dur-overlay, --dur-wipe, --dur-draw, --dur-type, --dur-scramble, --dur-pending, --overlay-shift, --dur-light, --dur-glow, --ease-out (ease-out), --ease-soft (ease-soft), --ease-in (ease-in), --ease-linear (ease-linear)
- Layers: --z-raised, --z-overlay
- Layout: --overlay-sm (max-w-overlay-sm), --overlay (max-w-overlay), --overlay-lg (max-w-overlay-lg), --popover (max-w-popover), --toast, --menu-min, --popup-max, --tooltip-max, --label-col, --meter, --measure (max-w-measure), --measure-hint (max-w-measure-hint)
- Scrollbar: --scrollbar-thumb, --scrollbar-size, --scrollbar-gap

## Components

### Actions
- [Button](https://design.how/systems/sodium/components/button.md): Starts an action. `import {Button, buttonVariants} from '@/components/sodium/ui/button'`
- [Button group](https://design.how/systems/sodium/components/button-group.md): Joins related buttons into one control. `import {ButtonGroup, ButtonGroupMenu, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants} from '@/components/sodium/ui/button-group'`
- [Copy button](https://design.how/systems/sodium/components/copy-button.md): Copies a value. `import {CopyButton} from '@/components/sodium/ui/copy-button'`

### Inputs
- [Field](https://design.how/systems/sodium/components/field.md): Gives an input its label and error. `import {Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, Form, FormActions, FormStatus, Label, LabelHint, labelClasses, useFieldDisabled} from '@/components/sodium/ui/field'`
- [Input](https://design.how/systems/sodium/components/input.md): Takes one line of text. `import {Input, InputAction, InputControl, InputLeading, InputPending, InputRoot, InputTrailing} from '@/components/sodium/ui/input'`
- [Textarea](https://design.how/systems/sodium/components/textarea.md): Takes several lines of text. `import {Textarea} from '@/components/sodium/ui/textarea'`
- [Select](https://design.how/systems/sodium/components/select.md): Picks one option from a list. `import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, NativeSelect, fieldTriggerClass, fieldTriggerSize} from '@/components/sodium/ui/select'`
- [Combobox](https://design.how/systems/sodium/components/combobox.md): Finds one or more values by typing. `import {Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxClear, ComboboxCollection, ComboboxContent, ComboboxCreate, ComboboxEmpty, ComboboxField, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator, ComboboxTrigger, ComboboxValue, normalizeEmail, splitEmails, validateEmail, useComboboxAnchor} from '@/components/sodium/ui/combobox'`

### Selection
- [Checkbox](https://design.how/systems/sodium/components/checkbox.md): Turns one option on or off. `import {Checkbox, CheckboxGroup} from '@/components/sodium/ui/checkbox'`
- [Radio group](https://design.how/systems/sodium/components/radio-group.md): Picks one of a few choices. `import {RadioGroup, RadioGroupItem, RadioGroupOption} from '@/components/sodium/ui/radio-group'`
- [Switch](https://design.how/systems/sodium/components/switch.md): Turns a setting on or off at once. `import {Switch} from '@/components/sodium/ui/switch'`
- [Slider](https://design.how/systems/sodium/components/slider.md): Picks a number or a range. `import {Slider} from '@/components/sodium/ui/slider'`
- [Segmented control](https://design.how/systems/sodium/components/segmented-control.md): Switches between a few views of one thing. `import {SegmentedControl, SegmentedControlItem, segmentedVariants} from '@/components/sodium/ui/segmented-control'`

### Display
- [Tag](https://design.how/systems/sodium/components/tag.md): Labels what something is or how it stands. `import {Tag, tagVariants} from '@/components/sodium/ui/tag'`
- [Status strip](https://design.how/systems/sodium/components/status-strip.md): Shows the few numbers to check first, in one ruled row. `import {StatusStrip, StatusStripCell, StatusStripLabel, StatusStripValue, StatusStripUnit, stripVariants} from '@/components/sodium/ui/status-strip'`
- [Avatar](https://design.how/systems/sodium/components/avatar.md): Shows who or what acted. `import {Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants, initialsOf} from '@/components/sodium/ui/avatar'`
- [Kbd](https://design.how/systems/sodium/components/kbd.md): Shows a key or a shortcut. `import {Kbd, KbdGroup, shortcut} from '@/components/sodium/ui/kbd'`
- [Item](https://design.how/systems/sodium/components/item.md): Shows one thing as a row in a list. `import {Item, ItemGroup, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemMeta, ItemLink, ItemActions, itemVariants, itemGroupVariants} from '@/components/sodium/ui/item'`
- [Data list](https://design.how/systems/sodium/components/data-list.md): Lists label and value pairs about one thing. `import {DataList, DataListItem, DataListLabel, DataListValue, DataListEmpty, dataListVariants} from '@/components/sodium/ui/data-list'`

### Feedback
- [Status](https://design.how/systems/sodium/components/status.md): Says where a job or a run stands. `import {Status, StatusMark, statusVariants, statuses, statusLabels, statusRank} from '@/components/sodium/ui/status'
import {RunningMark} from '@/components/sodium/ui/running-mark'`
- [Meter](https://design.how/systems/sodium/components/meter.md): Shows how full something is. `import {Meter, MeterLabel, MeterValue, MeterStack, meterStatus} from '@/components/sodium/ui/meter'`
- [Progress](https://design.how/systems/sodium/components/progress.md): Shows how far a task got. `import {Progress, ProgressLabel, ProgressValue} from '@/components/sodium/ui/progress'`
- [Alert](https://design.how/systems/sodium/components/alert.md): Reports a problem or a change in the current view. `import {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose, alertVariants} from '@/components/sodium/ui/alert'`
- [Toast](https://design.how/systems/sodium/components/toast.md): Reports something that happened out of view. `import {Toaster, toast, toastManager, readingTimeout} from '@/components/sodium/ui/toast'`
- [Empty state](https://design.how/systems/sodium/components/empty-state.md): Explains why a region is empty. `import {Empty, EmptyIcon, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyCode, EmptyRetry, emptyVariants} from '@/components/sodium/ui/empty-state'`
- [Skeleton](https://design.how/systems/sodium/components/skeleton.md): Holds the shape of content while it loads. `import {Skeleton, SkeletonText, SkeletonRows, SkeletonSwap} from '@/components/sodium/ui/skeleton'`

### Overlays
- [Dialog](https://design.how/systems/sodium/components/dialog.md): Asks for a decision on top of the page. `import {Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogAction, DialogConfirmField, dialogVariants, useDialog} from '@/components/sodium/ui/dialog'`
- [Sheet](https://design.how/systems/sodium/components/sheet.md): Opens the details of one thing at the side. `import {Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription, SheetAction, SheetSection, SheetField, useSheet} from '@/components/sodium/ui/sheet'`
- [Popover](https://design.how/systems/sodium/components/popover.md): Shows a few lines next to a control. `import {Popover, PopoverTrigger, PopoverClose, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverInfo} from '@/components/sodium/ui/popover'`
- [Tooltip](https://design.how/systems/sodium/components/tooltip.md): Names a control on hover or focus. `import {Tooltip, TooltipTrigger, TooltipContent, TooltipChip, TooltipProvider, TooltipShortcut, tooltipPopupClass, tooltipMotionClass} from '@/components/sodium/ui/tooltip'`
- [Dropdown menu](https://design.how/systems/sodium/components/dropdown-menu.md): Lists the actions on one thing. `import {DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuLinkItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent} from '@/components/sodium/ui/dropdown-menu'`
- [Command](https://design.how/systems/sodium/components/command.md): Finds and runs a command by typing. `import {Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandLoading, CommandGroup, CommandItem, CommandLabel, CommandShortcut, CommandSeparator, CommandFooter, CommandHint, useCommand} from '@/components/sodium/ui/command'`

### Navigation
- [Tabs](https://design.how/systems/sodium/components/tabs.md): Switches between panels of one view. `import {Tabs, TabsList, TabsTrigger, TabsContent, TabsCount, tabsListVariants, tabBase, useActiveInView} from '@/components/sodium/ui/tabs'`
- [Numbered tabs](https://design.how/systems/sodium/components/numbered-tabs.md): Steps through the few numbered sections of one page. `import {NumberedTabs, NumberedTabsList, NumberedTabsTrigger, NumberedTabsContent, NumberedTabsPanels} from '@/components/sodium/ui/numbered-tabs'`
- [Breadcrumb](https://design.how/systems/sodium/components/breadcrumb.md): Shows where the page sits, as a path. `import {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, BreadcrumbValue, BreadcrumbTrail} from '@/components/sodium/ui/breadcrumb'`
- [Pagination](https://design.how/systems/sodium/components/pagination.md): Moves through pages of results. `import {Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, PaginationInfo, PaginationNav, paginationRange} from '@/components/sodium/ui/pagination'`

### Layout
- [Collapsible](https://design.how/systems/sodium/components/collapsible.md): Shows and hides a region. `import {Collapsible, CollapsibleGroup, CollapsibleTrigger, CollapsibleCaret, CollapsibleContent} from '@/components/sodium/ui/collapsible'`
- [Frame](https://design.how/systems/sodium/components/frame.md): Boxes a region once and divides it by rules. `import {Frame, FrameHeader, FrameTitle, FrameStatus, FrameValue, FrameActions, FrameBody, FrameDescription, FrameFooter, FrameMeta, frameVariants} from '@/components/sodium/ui/frame'`

### Data
- [Table](https://design.how/systems/sodium/components/table.md): Lists records that share the same fields. `import {Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, TableEmpty, TableLoading, TableTitle, TableToolbar, TableSortButton, TableRowActions, TableRowAction, tableClassName, bodyClassName, rowClassName, headClassName, cellClassName} from '@/components/sodium/ui/table'`
- [Filter bar](https://design.how/systems/sodium/components/filter-bar.md): Narrows a table, a log or a list in one row. `import {FilterBar, FilterBarSearch, FilterToggle, FilterBarSelect, FilterBarClear, FilterBarCount, useFilteredRows} from '@/components/sodium/ui/filter-bar'`

### Code
- [Code block](https://design.how/systems/sodium/components/code-block.md): Shows code or commands to copy. `import {CodeBlock, TokenLine, WrapToggle, tokenize, parseLines, commandLines, maskSecret, gutterStyle, maxLinesStyle, matchClass, currentMatchClass, languageLabels} from '@/components/sodium/ui/code-block'`
- [Code window](https://design.how/systems/sodium/components/code-window.md): Shows a file as a numbered window, with the line that failed. `import {CodeWindow} from '@/components/sodium/ui/code-window'`
- [JSON view](https://design.how/systems/sodium/components/json-view.md): Shows structured data as a foldable tree. `import {JsonView, pathOf} from '@/components/sodium/ui/json-view'`
- [Log viewer](https://design.how/systems/sodium/components/log-viewer.md): Shows a job's output lines as they stream. `import {LogViewer} from '@/components/sodium/ui/log-viewer'`

### Charts
- [Chart](https://design.how/systems/sodium/components/chart.md): Shows numbers over time as a line or an area. `import {Chart, ChartFrame, ChartPlot, LineChart, ChartContainer, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints, useDrawn, seriesTone, ChartSwatch, ChartTooltip, ChartTooltipContent, ChartTooltipRow, ChartDataTable, ChartLegend, niceScale, tickCount, formatCompact, formatExact, unitFormat, numberAt, linearPath, stepPath, wipeStyle, drawStyle} from '@/components/sodium/ui/chart'
import {toneClass, toneFill, toneArea} from '@/components/sodium/ui/chart-parts'
import {EMPTY_VALUE, CHART_EMPTY} from '@/components/sodium/ui/chart-scale'`
- [Stem chart](https://design.how/systems/sodium/components/stem-chart.md): Prints one value per period on a square-headed stem. `import {StemChart} from '@/components/sodium/ui/stem-chart'`
- [Swimlanes](https://design.how/systems/sodium/components/swimlanes.md): Shows the steps of a flow across the systems they run in. `import {Swimlanes, stepVariants} from '@/components/sodium/ui/swimlanes'`
- [Bar blocks](https://design.how/systems/sodium/components/bar-blocks.md): Splits one total into its parts as blocks as wide as their share. `import {BarBlocks, blockVariants} from '@/components/sodium/ui/bar-blocks'`

### Runs and agents
- [Tool-call row](https://design.how/systems/sodium/components/tool-call-row.md): Draws a run's steps as ruled boxes, joined by connectors. `import {ToolCallStack, ToolCallRow, formatElapsed, stepWords} from '@/components/sodium/ai/tool-call-row'`
- [Tool call](https://design.how/systems/sodium/components/tool-call.md): Shows one tool an agent called in a run. `import {ToolCall, ToolCallList, toolCallsReducer, useToolCalls, registerTool, resolveTool, isTerminal, cleanOutput} from '@/components/sodium/ai/tool-call'`
- [Activity](https://design.how/systems/sodium/components/activity.md): Says what a run is doing now. `import {Activity, pastTense} from '@/components/sodium/ai/activity'`
- [Prompt input](https://design.how/systems/sodium/components/prompt-input.md): Takes the next instruction for an agent. `import {PromptInput} from '@/components/sodium/ai/prompt-input'`
- [Message](https://design.how/systems/sodium/components/message.md): Shows one turn of a run's thread. `import {Message, MessageGroup, MessageDivider} from '@/components/sodium/ai/message'`
- [Response](https://design.how/systems/sodium/components/response.md): Renders an agent's answer as it streams. `import {Response, usePacedText, splitChunks, parseMarkdown, closeDangling, nextCut, paceStep, safeHref} from '@/components/sodium/ai/response'`

## Blocks
Whole screens built only from the components above. Each installs to the blocks folder beside them.
- Job runs: Every pipeline's runs as one table: a Status word per row, IDs and numbers in mono and Run now. `npx shadcn@latest add https://design.how/r/sodium/job-runs.json` `import {JobRuns} from '@/components/sodium/blocks/job-runs'`
- Failed load: A load that failed: the alert with Retry load, the model with its failing line banded, and the step's log. `npx shadcn@latest add https://design.how/r/sodium/failed-load.json` `import {FailedLoad} from '@/components/sodium/blocks/failed-load'`
- On call: A failed job at phone width: its header, the failure in a sentence, its facts in a 2x2 grid, Acknowledge and Retry step. `npx shadcn@latest add https://design.how/r/sodium/on-call.json` `import {OnCall} from '@/components/sodium/blocks/on-call'`
- Run progress: A backfill followed at phone width: the live step, partitions done, the run's numbers as a strip and its steps. `npx shadcn@latest add https://design.how/r/sodium/run-progress.json` `import {RunProgress} from '@/components/sodium/blocks/run-progress'`
- Warehouse capacity: How full a warehouse is: credits, storage and concurrency as meters, storage by schema, queries by hour and Resize warehouse. `npx shadcn@latest add https://design.how/r/sodium/warehouse-capacity.json` `import {WarehouseCapacity} from '@/components/sodium/blocks/warehouse-capacity'`
- Sync flow: A nightly sync across the systems it touches as swimlanes, the rows it loaded by source, and Run sync. `npx shadcn@latest add https://design.how/r/sodium/sync-flow.json` `import {SyncFlow} from '@/components/sodium/blocks/sync-flow'`
- Pipeline history: A pipeline's page under its path: runs per day, its latest partitions and its schedule as numbered tabs. `npx shadcn@latest add https://design.how/r/sodium/pipeline-history.json` `import {PipelineHistory} from '@/components/sodium/blocks/pipeline-history'`

## Foundations
- [Color](https://design.how/systems/sodium/foundations/color.md): White and warm near-black, rules for structure, and one sodium yellow that changes how it shows by theme.
- [Typography](https://design.how/systems/sodium/foundations/typography.md): Mono capitals for the interface, Inter Display for headlines and prose, one weight.
- [Space](https://design.how/systems/sodium/foundations/space.md): A 4px grid, 32px controls and 40px rows.
- [Radius](https://design.how/systems/sodium/foundations/radius.md): Zero, everywhere.
- [Borders and lines](https://design.how/systems/sodium/foundations/borders-and-lines.md): Rules divide content; a frame is a region's one outer edge.
- [Elevation](https://design.how/systems/sodium/foundations/elevation.md): No shadows: an overlay is the panel with a rule edge, set apart by its fill and, for a dialog, the scrim.
- [Motion](https://design.how/systems/sodium/foundations/motion.md): Typing, scrambles, wipes and connectors that draw; ease-out, no springs.
- [Iconography](https://design.how/systems/sodium/foundations/iconography.md): Lucide at 16px, squared off to match square corners.
- [Anti-slop](https://design.how/systems/sodium/foundations/anti-slop.md): The habits of generated UI to avoid, and what to do instead.

## Add a component
`npx shadcn@latest add https://design.how/r/sodium/<name>.json`, the name being the last part of its page link.
