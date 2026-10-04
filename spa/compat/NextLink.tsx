import React from 'react';
import { Link } from 'react-router-dom';

// Vite-only adapter: shared components retain real next/link in the Next.js build.
type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname?: string; query?: Record<string, string>; hash?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
};
const NextLink = React.forwardRef<HTMLAnchorElement, Props>(function NextLink({ href, prefetch, replace, scroll, shallow, passHref, legacyBehavior, locale, ...props }, ref) {
  const to = typeof href === 'string' ? href : `${href.pathname || ''}${href.query ? `?${new URLSearchParams(href.query)}` : ''}${href.hash || ''}`;
  return <Link ref={ref} to={to} replace={replace} {...props} />;
});
export default NextLink;
