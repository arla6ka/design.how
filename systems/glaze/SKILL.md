---
name: glaze
description: Glaze design system rules for this project's UI. Use when building or changing any screen, component, form or style, when porting an existing screen onto Glaze, or when checking UI against Glaze.
---

# Glaze

Glaze is compact black and white for AI products: ink and paper, greys as ink at alphas, colour only for status, and glass only on the one action a group leads with; its secondaries stay flat. Build with these components before writing markup.

## Setup
Once, in the root layout: put the "glaze" class on `<body>` or the root element of the UI, with `GlazePortalProvider` inside it. Glaze's styles and tokens apply only inside that class.
Menus, dialogs, popovers and toasts render at the end of the body; GlazePortalProvider keeps them inside the scope, and without it they lose every token. `import {GlazePortalProvider} from '@/lib/glaze/portal'`
`<body className="glaze"><GlazePortalProvider>{children}</GlazePortalProvider></body>`

## Steps
1. For a whole screen, start from a block under Blocks when one fits: install it, then swap its sample data and copy for the real ones.
2. Pick the components the screen needs from the index below. Fetch each one's page before using it: it has the props, variants and that component's rules.
3. Build only from those components and the tokens under Tokens, inside an element with the "glaze" class. Import each from the path in the index; support pieces are under Imports. Dark mode: put data-theme="dark" on the glaze element or any ancestor, such as <html>. The theme does not follow the system setting (prefers-color-scheme) on its own.
4. Frame the screen with the Page shell. If a token or component is missing, stop and say so. Do not invent one.
5. Ask the person only when the screen needs a fact you were not given, such as a model name or a limit; decide everything else from these rules and say what you chose.
6. Porting an existing screen: swap one piece at a time for its component, keep the behavior and copy, and delete the old styles once nothing uses them. For a whole app, run migrate-design-system when it is installed.
7. Lint: install it once with `npx shadcn@latest add https://design.how/r/glaze/lint.json`, then run `npx eslint -c glaze.eslint.config.mjs .`. Each message names the fix.
8. Review before you finish: run the lint and fix every error, then render the screen at 390 and 1280 wide, check it against the global rules and the anti-slop list, fix the worst defect, and check again. Done when no MUST or NEVER is broken and no raw color, size or font is left. Run ui-review when it is installed.

## Priority order
When rules conflict, the earlier item wins.
1. Accessibility and keyboard behaviour
2. Tokens by role, never raw values
3. Existing components and recipes, never rebuilt
4. The three signatures: glass on pressables, the shell card, pills for one-line controls
5. Compact spacing and type

## Global rules
1. glaze-components-first MUST Use a Glaze component or recipe before writing markup; fetch its page before you build. Because each one already carries the focus ring, the states and the glass a hand-built copy forgets.
   - Correct: `import {Button} from '@/components/glaze/ui/button'`
2. glaze-scope MUST Wrap Glaze UI in className="glaze" with GlazePortalProvider inside it, so overlays keep the tokens. Because a menu or dialog renders at the end of the body, outside the scope, and would lose every colour.
   - Correct: `<div className="glaze"><GlazePortalProvider>{children}</GlazePortalProvider></div>`
3. glaze-tokens-only MUST Use only the roles Glaze defines, such as text-text-2, bg-paper and border-line-faint; never a hex, an arbitrary px or a dark: variant. Because the dark theme swaps the roles, and a raw value stays behind.
   - Correct: `<p className="text-text-2">`
   - Wrong: `<p className="text-[#6c6c6c]">`
4. glaze-one-primary MUST Lead a card, footer, dialog or any group of actions with at most one primary Button (ink, coral or green glass); every other action beside it is variant="secondary", flat. Because two glass pills side by side split the eye and neither reads as the next step.
   - Correct: `<Button variant="secondary">Not now</Button><Button>Join</Button>`
   - Wrong: `<Button>Not now</Button><Button>Join</Button>`
5. glaze-glass-on-pressables NEVER Put glass on anything a person does not press: cards, headers, badges, fields, menus. Because glass is the one sign that a thing can be pressed, and glass everywhere turns it into a theme.
   - Correct: `<div className="shell"><div className="panel p-3">`
   - Wrong: `<div className="glass glass-paper rounded-shell p-3">`
6. glaze-no-shadows NEVER Cast a shadow anywhere, overlays included; a card is a shell, an overlay is paper with a 1px ring. Because depth in Glaze is drawn inside the shape, and every shadow class draws nothing.
   - Correct: `<div className="shell">`
   - Wrong: `<div className="shell shadow-md">`
7. glaze-pill-controls MUST Make every one-line control a pill: buttons, fields, selects, chips, the segmented control. Because the pill is how a Glaze control looks, and a squared field beside a pill button reads as another system.
   - Correct: `<div className="field">`
   - Wrong: `<div className="field rounded-tag">`
