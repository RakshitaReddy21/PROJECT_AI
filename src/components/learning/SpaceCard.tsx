import React from 'react';
import { Space } from '../../types';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { HoverCard, AnimatedNumber } from '../motion';
import { Cpu, Brain, Atom, Folder, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SpaceCardProps {
  space: Space;
  activeProjectNames?: string[];
  overallProgress?: number;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  activeProjectNames = [],
  overallProgress = 0,
}) => {
  const iconMap: Record<string, any> = {
    Cpu,
    Brain,
    Atom,
    Folder,
  };

  const Icon = iconMap[space.icon] || Folder;

  return (
    <Link to={`/spaces/${space.id}`} className="block group">
      <HoverCard yOffset={-8} scale={1.015} className="h-full">
        <Card className="p-6 bg-white border border-[#F4E3D8] rounded-xl flex flex-col justify-between h-full relative overflow-hidden group-hover:border-[#FFC8B0] group-hover:shadow-float transition-all duration-200">
          {/* Layer 1: Background Visual & Soft Peach Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#FF7A18] to-[#FFEBE0] opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FFEBE0]/70 rounded-full blur-xl group-hover:bg-[#FFC8B0]/50 transition-all pointer-events-none" />

          {/* Layer 2: Content */}
          <div className="relative z-10">
            {/* Header Badge & Subject Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: space.color || '#FF6B35' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint font-semibold">
                    Subject World
                  </span>
                  <h3 className="font-display text-lg font-semibold text-[#1F1917] group-hover:text-[#E85A2A] transition-colors leading-tight">
                    {space.name}
                  </h3>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#FFF8F4] border border-[#F4E3D8] flex items-center justify-center text-[#574E4A] group-hover:bg-[#FFEBE0] group-hover:text-[#FF6B35] group-hover:border-[#FFC8B0] transition-all">
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>

            <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-4">
              {space.description}
            </p>

            {/* Overall Progress Bar */}
            <div className="p-3 bg-[#FFF8F4] rounded-lg border border-[#F4E3D8] space-y-1.5 mb-4 group-hover:border-[#FFC8B0]/60 transition-colors">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-ink-faint text-[11px] font-medium">Domain Mastery</span>
                <span className="font-semibold text-[#E85A2A]">
                  <AnimatedNumber value={overallProgress} suffix="%" />
                </span>
              </div>
              <ProgressBar value={overallProgress} size="sm" variant="indigo" />
            </div>

            {/* Active Projects List Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                {space.projectCount} {space.projectCount === 1 ? 'Project Mission' : 'Projects In World'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeProjectNames.length > 0 ? (
                  activeProjectNames.map((pName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-[11px] font-mono bg-white border border-[#F4E3D8] text-[#574E4A] rounded-md group-hover:border-[#FFC8B0] transition-colors truncate max-w-[180px]"
                    >
                      {pName}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] font-mono text-ink-faint italic">No projects created yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Layer 3: Hover Action Layer */}
          <div className="relative z-10 mt-5 pt-3 border-t border-[#F4E3D8] flex items-center justify-between text-[11px] font-mono text-ink-faint">
            <span>Updated {new Date(space.updatedAt || space.createdAt || Date.now()).toLocaleDateString()}</span>
            <span className="text-[#FF6B35] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Space <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Card>
      </HoverCard>
    </Link>
  );
};
