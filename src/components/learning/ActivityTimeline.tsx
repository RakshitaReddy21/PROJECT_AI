import React from 'react';
import { ActivityItem } from '../../types';
import { FileText, MessageSquare, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const iconMap = {
    material_uploaded: FileText,
    tutor_queried: MessageSquare,
    quiz_completed: CheckCircle2,
    assessment_submitted: Sparkles,
    mastery_changed: TrendingUp,
  };

  if (activities.length === 0) {
    return <p className="text-xs text-ink-faint text-center py-4">No recent activity recorded.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F4E3D8]">
      {activities.map((item) => {
        const Icon = iconMap[item.type] || Sparkles;

        return (
          <div key={item.id} className="relative group">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#FFEBE0] border border-[#FFC8B0] flex items-center justify-center text-[#FF6B35] group-hover:border-[#E85A2A] transition-colors shadow-sm">
              <Icon className="w-3 h-3" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">{item.description}</p>
                <span className="text-[10px] font-mono text-ink-faint">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {item.projectTitle && (
                <span className="inline-block mt-0.5 text-[10px] font-mono text-[#E85A2A] bg-[#FFEBE0] border border-[#FFC8B0]/80 px-1.5 py-0.5 rounded">
                  {item.projectTitle}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