8. glaze-mono-scale MUST Set mono at 0.8 of the sans around it: mono or <code> inline, a type-code role beside sans; a block of code, JSON or logs takes type-code-block, 12px. Because Glaze Mono's letters are 26% wider than Glaze Sans's, so at one size mono reads a size bigger.
   - Correct: `<span className="mono">run_8f2a91</span>`
   - Wrong: `<span className="font-mono">run_8f2a91</span>`
9. glaze-focus-ink MUST Keep the 2px ink :focus-visible ring on every control and never outline: none; a field shows focus by darkening its line. Because keyboard users lose their place without it, and a coral ring would read as an error.
10. glaze-sentence-case MUST Write sentence case and a verb with its object on actions; no emoji, no em dash. Because every screen then sounds like one person talking.
   - Correct: `<Button>Run eval</Button>`
   - Wrong: `<Button>OK</Button>`

## Page shell
Every screen sits in this frame.
- Root: `<div className="glaze min-h-dvh bg-page text-text-1">` with `GlazePortalProvider` inside it
- A card: `<div className="shell">` holding `<div className="panel p-3">` and an optional `<div className="shell-foot">`
- A card footer: meta first with `me-auto`, then `size="sm"` Buttons: flat secondaries, then at most one primary
- Page title: `<h1 className="type-title">`, one per page
- A phone moment: a component at `w-full max-w-sm`, sized to its content, with its one action inline (a Card footer or a row of Buttons); the screen around it supplies the header and the page colour

## Anti-slop
The habits of generated UI that Glaze bans. Details: https://design.how/systems/glaze/foundations/anti-slop.md
- anti-slop-no-glass-sprawl NEVER Spread the glass past what is pressed: no glass cards, headers, badges or inputs. Because glass on everything turns the signature into a theme, and nothing reads as the thing to press.
  - Wrong: `<header className="glass glass-paper">`
- anti-slop-no-decoration NEVER Add a gradient, a blob, a texture, a grid or dot background, a glow or a backdrop blur. Because Glaze is black and white, and decoration competes with the one ink action.
  - Wrong: `<div className="bg-linear-to-br from-paper to-field backdrop-blur">`
- anti-slop-no-shadow-reflex NEVER Reach for a shadow to make a card or a menu stand out. Because Glaze draws none; a card is a shell, an overlay is paper with a ring.
  - Wrong: `<div className="rounded-overlay bg-paper shadow-lg">`
- anti-slop-no-stat-cards NEVER Lay out a row of equal cards each holding one number. Because equal boxes make every number equally loud, so the one that matters is lost.
  - Wrong: `<Card>Runs</Card><Card>Evals</Card><Card>Cost</Card>`
- anti-slop-no-icon-tiles NEVER Put an icon in a tinted tile or circle beside a heading. Because the tile says nothing the heading does not and reads as a button.
  - Wrong: `<span className="rounded-tag bg-field p-2"><Icon icon={Bot}/></span><h2>Agents</h2>`
- anti-slop-no-side-rail NEVER Mark a card, row or message with a coloured bar on one edge. Because the bar reads as a status nobody defined.
  - Wrong: `<div className="border-s-4 border-ink">`
- anti-slop-no-status-dots NEVER Mark a status, an unread count, today or a series with a small round dot; a status is a glyph and a word. Because a dot says only that something is there, so its meaning rides on hue alone and every dot on the page reads the same.
  - Wrong: `<span className="size-1.5 rounded-pill bg-ok"/> Passed`
- anti-slop-earn-the-card MUST Group with space first; use a card around one thing a person acts on, and never a card in a card. Because a card around everything flattens the page into equal tiles.
- anti-slop-no-eyebrow NEVER Put a small label, a category or a number above a title. Because the heading already names the section, and the label is a second voice saying less.
  - Wrong: `<p className="type-caption text-text-2">Overview</p><h2>Runs</h2>`
- anti-slop-no-caps NEVER Set text in capitals or spread its letters. Because capitals are slower to read and shout.
  - Wrong: `<span className="uppercase tracking-widest">Queued</span>`
- anti-slop-no-emoji NEVER Use emoji in copy, titles or buttons, or as icons. Because emoji render differently on every device and turn a tool into a chat thread.
  - Wrong: `<Button>Run 🚀</Button>`
- anti-slop-no-hype NEVER Write seamless, effortless, supercharge, unleash or blazing; say what happens. Because people trust a product that states the fact.
  - Wrong: `Supercharge your agents.`
- anti-slop-no-mono-cosplay NEVER Set labels, headings or numbers in mono to look technical; mono is for what a person copies. Because mono everywhere reads as a terminal costume and hides which value is the ID.
  - Wrong: `<h2 className="mono">Agents</h2>`
