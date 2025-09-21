// Application utility functions

import { Application, ApplicationStats, ApplicationStatus } from './types';

export const getStatusColor = (status: ApplicationStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-amber-400';
    case 'approved':
      return 'text-emerald-400';
    case 'rejected':
      return 'text-rose-400';
    case 'under_review':
      return 'text-blue-400';
    default:
      return 'text-muted-foreground';
  }
};

export const getStatusBadgeClass = (status: ApplicationStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'rejected':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'under_review':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted/20 text-muted-foreground border-muted/30';
  }
};

export const calculateApplicationStats = (applications: Application[]): ApplicationStats => {
  const total = applications.length;
  const pending = applications.filter(app => app.status === 'pending').length;
  const approved = applications.filter(app => app.status === 'approved').length;
  const rejected = applications.filter(app => app.status === 'rejected').length;
  const underReview = applications.filter(app => app.status === 'under_review').length;
  
  // Calculate recent activity (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCount = applications.filter(app => 
    new Date(app.created_at) >= oneWeekAgo
  ).length;

  // Calculate approval rate
  const processedApps = approved + rejected;
  const approvalRate = processedApps > 0 ? Math.round((approved / processedApps) * 100) : 0;

  return {
    total,
    pending,
    approved,
    rejected,
    underReview,
    recentCount,
    approvalRate
  };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString);
};

export const validateFormData = (formFields: any[], formData: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field of formFields) {
    const fieldKey = field.key || field.id;
    const value = formData[fieldKey]?.trim();

    if (field.required && !value) {
      errors[fieldKey] = `${field.label} is required`;
    } else if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      errors[fieldKey] = 'Please enter a valid email address';
    } else if (field.type === 'number' && value && isNaN(Number(value))) {
      errors[fieldKey] = 'Please enter a valid number';
    }
  }

  return errors;
};

export const generateApplicationReport = (applications: Application[]) => {
  const stats = calculateApplicationStats(applications);
  
  return {
    summary: {
      total_applications: stats.total,
      approval_rate: `${stats.approvalRate}%`,
      recent_activity: stats.recentCount,
      generated_at: new Date().toISOString()
    },
    status_breakdown: {
      pending: stats.pending,
      under_review: stats.underReview,
      approved: stats.approved,
      rejected: stats.rejected
    },
    applications: applications.map(app => ({
      id: app.id,
      applicant: app.profiles?.username || 'Unknown',
      email: app.profiles?.email,
      discord_name: app.discord_name,
      status: app.status,
      submitted_at: app.created_at,
      reviewed_at: app.reviewed_at,
      notes: app.notes
    }))
  };
};

export const ensureDiscordField = (fields: any[]) => {
  const discordField = {
    id: 'discord_name',
    label: 'Discord Username', 
    type: 'text',
    required: true,
    system: true
  };
  
  // Remove existing discord fields to prevent duplicates
  const filteredFields = fields.filter(f => f.id !== 'discord_name');
  return [discordField, ...filteredFields];
};