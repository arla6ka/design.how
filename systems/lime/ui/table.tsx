import {cn} from '../lib/utils';

function Table({className, ...props}: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-wrapper" className="w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props}/>
    </div>
  );
}

function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b [&_tr]:border-line', className)} {...props}/>;
}

function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props}/>;
}

function TableFooter({className, ...props}: React.ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={cn('border-t border-line font-medium', className)} {...props}/>;
}

function TableRow({className, ...props}: React.ComponentProps<'tr'>) {
  return <tr data-slot="table-row" className={cn('border-b border-line transition-colors duration-(--dur-instant) hover:bg-surface data-[state=selected]:bg-accent-wash', className)} {...props}/>;
}

function TableHead({className, ...props}: React.ComponentProps<'th'>) {
  return <th data-slot="table-head" className={cn('h-10 px-3 text-start text-xs font-medium whitespace-nowrap text-fg-3 first:ps-2 last:pe-2', className)} {...props}/>;
}

function TableCell({className, ...props}: React.ComponentProps<'td'>) {
  return <td data-slot="table-cell" className={cn('h-12 px-3 align-middle text-fg first:ps-2 last:pe-2', className)} {...props}/>;
}

function TableCaption({className, ...props}: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('mt-3 text-xs text-fg-3', className)} {...props}/>;
}

export {Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption};