- anti-slop-no-fake-data SHOULD Fill examples with believable data; never Lorem ipsum, John Doe or 1,234. Because placeholder data hides the truncation and alignment problems real data shows.
- anti-slop-no-stream-effects NEVER Blink a cursor, sweep a shimmer or fade in each word of a streamed answer. Because the effect slows reading and makes the layout jitter.
  - Wrong: `<span className="animate-pulse">▍</span>`
- anti-slop-no-scroll-reveal NEVER Fade or slide content in as it scrolls into view. Because content that hides until scrolled is missed.
  - Wrong: `<motion.section whileInView={{opacity: 1}}>`
- anti-slop-dialog-controlled MUST Open a Dialog with open and onOpenChange; never mount it only while open. Because a dialog that unmounts skips its exit and loses the trigger it returns focus to.

## Reject list
- No brand accent, no gradient, no shadow, no blur.
- No glass off pressables, no square one-line controls.
- No mono at the sans size, no weight 700, no capitals.

## Imports
- `import {useOverlayOpen, overlayModel, overlayOpenChanged, overlayMayClose, overlayRunStarted, overlayRunSettled, isThenable, closesAfter, useDefaultAction, useScrollBody, overlaySurface, overlayShell, overlayPanel, overlayMotion, scrimClass, menuPopupClass, menuItemClass, menuCheckItemClass, menuLabelClass, menuSeparatorClass} from '@/lib/glaze/overlay'`: What every overlay shares: the ringed paper surface and the card-shaped modal, the way they appear, the list rows, and for Dialog and Sheet the open state that waits for a running action and Enter on the footer's default action.
- `import {isPart} from '@/lib/glaze/children'`: isPart, which tells which part a child element is even when a server component composed it, for the compound components that read their children.
- `import {EMPTY_VALUE, CHART_EMPTY, fixed, durationUnitFor, formatDurations, countUnitFor, formatCounts, cssNumber, useScrollTabStop, useLoadingPhase} from '@/lib/glaze/data'`: Support file: one unit per column of numbers, a token read at runtime, the scroll box tab stop and the placeholder timing the data components share.
- `import {controlHeight, cn, mergeClass, mergeRefs} from '@/lib/glaze/utils'`: cn, which merges class names and resolves conflicts between Glaze's type roles and glass keys; mergeClass, which keeps Glaze's classes when a caller passes a className function; mergeRefs; and controlHeight, the one height formula for one-line controls.
- `import {Icon} from '@/components/glaze/icon'`: The one import point for icons: Phosphor at regular weight, 14px in controls.
- `import {GlazePortalProvider, useGlazePortal, useGlazeModal, cycleTab, coarsePointer} from '@/lib/glaze/portal'`: Puts overlays inside the .glaze scope so they keep its tokens, and makes the page inert behind a modal.
- `import {GlazeDirection, useDomDirection} from '@/lib/glaze/direction'`: Hands the reading direction to Base UI and to popups opened from a right-to-left subtree.

## Icons
Import a glyph beside Icon from the path under Imports and pass it in: `<Icon icon={Add} size={16}/>`. These are all the names; another needs adding to that file first.
Add, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Attachment, Bot, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronSort, ChevronUp, ChartLine, Close, CollapseAll, Code, Columns, Copy, Dark, Document, DocumentBlank, Download, Edit, Empty, ExpandAll, Failed, FailedMark, External, FileArchive, FileAudio, FileCode, FileImage, FileTable, FileVideo, Filter, FollowUp, Globe, Hide, Information, Key, Light, Link, Locked, NoAccess, NoResults, Microphone, MicrophoneOff, Model, More, Pause, Pending, Play, Retry, Return, Search, Send, Settings, Show, Sparkle, Stop, Subtract, Success, TableView, Terminal, Time, Tool, TrashCan, Undo, Upload, UserAvatar, Warning, Waiting, Wrap

