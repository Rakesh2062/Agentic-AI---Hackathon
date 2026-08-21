// Utility formatters

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - d) / 1000);

    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch (e) {
    return "";
  }
}

export function getSLARemaining(slaDeadline) {
  if (!slaDeadline) return { isOverdue: false, text: "No SLA set", urgent: false };
  try {
    const deadline = new Date(slaDeadline);
    const now = new Date();
    const diffMs = deadline - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) {
      const overdueHours = Math.abs(diffHours);
      return {
        isOverdue: true,
        text: `Overdue by ${overdueHours === 0 ? '< 1' : overdueHours}h`,
        urgent: true,
        hoursLeft: diffHours,
      };
    }

    if (diffHours <= 4) {
      return {
        isOverdue: false,
        text: `${diffHours}h remaining`,
        urgent: true,
        hoursLeft: diffHours,
      };
    }

    return {
      isOverdue: false,
      text: `${diffHours}h remaining`,
      urgent: false,
      hoursLeft: diffHours,
    };
  } catch (e) {
    return { isOverdue: false, text: "Invalid SLA", urgent: false };
  }
}

export function truncateText(text, maxLength = 80) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
