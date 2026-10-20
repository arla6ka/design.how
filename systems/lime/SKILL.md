---
name: lime
description: Lime design system rules for this project's UI. Use when building or changing any screen, component, form or style, when porting an existing screen onto Lime, or when checking UI against Lime.
---

# Lime

Lime is a white page, warm-grey surfaces and near-black text with one acid lime on the main action, for consumer apps. Build with these components before writing markup.

## Setup
Once, in the root layout: put the "lime" class on `<body>` or the root element of the UI, with `LimePortalProvider` inside it. Lime's styles and tokens apply only inside that class.
Menus, dialogs, popovers and toasts render at the end of the body; LimePortalProvider keeps them inside the scope, and without it they lose every token. `import {LimePortalProvider} from '@/lib/lime/portal'`
`<body className="lime"><LimePortalProvider>{children}</LimePortalProvider></body>`

## Steps
1. For a whole screen, start from a block under Blocks when one fits: install it, then swap its sample data and copy for the real ones.
2. Pick the components the screen needs from the index below. Fetch each one's page before using it: it has the props, variants and that component's rules.
3. Build only from those components and the tokens under Tokens, inside an element with the "lime" class. Import each from the path in the index; support pieces are under Imports. Dark mode: put data-theme="dark" on the lime element or any ancestor, such as <html>. The theme does not follow the system setting (prefers-color-scheme) on its own.
4. Frame the screen with the Page shell. If a component is missing, build the stand-in under Coverage gaps; if none is listed, compose it from existing components and tokens and say what you built. Never invent a token.
5. Ask the person only when the screen needs an amount, a payee or an autonomy limit you were not given; never invent one. Decide everything else from these rules and say what you chose.
6. Porting an existing screen: swap one piece at a time for its component, keep the behavior and copy, and delete the old styles once nothing uses them. For a whole app, run migrate-design-system when it is installed.
7. Lint: install it once with `npx shadcn@latest add https://design.how/r/lime/lint.json`, then run `npx eslint -c lime.eslint.config.mjs .`. Each message names the fix.
8. Review before you finish: run the lint and fix every error, then render the screen at 390 and 1280 wide, check it against the global rules and the anti-slop list, fix the worst defect, and check again. Done when no MUST or NEVER is broken and no raw color, size or font is left. Run ui-review when it is installed.

## Priority order
When rules conflict, the earlier item wins.
1. Accessibility and keyboard behavior
2. Tokens by role, never raw values
3. Existing components, never rebuilt
4. Spacing, radius and type scales
5. Polish: glow, motion, detail

## Global rules
1. lime-components-first MUST Use a Lime component before writing custom markup; fetch its page before you build. Because each one already carries the focus ring, states and touch size a hand-built copy forgets.
   - Correct: `import {Button} from '@/components/lime/ui/button'`
2. lime-scope MUST Wrap Lime UI in className="lime" with LimePortalProvider inside it, so overlays keep the tokens. Because a menu or dialog renders at the end of the body, outside the scope, and would lose every color.
   - Correct: `<div className="lime"><LimePortalProvider>{children}</LimePortalProvider></div>`
3. lime-tokens-only MUST Use only the token names Lime defines, such as --fg, --surface and --accent; never a hex value, arbitrary px or dark: variant. Because the dark theme and any retune change the roles, and a raw value stays behind.
   - Correct: `<p className="text-fg">`
   - Wrong: `<p className="text-[#0f0f0d]">`
4. lime-one-action MUST Use one lime primary action per view; every other action is solid, secondary, outline or ghost. Because the glowing lime is how the person finds the next step in a second.
5. lime-lime-scarce NEVER Fill a page, card or section with lime, or put white text on it; text on lime is --on-accent. Because white on lime is unreadable and a lime block drowns the one action.
   - Wrong: `<Card className="bg-accent text-white">Your goals</Card>`
6. lime-glow-scarce NEVER Add glow beyond primary and destructive buttons, the balance chip and one featured card. Because two glowing things compete and neither reads as the action.
   - Wrong: `<Card variant="glow">Recent activity</Card> // beside the upgrade card`