## Tokens
The closed list. Use a token through its class, never a raw value: colors are utilities named after the role (bg-code-surface, text-text-1, border-line-faint); sizes read the scale (type-body, rounded-pill, h-(--control-lg), duration-(--dur-press)).
The class to use follows each token in brackets. Color names take bg-, text- or border-. A token with no class is read as a value, such as h-(--name).
- Surfaces: --page (bg-page), --paper (bg-paper), --shell (bg-shell), --field (bg-field), --code-surface (bg-code-surface), --hover (bg-hover), --hover-row (bg-hover-row), --pressed (bg-pressed), --scrim (bg-scrim)
- Ink: --ink (bg-/text-/border-ink), --ink-80, --ink-60, --ink-45, --ink-32, --ink-15, --ink-10, --ink-06, --ink-03
- Text: --text-1 (text-text-1), --text-2 (text-text-2), --text-3 (text-text-3), --text-disabled (text-text-disabled), --text-inverse (text-text-inverse)
- Lines: --line-faint (border-line-faint), --line (border-line), --line-control (border-line-control), --line-focus (border-line-focus), --line-strong (border-line-strong), --focus (border-focus), --line-width, --focus-width (focus-ring), --focus-offset, --focus-width-sm (focus-sm), --focus-offset-sm
- Status: --ok (bg-/text-/border-ok), --ok-text (bg-/text-/border-ok-text), --ok-tint (bg-/text-/border-ok-tint), --warn (bg-/text-/border-warn), --warn-text (bg-/text-/border-warn-text), --warn-tint (bg-/text-/border-warn-tint), --fail (bg-/text-/border-fail), --fail-text (bg-/text-/border-fail-text), --fail-tint (bg-/text-/border-fail-tint)
- Glass: 20 tokens read only through their classes and components; never by name.
- Flat: 4 tokens read only through their classes and components; never by name.
- Switch: --switch-off, --switch-knob, --switch-mark
- Small glaze: --glaze-sm-top, --glaze-sm-mid, --glaze-sm-bottom, --glaze-sm-highlight, --glaze-sm-rim, --glaze-sm-text
- Elevation: --shadow-none
- Type: --font-sans (font-sans), --font-mono (font-mono), --mono-scale, --weight-normal (font-normal), --weight-medium (font-medium), --weight-semibold (font-semibold), --type-title (type-title), --type-heading (type-heading), --type-heading-sm (type-heading-sm), --type-body (type-body), --type-body-sm (type-body-sm), --type-label (type-label), --type-label-sm (type-label-sm), --type-label-lg (type-label-lg), --type-caption (type-caption), --type-code (type-code), --type-code-sm (type-code-sm), --type-code-xs (type-code-xs), --type-code-block (type-code-block), --tracking-heading (tracking-heading), --tracking-body (tracking-body), --tracking-label (tracking-label)
- Space: --space-0-5, --space-1, --space-1-5, --space-2, --space-3, --space-4, --space-5, --space-6, --space-8, --space-10, --shell-inset, --shell-foot-inset
- Size: --control-sm, --control, --control-lg, --row, --icon-sm, --icon, --icon-lg
- Radius: --radius-pill (rounded-pill), --radius-shell (rounded-shell), --radius-panel (rounded-panel), --radius-overlay (rounded-overlay), --radius-row-focus, --radius-tag (rounded-tag)
- Motion: --dur-press, --dur-glass-press, --dur-glass-release, --dur-state, --dur-overlay, --overlay-shift, --scale-overlay, --dur-spin, --dur-slide, --dur-sweep, --wait-show, --wait-hold, --stale, --ease-out (ease-out), --ease-in (ease-in), --scale-press-flat, --scale-press, --scale-press-glass
- Layers: --z-raised, --z-sticky, --z-overlay
- Layout: --overlay-sm (max-w-overlay-sm), --overlay (max-w-overlay), --overlay-lg, --popover (max-w-popover), --toast, --menu-min, --menu-row, --menu-row-sm, --popup-max, --tooltip-max, --label-col, --progress-bar-sm, --progress-bar, --progress-bar-lg, --progress-sweep, --measure (max-w-measure), --measure-hint (max-w-measure-hint)
- Scrollbar: --scrollbar-thumb, --scrollbar-size, --scrollbar-gap

## Components

