import type { ReactNode } from 'react';

/** Shared frame for every interactive widget. */
export default function Widget({
  title,
  tag = 'Interactive',
  children,
  className = '',
}: {
  title: string;
  tag?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`widget ${className}`}>
      <div className="widget-head">
        <span className="tag">{tag}</span>
        <span>{title}</span>
      </div>
      <div className="widget-body">{children}</div>
    </div>
  );
}