7. lime-money-sign MUST Format every amount with formatAmount or Amount, never by hand: formatAmount text in List and Table rows, the Amount pill for a sum beside a control or one that needs a tone. Because a hand-built string drops the minus, the separators or the tabular figures.
   - Correct: `import {Amount, formatAmount} from '@/components/lime/ui/amount'`
   - Wrong: `<span>${total}</span>`
8. lime-ask-before-money MUST When the assistant moves money, show an ApprovalRequest first and an ActionReceipt with Undo after; when the person pays, show a review step and then Payment done with Undo. Because money that moves without a check, or with no way back, is the one mistake people do not forgive.
   - Correct: `<ApprovalRequest title="Pay Maya for dinner" amount={-24} reason="Your half of Friday dinner"/>`
9. lime-field-label MUST Wrap every input in Field with a label above it; a placeholder is not a label. Because a placeholder disappears as soon as the person types and is not read as a name.
   - Correct: `<Field name="title"><FieldLabel>Goal name</FieldLabel><Input/></Field>`
10. lime-focus MUST Keep every control keyboard-operable with the 2px olive :focus-visible ring; never outline: none. Because keyboard and switch users lose their place without it.
11. lime-section-heading MUST Name a section with a real heading (an h2 at text-lg font-semibold in --fg) or not at all; never a small text-sm or text-xs label above the content. Because a small grey label above content is skipped by heading navigation and makes every section look the same.
   - Correct: `<h2 className="text-lg font-semibold">Recent activity</h2>`
   - Wrong: `<p className="text-sm font-medium text-fg-3">Recent activity</p>`
12. lime-sentence-case MUST Write sentence case and a verb with its object on actions; no emoji, no em dash, no title case. Because the copy then reads like a person talking, and every screen sounds the same.
   - Correct: `<Button>Send money</Button>`
   - Wrong: `<Button>OK</Button>`

## Page shell
Every screen sits in this frame.
- Root: `<div className="lime min-h-dvh bg-page text-fg">` with `LimePortalProvider` inside it
- One task, such as send or pay: `<main className="mx-auto w-full max-w-md px-4 pt-4 pb-8 sm:px-6 sm:pt-8">`
- Home, activity, settings: the same `main` at `max-w-2xl`
- A Table on a wide screen: the same `main` at `max-w-5xl`
- Header: `<header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-page">`: a ghost `size="icon"` Button with `aria-label="Back"`, then the h1; add `border-b border-line` once content scrolls under it
- Page title: `<h1 className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">`, one per page
- Section: `<section className="flex flex-col gap-3">` led by an h2 at `text-lg font-semibold`; sections sit `gap-8` apart
- Form: Fields in `flex flex-col gap-4` at `max-w-md`; the submit Button last, `size="lg"` and `w-full` on a phone
- Main action of a phone flow: `<div className="sticky bottom-0 bg-page pt-3 pb-4">` holding `<Button size="lg" className="w-full">`; add the safe-area inset under a home bar

## Anti-slop
The habits of generated UI that Lime bans. Details: https://design.how/systems/lime/foundations/anti-slop.md
- anti-slop-no-eyebrow NEVER Put a small label, a category or a number such as 01 above a title or a section. Because the heading already names the section, and the label only adds a second voice saying less.
  - Wrong: `<p className="text-xs font-medium text-fg-3">Overview</p><h2>Spending</h2>`
- anti-slop-no-stat-cards NEVER Lay out a row of equal cards each holding one number; show one Balance, a List or a sentence. Because equal boxes make every number equally loud, so the one that matters is lost.
  - Wrong: `<Card>Income</Card><Card>Spent</Card><Card>Saved</Card>`
- anti-slop-earn-surface MUST Group with space first; use a Card only around one thing the person acts on, and never put a Card in a Card. Because boxes around everything flatten the page into equal tiles and the eye has nowhere to start.
- anti-slop-no-icon-tiles NEVER Put an icon in a tinted tile, or beside a heading or a stat as decoration; ListIcon in a List row is the one round mark. Because a decorative icon carries no meaning and pulls the eye from the words.
  - Wrong: `<span className="rounded-panel bg-accent-wash p-2"><Icon icon={Wallet}/></span>`
- anti-slop-no-side-rail NEVER Mark a card, row or quote with a colored bar on one edge; use --accent-wash for a chosen row. Because the bar reads as a status nobody defined.
  - Wrong: `<div className="border-s-4 border-accent">`