### Actions
- [Button](https://design.how/systems/glaze/components/button.md): Starts an action. `import {Button, buttonVariants} from '@/components/glaze/ui/button'`
- [Toolbar](https://design.how/systems/glaze/components/toolbar.md): Holds a row of actions on one thing. `import {Toolbar, ToolbarGroup, ToolbarButton, ToolbarToggle, ToolbarSeparator} from '@/components/glaze/ui/toolbar'`
- [Copy button](https://design.how/systems/glaze/components/copy-button.md): Copies a value. `import {CopyButton} from '@/components/glaze/ui/copy-button'`
- [Button group](https://design.how/systems/glaze/components/button-group.md): Joins related buttons into one control. `import {ButtonGroup, ButtonGroupMenu, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants} from '@/components/glaze/ui/button-group'`

### Inputs
- [Field](https://design.how/systems/glaze/components/field.md): Gives an input its label and error. `import {Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, Form, FormActions, FormStatus, Label, LabelHint, labelClasses, useFieldDisabled} from '@/components/glaze/ui/field'`
- [Input](https://design.how/systems/glaze/components/input.md): Takes one line of text. `import {Input, InputAction, InputControl, InputLeading, InputRoot, InputTrailing} from '@/components/glaze/ui/input'`
- [Textarea](https://design.how/systems/glaze/components/textarea.md): Takes several lines of text. `import {Textarea} from '@/components/glaze/ui/textarea'`
- [Chip](https://design.how/systems/glaze/components/chip.md): Shows a filter or a chosen value. `import {Chip, ChipCount, ChipGroup, chipVariants, chipToggleClasses, chipValueClasses, chipRemoveClasses} from '@/components/glaze/ui/chip'`
- [Date picker](https://design.how/systems/glaze/components/date-picker.md): Sets a date, a range or a time. `import {Calendar, DatePicker, TimeField, addDays, addMonths, daysBetween, formatTime, parseTime} from '@/components/glaze/ui/date-picker'`
- [Number input](https://design.how/systems/glaze/components/number-input.md): Takes a number and steps it. `import {NumberInput} from '@/components/glaze/ui/number-input'`
- [OTP input](https://design.how/systems/glaze/components/otp-input.md): Takes a one-time code. `import {OtpInput} from '@/components/glaze/ui/otp-input'`

### Selection
- [Checkbox](https://design.how/systems/glaze/components/checkbox.md): Turns one option on or off. `import {Checkbox, CheckboxGroup} from '@/components/glaze/ui/checkbox'`
- [Radio group](https://design.how/systems/glaze/components/radio-group.md): Picks one of a few choices. `import {RadioGroup, RadioGroupItem, RadioGroupOption} from '@/components/glaze/ui/radio-group'`
- [Switch](https://design.how/systems/glaze/components/switch.md): Turns a setting on or off at once. `import {Switch} from '@/components/glaze/ui/switch'`
- [Slider](https://design.how/systems/glaze/components/slider.md): Picks a number or a range. `import {Slider} from '@/components/glaze/ui/slider'`
- [Segmented control](https://design.how/systems/glaze/components/segmented-control.md): Switches between a few views of one thing. `import {SegmentedControl, SegmentedControlItem, segmentedVariants} from '@/components/glaze/ui/segmented-control'`
- [Select](https://design.how/systems/glaze/components/select.md): Picks one option from a list. `import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, NativeSelect, fieldTriggerClass, fieldTriggerSize} from '@/components/glaze/ui/select'`
- [Combobox](https://design.how/systems/glaze/components/combobox.md): Finds one or more values by typing. `import {Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxClear, ComboboxCollection, ComboboxContent, ComboboxCreate, ComboboxEmpty, ComboboxField, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator, ComboboxTrigger, ComboboxValue, normalizeEmail, splitEmails, validateEmail, useComboboxAnchor} from '@/components/glaze/ui/combobox'`

### Display
- [Kbd](https://design.how/systems/glaze/components/kbd.md): Shows a key or a shortcut. `import {Kbd, KbdGroup, shortcut} from '@/components/glaze/ui/kbd'`
- [Card](https://design.how/systems/glaze/components/card.md): Groups content about one thing. `import {Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, CardMeta, CardLink} from '@/components/glaze/ui/card'`
- [Panel](https://design.how/systems/glaze/components/panel.md): Holds a few rows inside a card. `import {Panel, panelVariants} from '@/components/glaze/ui/panel'`
- [Badge](https://design.how/systems/glaze/components/badge.md): Labels what something is or how it stands. `import {Badge, badgeVariants} from '@/components/glaze/ui/badge'`
- [Avatar](https://design.how/systems/glaze/components/avatar.md): Shows who or what acted. `import {Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, avatarVariants, initialsOf} from '@/components/glaze/ui/avatar'`
- [Item](https://design.how/systems/glaze/components/item.md): Shows one thing as a row in a list. `import {Item, ItemGroup, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemMeta, ItemLink, ItemActions, itemVariants, itemGroupVariants} from '@/components/glaze/ui/item'`
- [Data list](https://design.how/systems/glaze/components/data-list.md): Lists label and value pairs about one thing. `import {DataList, DataListItem, DataListLabel, DataListValue, DataListEmpty, dataListVariants} from '@/components/glaze/ui/data-list'`
- [Truncate](https://design.how/systems/glaze/components/truncate.md): Cuts a long line and keeps the whole value. `import {Truncate, TextHint, textHintClass, splitTail} from '@/components/glaze/ui/truncate'`
- [Relative time](https://design.how/systems/glaze/components/relative-time.md): Shows a time as distance from now. `import {RelativeTime, formatRelative, untilChange} from '@/components/glaze/ui/relative-time'`

### Feedback
- [Status](https://design.how/systems/glaze/components/status.md): Says where a piece of work stands. `import {Status, StatusMark, statusVariants, statusGlyph, statuses, statusLabels, statusRank} from '@/components/glaze/ui/status'`
- [Skeleton](https://design.how/systems/glaze/components/skeleton.md): Holds the shape of content while it loads. `import {Skeleton, SkeletonText, SkeletonSwap} from '@/components/glaze/ui/skeleton'`
- [Progress](https://design.how/systems/glaze/components/progress.md): Shows how far a task got. `import {Progress, ProgressLabel, ProgressValue, meterStatus} from '@/components/glaze/ui/progress'`
- [Empty state](https://design.how/systems/glaze/components/empty-state.md): Explains why a region is empty. `import {Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyCode, EmptyRetry, emptyVariants} from '@/components/glaze/ui/empty-state'`
- [Alert](https://design.how/systems/glaze/components/alert.md): Reports a problem with the current view. `import {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose, alertVariants} from '@/components/glaze/ui/alert'`
- [Toast](https://design.how/systems/glaze/components/toast.md): Confirms an action or reports an event. `import {Toaster, toast, toastManager, readingTimeout} from '@/components/glaze/ui/toast'`

### Overlays
- [Dialog](https://design.how/systems/glaze/components/dialog.md): Asks for a decision on top of the page. `import {Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogAction, DialogConfirmField, dialogVariants, useDialogFootSlot, useDialog} from '@/components/glaze/ui/dialog'`
- [Sheet](https://design.how/systems/glaze/components/sheet.md): Opens the details of one thing at the side. `import {Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription, SheetAction, SheetSection, SheetField, useSheet} from '@/components/glaze/ui/sheet'`
- [Popover](https://design.how/systems/glaze/components/popover.md): Shows a few lines next to a control. `import {Popover, PopoverTrigger, PopoverClose, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverInfo} from '@/components/glaze/ui/popover'`
- [Tooltip](https://design.how/systems/glaze/components/tooltip.md): Names a control on hover or focus. `import {Tooltip, TooltipTrigger, TooltipContent, TooltipChip, TooltipProvider, TooltipShortcut, tooltipPopupClass, tooltipMotionClass} from '@/components/glaze/ui/tooltip'`
- [Dropdown menu](https://design.how/systems/glaze/components/dropdown-menu.md): Lists the actions on one thing. `import {DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuLinkItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent} from '@/components/glaze/ui/dropdown-menu'`
- [Command](https://design.how/systems/glaze/components/command.md): Finds and runs a command by typing. `import {Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandLoading, CommandGroup, CommandItem, CommandLabel, CommandShortcut, CommandSeparator, CommandFooter, CommandHint, useCommand} from '@/components/glaze/ui/command'`

### Navigation
- [Tabs](https://design.how/systems/glaze/components/tabs.md): Switches between panels of one view. `import {Tabs, TabsList, TabsTrigger, TabsContent, TabsCount, tabsListVariants} from '@/components/glaze/ui/tabs'`
- [Breadcrumb](https://design.how/systems/glaze/components/breadcrumb.md): Shows where the page sits. `import {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, BreadcrumbId, BreadcrumbTrail} from '@/components/glaze/ui/breadcrumb'`
- [Steps](https://design.how/systems/glaze/components/steps.md): Shows the steps of a flow. `import {Steps, Step, StepTrigger, StepIndicator, StepText, StepTitle, StepDescription, StepSeparator} from '@/components/glaze/ui/steps'`
- [Pagination](https://design.how/systems/glaze/components/pagination.md): Moves through pages of results. `import {Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, PaginationInfo, PaginationNav, paginationRange} from '@/components/glaze/ui/pagination'`

### Layout
- [Collapsible](https://design.how/systems/glaze/components/collapsible.md): Shows and hides a region. `import {Collapsible, CollapsibleGroup, CollapsibleTrigger, CollapsibleCaret, CollapsibleContent} from '@/components/glaze/ui/collapsible'`

### Data
- [Filter bar](https://design.how/systems/glaze/components/filter-bar.md): Narrows a long list. `import {FilterBar, FilterBarSearch, FilterBarChips, FilterChip, FilterToggle, FilterBarSelect, FilterBarAdd, FilterBarClear, FilterBarCount, useFilteredRows} from '@/components/glaze/ui/filter-bar'`
- [Table](https://design.how/systems/glaze/components/table.md): Lists records that share the same fields. `import {Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, TableEmpty, TableLoading, TableTitle, TableToolbar, TableFrameBox, TableSortButton, TableRowActions, TableRowAction, TableRowActionsMenu, TableRowActionsItem, TableRowActionsSeparator, tableClassName, bodyClassName, rowClassName, headClassName, cellClassName} from '@/components/glaze/ui/table'`
- [Data grid](https://design.how/systems/glaze/components/data-grid.md): Sorts, selects and pages records from data. `import {DataGrid, DataGridColumnHeader, DataGridColumnsMenu, selectColumn, severitySort, statusSeverity} from '@/components/glaze/ui/data-grid'`
- [Bulk action bar](https://design.how/systems/glaze/components/bulk-action-bar.md): Acts on the rows a person selected. `import {BulkActionBar, BulkAction} from '@/components/glaze/ui/bulk-action-bar'`
- [Timeline](https://design.how/systems/glaze/components/timeline.md): Shows when each step of a run happened. `import {Timeline} from '@/components/glaze/ui/timeline'`

### Code
- [Code block](https://design.how/systems/glaze/components/code-block.md): Shows code or commands to copy. `import {CodeBlock, CopyCodeButton, TokenLine, tokenize, parseLines, commandLines, maskSecret, matchClass, currentMatchClass, languageLabels} from '@/components/glaze/ui/code-block'`
- [JSON view](https://design.how/systems/glaze/components/json-view.md): Shows structured data as a foldable tree. `import {JsonView, pathOf} from '@/components/glaze/ui/json-view'`
- [Log viewer](https://design.how/systems/glaze/components/log-viewer.md): Shows a run's output lines as they stream. `import {LogViewer} from '@/components/glaze/ui/log-viewer'`

### Media and charts
- [Attachment](https://design.how/systems/glaze/components/attachment.md): Shows a file and its upload state. `import {Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentProgress, AttachmentActions, AttachmentAction, AttachmentGroup, AttachmentGlyph, AttachmentDrop, AttachmentDropTitle, AttachmentDropDescription, AttachmentDropTrigger, useAttachmentDrop, fileGlyph, formatBytes, formatByteProgress, rejectionReason, describeAccept, attachmentVariants} from '@/components/glaze/ui/attachment'`
- [Chart](https://design.how/systems/glaze/components/chart.md): Shows numbers over time or by bucket. `import {Chart, unitFormat, ChartContainer, ChartPlot, ChartSwatch, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints, seriesTone, seriesClass, niceScale, formatCompact, numberAt, ChartTooltip, ChartTooltipContent, ChartTooltipRow, ChartDataTable, ChartLegend, chartLegendVariants, LineChart, monotonePath, linearPath, stepPath, BarChart, Sparkline, sparklineVariants, StatusBar, statusBarVariants, ChartFrame} from '@/components/glaze/ui/chart'`

### AI
- [Prompt input](https://design.how/systems/glaze/components/prompt-input.md): Takes the next message for an agent. `import {PromptInput, PromptInputModel, PromptAttachment, PromptQueue, PromptInputMic, serializePrompt, acceptsFile} from '@/components/glaze/ai/prompt-input'`
- [Send button](https://design.how/systems/glaze/components/send-button.md): Sends a prompt, or stops the reply. `import {SendButton} from '@/components/glaze/ai/send-button'`
- [Mention](https://design.how/systems/glaze/components/mention.md): Names a resource inside a prompt or answer. `import {Mention, mentionVariants, mentionTypeLabels, mentionToText, encodeMentionId, parseMentions, uniqueLabel} from '@/components/glaze/ai/mention'`
- [Message](https://design.how/systems/glaze/components/message.md): Shows one turn of a conversation. `import {MessageGroup, Message, AgentTurn, MessageContent, MessageHeader, MessageMeta, MessageTime, MessageModel, MessageStatus, MessageFooter, MessageWorked, MessageBubble, MessageBubbleContent, MessageReactions, MessageSendState, MessageDivider, messageVariants, bubbleVariants, dividerVariants} from '@/components/glaze/ai/message'`
- [Conversation](https://design.how/systems/glaze/components/conversation.md): Holds a thread that follows new replies. `import {Conversation, ConversationProvider, ConversationViewport, ConversationContent, ConversationItem, ConversationTail, ConversationJump, ConversationTimeline, ConversationRetry, ConversationError, useConversation, useStickToBottom, useStableRows, useCountdown, STICK, REATTACH} from '@/components/glaze/ai/conversation'`
- [Response](https://design.how/systems/glaze/components/response.md): Renders an answer as it streams. `import {Response, usePacedText, splitChunks, parseMarkdown, resolveTag, viableLength, completeJsonEnd, closeJson, nextCut, paceStep, safeHref, responseVariants} from '@/components/glaze/ai/response'`
- [Reasoning](https://design.how/systems/glaze/components/reasoning.md): Shows what the model thought before answering. `import {Reasoning, ReasoningTrigger, ReasoningContent, reasoningHeading} from '@/components/glaze/ai/reasoning'`
- [Tool call](https://design.how/systems/glaze/components/tool-call.md): Shows one tool an agent called. `import {ToolCall, ToolCallGroup, ToolCallList, CappedOutput, DiffCount, toolCallsReducer, useToolCalls, groupToolCalls, registerTool, resolveTool, summarizeToolCalls, toolActivity, toolLabel, formatDuration, cleanOutput, isTerminal} from '@/components/glaze/ai/tool-call'
import {RequestTicker, RequestSummary, ShowMoreRow, summarizeRequests, codeClass} from '@/components/glaze/ai/request-ticker'`
- [Activity](https://design.how/systems/glaze/components/activity.md): Says what the agent is doing now. `import {Activity, ActivityText, ActivityArc, ActivityGroup, Disclosure, StepGlyph, pastTense, joinSummary, pickActivity, useAntiFlicker, useHeldPhrase, splitForce, formatElapsed, formatCount, MIN_DISPLAY, activityVariants, rowVariants} from '@/components/glaze/ai/activity'`
- [Follow-ups](https://design.how/systems/glaze/components/follow-ups.md): Suggests next prompts to send. `import {FollowUps, followUpVariants} from '@/components/glaze/ai/follow-ups'`
- [Action receipt](https://design.how/systems/glaze/components/action-receipt.md): Records what an agent did. `import {ActionReceipt} from '@/components/glaze/ai/action-receipt'`
- [Autonomy rule](https://design.how/systems/glaze/components/autonomy-rule.md): Sets what an agent may do alone. `import {AutonomyRule} from '@/components/glaze/ai/autonomy-rule'`

## Blocks
Whole screens built only from the components above. Each installs to the blocks folder beside them.
- Today: The morning of a personal assistant, at phone width: the day in a line, a card of what it handled and Ask by voice. `npx shadcn@latest add https://design.how/r/glaze/today.json` `import {Today} from '@/components/glaze/blocks/today'`
- Voice capture: The assistant listening, at phone width: the time, the words as they are heard, Cancel and Send it. `npx shadcn@latest add https://design.how/r/glaze/voice-capture.json` `import {VoiceCapture} from '@/components/glaze/blocks/voice-capture'`
- Note recap: A note the assistant wrote from a voice note: a one line summary and a card of to-dos with Share note. `npx shadcn@latest add https://design.how/r/glaze/note-recap.json` `import {NoteRecap} from '@/components/glaze/blocks/note-recap'`
- Booking approval: The assistant asks before it pays a deposit, at phone width: the ask, why it checks and the booking card with Book table. `npx shadcn@latest add https://design.how/r/glaze/booking-approval.json` `import {BookingApproval} from '@/components/glaze/blocks/booking-approval'`
- Assistant limits: A list of what a personal assistant may do on its own, one rule per kind of action with its level. `npx shadcn@latest add https://design.how/r/glaze/assistant-limits.json` `import {AssistantLimits} from '@/components/glaze/blocks/assistant-limits'`
- Conversation insights: A question asked of a week of support conversations: the answer in a line, the week as a number and a line, and the three topics behind it. `npx shadcn@latest add https://design.how/r/glaze/conversation-insights.json` `import {ConversationInsights} from '@/components/glaze/blocks/conversation-insights'`
- Cited answer: A question asked of the workspace: a short answer with numbered citations and the sources they point to. `npx shadcn@latest add https://design.how/r/glaze/cited-answer.json` `import {CitedAnswer} from '@/components/glaze/blocks/cited-answer'`
- Agent plan: An agent builds another agent: the ask, its changes with their status, and Publish agent as the confirm. `npx shadcn@latest add https://design.how/r/glaze/agent-plan.json` `import {AgentPlan} from '@/components/glaze/blocks/agent-plan'`
- Agent procedure: The steps an agent follows, in plain sentences with its tools, documents and teams as mention chips, and Test and Publish. `npx shadcn@latest add https://design.how/r/glaze/agent-procedure.json` `import {AgentProcedure} from '@/components/glaze/blocks/agent-procedure'`
- Simulations: Simulated customers run against an agent: the pass count, the last 30 runs as a status strip and each scenario with its status, failures first. `npx shadcn@latest add https://design.how/r/glaze/simulations.json` `import {Simulations} from '@/components/glaze/blocks/simulations'`
- Experiment: Two prompts split live traffic: each arm's resolution rate, both by day, and Ship as the confirm. `npx shadcn@latest add https://design.how/r/glaze/experiment.json` `import {Experiment} from '@/components/glaze/blocks/experiment'`

## Foundations
- [Color](https://design.how/systems/glaze/foundations/color.md): Ink and paper with greys as ink at alphas, and colour only for status.
- [Typography](https://design.how/systems/glaze/foundations/typography.md): Glaze Sans for every word, Glaze Mono at 0.8 of the text around it.
- [Space](https://design.how/systems/glaze/foundations/space.md): A 4px grid, 32px controls and 36px rows.
- [Radius](https://design.how/systems/glaze/foundations/radius.md): Pills for every one-line control, 14 and 11 for the card, 10 for overlays, 6 for tags.
- [Borders and lines](https://design.how/systems/glaze/foundations/borders-and-lines.md): One hairline weight, from the faint card edge to the field line that darkens on focus.
- [Elevation](https://design.how/systems/glaze/foundations/elevation.md): No shadows: depth is drawn inside the shape, and overlays lift with a ring.
- [Motion](https://design.how/systems/glaze/foundations/motion.md): A press settles at 0.97 in 120ms; nothing springs.
- [Iconography](https://design.how/systems/glaze/foundations/iconography.md): Phosphor at regular weight, 14px in controls.
- [Anti-slop](https://design.how/systems/glaze/foundations/anti-slop.md): The habits of generated UI to avoid, and what to do instead.

## Add a component
`npx shadcn@latest add https://design.how/r/glaze/<name>.json`, the name being the last part of its page link.
