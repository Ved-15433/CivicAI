import { 
  MapPin, 
  Award, 
  Zap, 
  CheckCircle2, 
  Users, 
  ShieldAlert, 
  Heart 
} from 'lucide-react';

export const ALL_BADGES = [
  { id: 'first_report', title: 'First Report', icon: MapPin, description: 'Submitted your first civic report', condition: (user) => user.report_count >= 1 },
  { id: 'civic_starter', title: 'Civic Starter', icon: Award, description: 'Submitted 5 reports', condition: (user) => user.report_count >= 5 },
  { id: 'power_reporter', title: 'Power Reporter', icon: Zap, description: 'Submitted 10 reports', condition: (user) => user.report_count >= 10 },
  { id: 'resolved_1', title: 'Problem Solver', icon: CheckCircle2, description: 'Had at least 1 issue resolved', condition: (user) => user.resolved_count >= 1 },
  { id: 'impact_10', title: 'Voice of Ten', icon: Users, description: 'Impacted 10 or more citizens', condition: (user) => (user.citizens_impacted || 0) >= 10 },
  { id: 'high_priority', title: 'Critical Scout', icon: ShieldAlert, description: 'Reported 3 high-severity issues', condition: (user) => user.high_severity_count >= 3 },
  { id: 'civic_supporter', title: 'Civic Supporter', icon: Heart, description: 'Supported 5 reports by others', condition: (user) => user.support_count >= 5 }
];

export const getUnlockedBadges = (userStats) => {
  if (!userStats) return [];
  return ALL_BADGES.filter(badge => badge.condition(userStats));
};