- anti-slop-no-decoration NEVER Add a gradient, blob, texture, grid or dot background, glass blur, or a glow beyond the sanctioned ones. Because decoration competes with the one glowing action, which is the only light Lime allows.
  - Wrong: `<div className="bg-gradient-to-br from-accent to-surface backdrop-blur">`
- anti-slop-sticky-edge MUST Give a sticky header a --line bottom edge once content scrolls under it, and none at the top. Because without the edge, scrolled text slides under the title with nothing to say where the header ends.
- anti-slop-icon-first-line MUST Align a leading icon to the first line of its text, not the middle of a block that wraps. Because a centered icon drifts away from the line it labels once the text runs to two lines.
- anti-slop-no-small-prose NEVER Set a sentence the person must read, such as a fee or a limit, in text-xs or --fg-3; use text-sm in --fg or --fg-2. A FieldDescription hint is the exception. Because small grey text fails people reading in sunlight or with low vision, and a sentence is meant to be read.
  - Wrong: `<p className="text-xs text-fg-3">Transfers over $1,000 take one extra day to arrive.</p>`
- anti-slop-peer-amounts MUST Set amounts that are peers, such as the rows of one list, at one size and weight. Because a bigger or bolder peer reads as more important when it is not.
- anti-slop-no-caps NEVER Set text in capitals or spread its letters out; keep sentence case. Because capitals are slower to read and shout.
  - Wrong: `<span className="uppercase tracking-widest">Queued</span>`
- anti-slop-no-hype NEVER Write instant, secure, effortless, seamless or invented urgency such as Only 2 hours left; say what happens and when. Because people trust an app that states the fact, and hype reads as a sales pitch over their money.
  - Wrong: `Instant, secure transfers. Act now!`
- anti-slop-no-emoji NEVER Use emoji in copy, titles, buttons or as icons; use words and the Icon set. Because emoji render differently on every device and turn a money app into a chat thread.
  - Wrong: `<Button>Send 💸</Button>`
- anti-slop-no-fake-data SHOULD Fill examples with believable data: real-looking names, amounts with cents, dates near today; never Lorem ipsum, John Doe or $1,234.56. Because placeholder data hides truncation and alignment problems that real data shows at once.
- anti-slop-no-stream-effects NEVER Blink a cursor, sweep a shimmer or fade in each word of a streamed answer; let the text arrive as it is. Because the effect slows reading and makes the layout jitter while the person tries to read.
  - Wrong: `<span className="animate-pulse">▍</span>`
- anti-slop-no-scroll-reveal NEVER Fade, slide or scale content in as it scrolls into view. Because content that hides until scrolled is missed, and motion that answers nothing is decoration.
  - Wrong: `<motion.section whileInView={{opacity: 1, y: 0}}>`
- anti-slop-dialog-controlled MUST Open a Dialog, Sheet or AlertDialog with open and onOpenChange; never mount it only while open. Because a dialog that unmounts skips its exit motion and loses the trigger it returns focus to.
- anti-slop-keep-one-glow MUST Keep one glowing primary action on every view while removing the rest; never flatten a screen to grey. Because Lime without its one lime action is a grey page with nowhere to go next.

## Reject list
- No blue, no second brand hue, no gradient behind content, no colored shadows.
- No second icon set, no weight 700, no letter-spaced capitals.
- No transition: all, no looping animation except the spinner.

## Coverage gaps
Not in the system yet, and what to build meanwhile.
- Bottom navigation: a `<nav aria-label="Main">` fixed to the bottom on `bg-page` with `border-t border-line`, 3 to 5 links each an Icon at 20 over a `text-xs` label, at least 56px tall; the current one has `aria-current="page"` in `--fg`, the rest `--fg-3`.
- Date picker: an Input with `type="date"` inside a Field.
- Charts beyond a sparkline: the Insight sparkline, or the figures in a List; no chart library.

