'use client';

import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemMedia, ItemTitle} from '../ui/item';
import {Response, type InlineTag} from '../ai/response';

const answer = 'Refunds over **$500** need a second approval from the support lead[1]. The agent hands them off with the order and the amount instead of sending the money[2].';

const sources = [
  {title: 'Refund policy, 2026', meta: 'Policies, edited 2h ago'},
  {title: 'Approvals for large refunds', meta: 'Help center, edited 3d ago'},
];

const citation: InlineTag[] = [{
  pattern: /\[(\d+)\]/,
  partial: /\[\d*$/,
  render: m => <a href={`#source-${m[1]}`} aria-label={`Source ${m[1]}`} className="ms-0.5 inline-block rounded-tag bg-field px-1 align-baseline type-caption text-text-2 no-underline data hover:text-text-1">{m[1]}</a>,
}];

export function CitedAnswer({className}: {className?: string}) {
  return (
    <Card aria-label="Workspace search" className={className ?? 'w-full max-w-md'}>
      <CardHeader>
        <CardTitle>How do we handle refunds over $500?</CardTitle>
      </CardHeader>
      <CardContent>
        <Response size="sm" inlineTags={citation}>{answer}</Response>
      </CardContent>
      <CardContent flush>
        <ItemGroup variant="plain" aria-label="Sources">
          {sources.map((s, i) => <Item key={s.title} id={`source-${i + 1}`}>
            <ItemMedia><span className="rounded-tag bg-field px-1 type-caption text-text-2 data">{i + 1}</span></ItemMedia>
            <ItemContent>
              <ItemTitle><ItemLink href="#">{s.title}</ItemLink></ItemTitle>
              <ItemDescription>{s.meta}</ItemDescription>
            </ItemContent>
          </Item>)}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
