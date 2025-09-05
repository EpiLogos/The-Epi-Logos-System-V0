/**
 * Typography component for the Epi-Logos System
 * Implements the design system with Ranade (headings) and Work Sans (body)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'font-heading text-4xl font-bold leading-tight tracking-tight',
      h2: 'font-heading text-3xl font-bold leading-tight tracking-tight',
      h3: 'font-heading text-2xl font-semibold leading-tight',
      h4: 'font-heading text-xl font-semibold leading-tight',
      h5: 'font-heading text-lg font-medium leading-tight',
      h6: 'font-heading text-base font-medium leading-tight',
      body: 'font-sans text-base leading-relaxed',
      bodyLarge: 'font-sans text-lg leading-relaxed',
      bodySmall: 'font-sans text-sm leading-relaxed',
      caption: 'font-sans text-xs leading-normal text-muted-foreground',
      lead: 'font-sans text-xl leading-relaxed text-muted-foreground',
      quote: 'font-heading text-lg italic leading-relaxed border-l-4 border-primary pl-4',
      code: 'font-mono text-sm bg-muted px-1.5 py-0.5 rounded',
    },
    color: {
      default: '',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: keyof React.JSX.IntrinsicElements;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    // Map variants to appropriate HTML elements
    const elementMap = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      body: 'p',
      bodyLarge: 'p',
      bodySmall: 'p',
      caption: 'span',
      lead: 'p',
      quote: 'blockquote',
      code: 'code',
    } as const;

    const Component = as || (variant ? elementMap[variant] : 'p') || 'p';

    return React.createElement(Component as any, {
      className: cn(typographyVariants({ variant, color, className })),
      ref,
      ...props,
    });
  }
);

Typography.displayName = 'Typography';

export { Typography, typographyVariants };

// Convenience components for common use cases
export const Heading1 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="h1" as="h1" ref={ref} {...props} />
);
Heading1.displayName = 'Heading1';

export const Heading2 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="h2" as="h2" ref={ref} {...props} />
);
Heading2.displayName = 'Heading2';

export const Heading3 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="h3" as="h3" ref={ref} {...props} />
);
Heading3.displayName = 'Heading3';

export const BodyText = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="body" as="p" ref={ref} {...props} />
);
BodyText.displayName = 'BodyText';

export const Caption = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="caption" as="span" ref={ref} {...props} />
);
Caption.displayName = 'Caption';

export const Lead = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="lead" as="p" ref={ref} {...props} />
);
Lead.displayName = 'Lead';

export const Quote = React.forwardRef<HTMLQuoteElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="quote" as="blockquote" ref={ref} {...props} />
);
Quote.displayName = 'Quote';

export const InlineCode = React.forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography variant="code" as="code" ref={ref} {...props} />
);
InlineCode.displayName = 'InlineCode';