## Imports
- `import {ListItemMenu} from '@/components/lime/ui/list-item-menu'`: A row's other actions behind a more button, for ListItem's menu.
- `import {Collapsible, CollapsibleTrigger, CollapsibleContent} from '@/components/lime/ui/collapsible'`: One section that opens and closes, the base of the Why? in Approval request.
- `import {cn, mergeClass} from '@/lib/lime/utils'`: cn, which merges class names and knows Lime's radius and shadow names, and mergeClass, which keeps Lime's classes when className is a function of state.
- `import {Icon} from '@/components/lime/icon'`: The one import point for Carbon icons.
- `import {LimePortalProvider, useLimePortal} from '@/lib/lime/portal'`: Puts overlays inside the .lime scope so they keep its tokens.
- `import {useFocusWhenReplaced} from '@/lib/lime/use-focus-when-replaced'`: Moves focus to an outcome when the buttons that had it are replaced, so a keyboard user is not dropped to the top.
- `import {popupClass, itemClass, groupLabelClass, separatorClass} from '@/lib/lime/popup'`: The panel, item and separator classes every floating list shares.

## Icons
Import a glyph beside Icon from the path under Imports and pass it in: `<Icon icon={Add} size={16}/>`. These are all the names; another needs adding to that file first.
Add, ArrowDown, ArrowRight, ArrowUp, Attachment, Checkmark, CheckmarkFilled, ChevronDown, ChevronRight, ChevronSort, ChevronUp, Close, Copy, ErrorFilled, Image, Information, Menu, Play, Receipt, Renew, Search, Send, Subtract, Time, Upload, Wallet, PiggyBank, Warning, WarningFilled, ChevronLeft, ArrowLeft, Pause, OverflowMenuHorizontal, Folder, Star, Plus, Delete, Cafe, ShoppingBag, Notification, Locked, Undo, Edit, CircleDash, Location

## Tokens
The closed list. Use a token through its class, never a raw value: colors are utilities named after the role (bg-surface, text-fg, border-line); sizes read the scale (text-sm, rounded-field, shadow-card, h-(--control-lg), duration-(--dur-fast)).
The class to use follows each token in brackets. Color names take bg-, text- or border-. A token with no class is read as a value, such as h-(--name).
- Surfaces: --page (bg-page), --surface (bg-surface), --surface-2 (bg-surface-2), --surface-3 (bg-surface-3), --raised (bg-raised), --field (bg-field), --scrim (bg-scrim)
- Text: --fg (text-fg), --fg-2 (text-fg-2), --fg-3 (text-fg-3), --fg-disabled (text-fg-disabled), --fg-inverse (text-fg-inverse), --on-accent (text-on-accent), --glow-accent-fg
- Lines: --line (border-line), --line-strong (border-line-strong), --control (border-control)
- Solid ink: --ink (bg-/text-/border-ink), --ink-hover (bg-/text-/border-ink-hover), --ink-active (bg-/text-/border-ink-active)
- Accent: --accent (bg-/text-/border-accent), --accent-hover (bg-/text-/border-accent-hover), --accent-active (bg-/text-/border-accent-active), --accent-wash (bg-/text-/border-accent-wash), --accent-line (bg-/text-/border-accent-line), --ring (bg-/text-/border-ring)
- Status: --success (bg-/text-/border-success), --success-tint (bg-/text-/border-success-tint), --success-text (bg-/text-/border-success-text), --warn (bg-/text-/border-warn), --warn-tint (bg-/text-/border-warn-tint), --warn-text (bg-/text-/border-warn-text), --danger (bg-/text-/border-danger), --danger-hover (bg-/text-/border-danger-hover), --danger-tint (bg-/text-/border-danger-tint), --on-danger (bg-/text-/border-on-danger), --danger-text (bg-/text-/border-danger-text)
- Elevation: --shadow-ink, --shadow-card (shadow-card), --shadow-menu (shadow-menu), --shadow-overlay (shadow-overlay), --thumb, --switch-on, --switch-on-thumb, --shadow-thumb
- Glow: 37 tokens read only through their classes and components; never by name.
- Type: --font-sans (font-sans), --font-mono (font-mono), --text-xs (text-xs), --text-sm (text-sm), --text-base (text-base), --text-lg (text-lg), --text-xl (text-xl), --text-2xl (text-2xl), --text-3xl (text-3xl), --leading-tight (leading-tight), --leading-snug (leading-snug), --leading-normal (leading-normal), --tracking-tight (tracking-tight), --weight-normal (font-normal), --weight-medium (font-medium), --weight-semibold (font-semibold)
- Size: --control-sm, --control-md, --control-lg
- Radius: --radius-sm (rounded-sm), --radius-md (rounded-md), --radius-field (rounded-field), --radius-panel (rounded-panel), --radius-sheet (rounded-sheet), --radius-control (rounded-control)
- Motion: --dur-instant, --dur-fast, --dur-base, --dur-slow, --dur-spin, --ease-out (ease-out), --ease-in (ease-in), --scale-enter, --scale-press
- Layers: --z-dialog, --z-popover, --z-toast
- Layout: --overlay-sm (max-w-overlay-sm), --overlay (max-w-overlay), --overlay-lg (max-w-overlay-lg), --popover (max-w-popover), --sheet (max-w-sheet), --popup-max (max-w-popup), --focus-offset, --line-focus, --scrollbar-thumb

