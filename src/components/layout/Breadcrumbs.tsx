import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-ink-faint">
      <Link to="/dashboard" className="hover:text-ink transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formatted = value.replace(/-/g, ' ').replace(/^proj-/, 'Project ').replace(/^space-/, 'Space ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-line" />
            {isLast ? (
              <span className="font-medium text-ink capitalize truncate max-w-[150px]">{formatted}</span>
            ) : (
              <Link to={to} className="hover:text-ink capitalize transition-colors truncate max-w-[120px]">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
