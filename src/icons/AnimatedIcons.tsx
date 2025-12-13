// src/icons/AnimatedIcons.tsx
// Fully TS-safe, animated neon SVG icons for Night Core Console



const baseProps = {
  width: 18,
  height: 18,
  fill: "none",
  strokeWidth: 2,
  className: "nc-icon-svg",
};

// Neon animation is handled via CSS (.nc-icon-svg)
export const IconDashboard = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
    <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
    <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
    <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
  </svg>
);

export const IconTenants = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <circle cx="12" cy="6" r="3" />
    <circle cx="5" cy="11" r="2" />
    <circle cx="19" cy="11" r="2" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinecap="round" />
    <path d="M3 21v-2a3 3 0 0 1 3-3" strokeLinecap="round" />
    <path d="M18 21v-2a3 3 0 0 0-3-3" strokeLinecap="round" />
  </svg>
);

export const IconProof = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <path d="M12 2l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-4z" strokeLinecap="round" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" />
  </svg>
);

export const IconTimeline = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" strokeLinecap="round" />
  </svg>
);

export const IconAnomaly = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#FF4D67">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h17a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      strokeLinecap="round"
    />
    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

export const IconBackend = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <rect x="3" y="3" width="18" height="8" rx="2" />
    <rect x="3" y="13" width="18" height="8" rx="2" />
    <circle cx="7" cy="7" r="1" />
    <circle cx="7" cy="17" r="1" />
  </svg>
);

export const IconSettings = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <circle cx="12" cy="12" r="3" />
    <path d="
      M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06
      a2 2 0 1 1-2.83 2.83l-.06-.06
      A1.65 1.65 0 0 0 15 19.4
      a1.65 1.65 0 0 0-1.82.33l-.06.06
      a2 2 0 1 1-2.83 0l-.06-.06
      A1.65 1.65 0 0 0 8.6 19.4
      A1.65 1.65 0 0 0 6.78 19l-.06.06
      A2 2 0 1 1 3.89 16.2l.06-.06
      A1.65 1.65 0 0 0 4.6 15
      A1.65 1.65 0 0 0 4.27 13.18l-.06-.06
      A2 2 0 1 1 7.04 10.29l.06.06
      A1.65 1.65 0 0 0 9 8.6
      a1.65 1.65 0 0 0 1.82-.33l.06-.06
      a2 2 0 1 1 2.83 0l.06.06
      A1.65 1.65 0 0 0 15 8.6
      a1.65 1.65 0 0 0 1.82.33l.06-.06
      a2 2 0 1 1 2.83 2.83l-.06.06
      A1.65 1.65 0 0 0 19.4 15z"
      strokeLinecap="round"
    />
  </svg>
);

export const IconAbout = () => (
  <svg {...baseProps} viewBox="0 0 24 24" stroke="#9BD3F8">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1" />
  </svg>
);

export default {
  IconDashboard,
  IconTenants,
  IconProof,
  IconTimeline,
  IconAnomaly,
  IconBackend,
  IconSettings,
  IconAbout,
};
