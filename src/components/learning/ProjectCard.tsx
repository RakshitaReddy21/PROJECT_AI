import React from 'react';
import { Project } from '../../types';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { HoverCard, AnimatedNumber } from '../motion';
import { FileText, BookOpen, ArrowRight, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Link to={`/projects/${project.id}/overview`} className="block group">
      <HoverCard yOffset={-8} scale={1.015} className="h-full">
        <Card className="p-6 bg-white border border-[#F4E3D8] rounded-xl flex flex-col justify-between h-full relative overflow-hidden group-hover:border-[#FFC8B0] group-hover:shadow-float transition-all duration-200">
          {/* Subtle top accent gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#FF7A18] to-[#FFEBE0] opacity-80 group-hover:opacity-100 transition-opacity" />

          <div>
            {/* Mission Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-[#E85A2A] font-semibold uppercase tracking-wider bg-[#FFEBE0] px-2 py-0.5 rounded border border-[#FFC8B0]/80">
                Mission Journey
              </span>
              <div className="flex items-center space-x-1 text-xs font-mono font-semibold text-[#FF6B35] bg-[#FFEBE0] border border-[#FFC8B0] px-2.5 py-0.5 rounded-full shadow-sm">
                <AnimatedNumber value={project.masteryScore} suffix="%" />
                <span className="text-[10px] text-ink-faint">Mastery</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-semibold text-[#1F1917] group-hover:text-[#E85A2A] transition-colors leading-tight">
              {project.title}
            </h3>
            <p className="text-xs text-ink-soft mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            {/* Target Goal & Current Focus */}
            <div className="mt-4 p-3 bg-[#FFF8F4] rounded-lg border border-[#F4E3D8] space-y-1.5 group-hover:border-[#FFC8B0]/50 transition-colors">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-ink-faint font-semibold uppercase">
                <Target className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Mission Target Goal</span>
              </div>
              <p className="text-xs text-ink line-clamp-1 font-sans">{project.targetGoal || 'Master foundational and advanced concepts'}</p>

              {/* Current Focus indicator */}
              <div className="pt-1.5 border-t border-[#F4E3D8] flex items-center justify-between text-[10px] font-mono">
                <span className="text-ink-faint flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FF7A18]" /> Current Focus:
                </span>
                <span className="text-[#E85A2A] font-semibold">Active Vector Synthesis</span>
              </div>
            </div>

            {/* Progress Bar & Telemetry */}
            <div className="mt-4 space-y-2">
              <ProgressBar value={project.masteryScore} size="sm" variant="indigo" />
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-faint">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#FF6B35]" />
                  {project.materialCount} materials ingested
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#FF7A18]" />
                  {project.conceptCount} concepts indexed
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-3 border-t border-[#F4E3D8] flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-ink-faint">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
            <span className="font-semibold text-[#FF6B35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Take Assessment <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Card>
      </HoverCard>
    </Link>
  );
};