## Components

### Actions
- [Button](https://design.how/systems/lime/components/button.md): Starts an action, such as Send money. The lime primary is the one glowing action on a screen. `import {Button, Spinner, buttonVariants} from '@/components/lime/ui/button'`
- [Copy button](https://design.how/systems/lime/components/copy-button.md): Copies a value, such as a payment link, and confirms with a check. `import {CopyButton} from '@/components/lime/ui/copy-button'`

### Inputs
- [Input](https://design.how/systems/lime/components/input.md): One line of text, such as a merchant name or a search. `import {Input, fieldControl} from '@/components/lime/ui/input'`
- [Textarea](https://design.how/systems/lime/components/textarea.md): Several lines of text, such as a note on a payment. `import {Textarea} from '@/components/lime/ui/textarea'`
- [Field](https://design.how/systems/lime/components/field.md): A label, a control, a hint and an error, wired together. `import {Field, FieldLabel, FieldDescription, FieldError} from '@/components/lime/ui/field'`
- [Select](https://design.how/systems/lime/components/select.md): One choice from a list, such as an account or a category. `import {Select, SelectGroup, SelectLabel, SelectTrigger, SelectContent, SelectItem, triggerVariants} from '@/components/lime/ui/select'`
- [Combobox](https://design.how/systems/lime/components/combobox.md): A searchable choice from a long list, such as friends or merchants. `import {Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty} from '@/components/lime/ui/combobox'`
- [Dropzone](https://design.how/systems/lime/components/dropzone.md): A target for receipts and statements, with type and size checks. `import {Dropzone} from '@/components/lime/ui/dropzone'`
- [Keypad](https://design.how/systems/lime/components/keypad.md): The number pad for entering an amount on a phone, such as how much to send. `import {Keypad, pressKey} from '@/components/lime/ui/keypad'`

### Selection
- [Checkbox](https://design.how/systems/lime/components/checkbox.md): One option on or off, with a mixed state. `import {Checkbox} from '@/components/lime/ui/checkbox'`
- [Radio](https://design.how/systems/lime/components/radio.md): One choice from a short visible list, such as a transfer speed. `import {RadioGroup, Radio} from '@/components/lime/ui/radio'`
- [Switch](https://design.how/systems/lime/components/switch.md): A setting that applies at once, such as round-ups. `import {Switch} from '@/components/lime/ui/switch'`
- [Slider](https://design.how/systems/lime/components/slider.md): A value or a range on a track, such as a monthly savings amount. `import {Slider} from '@/components/lime/ui/slider'`
- [Segmented](https://design.how/systems/lime/components/segmented.md): A short row of exclusive options, such as Week, Month and Year. `import {Segmented, SegmentedItem, trackVariants} from '@/components/lime/ui/segmented'`
- [Chip](https://design.how/systems/lime/components/chip.md): A filter the person toggles, such as a spending category. `import {Chip, chipClass} from '@/components/lime/ui/chip'`

### Display
- [Badge](https://design.how/systems/lime/components/badge.md): A short fact that never changes on its own, such as Plus or New. `import {Badge, badgeVariants} from '@/components/lime/ui/badge'`
- [Avatar](https://design.how/systems/lime/components/avatar.md): A person, such as a friend you split a bill with, with initials as the fallback. `import {Avatar, AvatarGroup, avatarVariants} from '@/components/lime/ui/avatar'`
- [Card](https://design.how/systems/lime/components/card.md): A grouped block, such as a savings goal or a card, on warm grey, outlined or raised. `import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants} from '@/components/lime/ui/card'`
- [Table](https://design.how/systems/lime/components/table.md): Rows of transactions you scan across, with amounts at the end. `import {Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption} from '@/components/lime/ui/table'`
- [List](https://design.how/systems/lime/components/list.md): Rows of transactions, accounts or settings, each with a mark, a title and a value or a chevron. `import {List, ListItem, ListIcon, listVariants} from '@/components/lime/ui/list'`
- [Progress](https://design.how/systems/lime/components/progress.md): How far a goal has come, such as $640 of $1,000 saved, as a bar or a ring. `import {Progress} from '@/components/lime/ui/progress'`
- [Amount](https://design.how/systems/lime/components/amount.md): A money amount with its sign, currency and tabular figures. `import {Amount, amountAffordability, formatAmount, spokenAmount, toMoney, amountVariants} from '@/components/lime/ui/amount'`
- [Bill schedule](https://design.how/systems/lime/components/bill-schedule.md): The bills coming up in date order, each under a date tile, with who pays it. `import {BillSchedule} from '@/components/lime/ui/bill-schedule'`
- [Balance](https://design.how/systems/lime/components/balance.md): The amount left in an account, kept in the header. `import {Balance, balanceVariants} from '@/components/lime/ui/balance'`

### Feedback
- [Status](https://design.how/systems/lime/components/status.md): The state of a payment as a dot and a word. `import {Status, STATUS_META} from '@/components/lime/ui/status'`
- [Empty](https://design.how/systems/lime/components/empty.md): An empty state with one action, such as Add a card. `import {Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions} from '@/components/lime/ui/empty'`
- [Skeleton](https://design.how/systems/lime/components/skeleton.md): Still grey shapes in place of content that is loading, such as recent activity. `import {Skeleton, skeletonVariants} from '@/components/lime/ui/skeleton'`
- [Error state](https://design.how/systems/lime/components/error-state.md): What failed to load, in its place, with Try again. `import {ErrorState} from '@/components/lime/ui/error-state'`
- [Toast](https://design.how/systems/lime/components/toast.md): A short note after an action, such as Moved $50 to savings, with an optional Undo. `import {ToastProvider, useToast, createToastManager} from '@/components/lime/ui/toast'`

### Overlays
- [Dialog](https://design.how/systems/lime/components/dialog.md): A focused task over a scrim, such as sending money. `import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, backdropClass, dialogVariants} from '@/components/lime/ui/dialog'`
- [Alert dialog](https://design.how/systems/lime/components/alert-dialog.md): A blocking decision, such as deleting a goal, that cannot be dismissed from outside. `import {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogClose} from '@/components/lime/ui/alert-dialog'`
- [Sheet](https://design.how/systems/lime/components/sheet.md): A panel from an edge, such as transaction details, that keeps the page visible. `import {Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose, useSheetSide} from '@/components/lime/ui/sheet'`
- [Popover](https://design.how/systems/lime/components/popover.md): An anchored panel with controls, such as splitting a bill. `import {Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription, PopoverClose} from '@/components/lime/ui/popover'`
- [Dropdown menu](https://design.how/systems/lime/components/dropdown-menu.md): A list of commands behind a button. `import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator} from '@/components/lime/ui/dropdown-menu'`
- [Tooltip](https://design.how/systems/lime/components/tooltip.md): A short label on hover and focus. `import {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider} from '@/components/lime/ui/tooltip'`

### Navigation
- [Tabs](https://design.how/systems/lime/components/tabs.md): Switches between views of one list, such as Activity and Scheduled. `import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/lime/ui/tabs'`
- [Toolbar](https://design.how/systems/lime/components/toolbar.md): A row of related controls with one tab stop. `import {Toolbar, ToolbarGroup, ToolbarButton, ToolbarToggle, ToolbarSeparator} from '@/components/lime/ui/toolbar'`

### Layout
- [Accordion](https://design.how/systems/lime/components/accordion.md): A stack of questions that open one at a time. `import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@/components/lime/ui/accordion'`
- [Separator](https://design.how/systems/lime/components/separator.md): A hairline between groups. `import {Separator} from '@/components/lime/ui/separator'`
- [Scroll area](https://design.how/systems/lime/components/scroll-area.md): A scrolling region with a slim thumb. `import {ScrollArea} from '@/components/lime/ui/scroll-area'`

### Assistant
- [Chat input](https://design.how/systems/lime/components/chat-input.md): The box a request to the assistant is written in, with the amount and send. `import {ChatInput} from '@/components/lime/ai/chat-input'`
- [Message](https://design.how/systems/lime/components/message.md): One turn in a conversation with the assistant. `import {Message, messageVariants} from '@/components/lime/ai/message'`
- [Tool call](https://design.how/systems/lime/components/tool-call.md): One step the assistant took, such as Moved $50 to Vacation fund, as a single line. `import {ToolCall} from '@/components/lime/ai/tool-call'`
- [Follow ups](https://design.how/systems/lime/components/follow-ups.md): Suggested next requests under an answer. `import {FollowUps} from '@/components/lime/ai/follow-ups'`
- [Approval request](https://design.how/systems/lime/components/approval-request.md): The assistant asking before it moves money, with the amount, one reason, and Approve, Edit or Decline. `import {ApprovalRequest} from '@/components/lime/ai/approval-request'`
- [Action receipt](https://design.how/systems/lime/components/action-receipt.md): A message listing what the assistant just did, one line per action, with Undo. `import {ActionReceipt} from '@/components/lime/ai/action-receipt'`
- [Autonomy rule](https://design.how/systems/lime/components/autonomy-rule.md): How far the assistant may go on its own, as one sentence with the limit typed into it. `import {AutonomyRule} from '@/components/lime/ai/autonomy-rule'`
- [Receipt match](https://design.how/systems/lime/components/receipt-match.md): A receipt paired with its payment, with whether the two match. `import {ReceiptMatch} from '@/components/lime/ai/receipt-match'`
- [Insight](https://design.how/systems/lime/components/insight.md): One thing the assistant noticed, as a sentence, the number behind it and a tiny line. `import {Insight} from '@/components/lime/ai/insight'`

## Blocks
Whole screens built only from the components above. Each installs to the blocks folder beside them.
- Home screen: An app home: a greeting, the balance, three quick actions with Add as the glow, and a savings goal. `npx shadcn@latest add https://design.how/r/lime/home.json` `import {HomeScreen} from '@/components/lime/blocks/home'`
- Assistant approval: You ask the assistant to pay a bill and it asks before it pays, with Approve as the glow. `npx shadcn@latest add https://design.how/r/lime/assistant-approval.json` `import {PayingABill} from '@/components/lime/blocks/assistant-approval'`
- Assistant alert: The assistant flags an unusual charge or an unused subscription, with one row and the answers to it. `npx shadcn@latest add https://design.how/r/lime/assistant-alert.json` `import {UnusualCharge, CancelSubscription} from '@/components/lime/blocks/assistant-alert'`
- Settings rules: Payday rules and the assistant's limits as settings lists, one row per rule. `npx shadcn@latest add https://design.how/r/lime/settings-rules.json` `import {PaydayRule, AssistantLimits} from '@/components/lime/blocks/settings-rules'`
- Split request: A bill you paid, split by what each person owes, with one request to send. `npx shadcn@latest add https://design.how/r/lime/split-request.json` `import {SplitDinner} from '@/components/lime/blocks/split-request'`

## Foundations
- [Color](https://design.how/systems/lime/foundations/color.md): The colors Lime uses, and where each one goes.
- [Typography](https://design.how/systems/lime/foundations/typography.md): The typeface, sizes and weights Lime uses for every word and number.
- [Spacing](https://design.how/systems/lime/foundations/spacing.md): How much room goes between things, and how tall controls are.
- [Radius](https://design.how/systems/lime/foundations/radius.md): How round each corner is, from pill buttons to softer panels.
- [Elevation](https://design.how/systems/lime/foundations/elevation.md): How things stack, using grey steps and a soft shadow for what floats.
- [Motion](https://design.how/systems/lime/foundations/motion.md): How things move, quickly and only when something changes.
- [Iconography](https://design.how/systems/lime/foundations/iconography.md): One set of simple line icons, drawn in the same color as the text.
- [Anti-slop](https://design.how/systems/lime/foundations/anti-slop.md): The habits of generated UI to avoid, and what to do instead.

## Add a component
`npx shadcn@latest add https://design.how/r/lime/<name>.json`, the name being the last part of its page link.
