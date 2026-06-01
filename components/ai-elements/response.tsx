'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

interface MarkdownLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

export const MarkdownLink: React.FC<MarkdownLinkProps> = ({ href, children, ...rest }) => {

  // If href is undefined or not a string, fallback
  if (!href) {
    return <a {...rest}>{children}</a>;
  }

  const isInternal = href.startsWith('/');

  if (isInternal) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  } else {
    return (
      <a className="text-primary underline" href={href} rel="noopener noreferrer" {...rest} data-feedback>
        {children}
      </a>
    );
  }
};

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
