import React from 'react';

const Icon = ({ children, className = '', size, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    width={size}
    height={size}
    {...rest}
  >
    {children}
  </svg>
);

export const ArrowIcon = (p) => <Icon className="arrow" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const ArrowUpRightIcon = (p) => <Icon {...p}><path d="M7 17 17 7M8 7h9v9" /></Icon>;
export const MicIcon = (p) => <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>;
export const StopIcon = (p) => <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2.5" /></Icon>;
export const CameraIcon = (p) => <Icon {...p}><path d="M15 10.5 20 7v10l-5-3.5" /><rect x="3" y="6" width="12" height="12" rx="2.5" /></Icon>;
export const PlayIcon = (p) => <Icon {...p}><path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5Z" fill="currentColor" stroke="none" /></Icon>;
export const PauseIcon = (p) => <Icon {...p}><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /></Icon>;
export const PrevIcon = (p) => <Icon {...p}><path d="M18 6 9 12l9 6V6ZM6 6v12" /></Icon>;
export const NextIcon = (p) => <Icon {...p}><path d="m6 6 9 6-9 6V6ZM18 6v12" /></Icon>;
export const ReplayIcon = (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Icon>;
export const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
export const CopyIcon = (p) => <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></Icon>;
export const CheckIcon = (p) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Icon>;
export const SpeakerIcon = (p) => <Icon {...p}><path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></Icon>;
export const UndoIcon = (p) => <Icon {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Icon>;
export const TrashIcon = (p) => <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>;
export const SpaceIcon = (p) => <Icon {...p}><path d="M4 10v4h16v-4" /></Icon>;
export const CloseIcon = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const SparkleIcon = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Icon>;
export const HandIcon = (p) => <Icon {...p}><path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11M15 10V4.5a1.5 1.5 0 0 0-3 0V10M12 10V5.5a1.5 1.5 0 0 0-3 0V12" /><path d="M9 12V8.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h.5a6.5 6.5 0 0 0 4.6-1.9l.6-.6A6.5 6.5 0 0 0 21 14v-2.5a1.5 1.5 0 0 0-3 0" /></Icon>;
export const WaveIcon = (p) => <Icon {...p}><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" /></Icon>;
export const BookIcon = (p) => <Icon {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></Icon>;
export const GameIcon = (p) => <Icon {...p}><rect x="2.5" y="7" width="19" height="11" rx="5.5" /><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></Icon>;
export const TrophyIcon = (p) => <Icon {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></Icon>;
export const FlameIcon = (p) => <Icon {...p}><path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2 1.5-3 3.5-3 5.5-1.2-.8-2-2-2.2-3.5C7.5 9 5 11.5 5 15a7 7 0 0 0 7 7Z" /></Icon>;
export const ShuffleIcon = (p) => <Icon {...p}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></Icon>;
export const BulbIcon = (p) => <Icon {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></Icon>;
export const SkipIcon = (p) => <Icon {...p}><path d="M5 5l10 7-10 7V5ZM19 5v14" /></Icon>;
export const QuestionIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></Icon>;
export const LayersIcon = (p) => <Icon {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Icon>;
export const CpuIcon = (p) => <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></Icon>;
export const GlobeIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>;
export const ServerIcon = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></Icon>;
