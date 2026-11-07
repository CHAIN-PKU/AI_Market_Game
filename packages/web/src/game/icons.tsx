import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.6v8.8M9.4 9.4h4a2 2 0 0 1 0 4h-4h4.4" />
    </Icon>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.5-3 2.7-4.6 5.5-4.6s5 1.6 5.5 4.6" />
      <circle cx="17" cy="9.5" r="2.2" />
      <path d="M16 14.6c2.3.1 4 1.5 4.5 4" />
    </Icon>
  );
}

export function RoundIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
      <path d="M9 14.5h.01M12 14.5h.01M15 14.5h.01" />
    </Icon>
  );
}

export function TaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.8h10a2 2 0 0 1 2 2v14.4l-7-3-7 3V5.8a2 2 0 0 1 2-2Z" />
      <path d="M9 8.5h6M9 12h4" />
    </Icon>
  );
}

export function SkillIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.7 8l4.8.3-3.7 3 1.2 4.6-4-2.5-4 2.5 1.2-4.6-3.7-3L9.3 8 12 3.5Z" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14.2 3h-4.4l-.3 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2l.3 2.6h4.4l.3-2.6a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="5.5" width="3.6" height="13" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.4" y="5.5" width="3.6" height="13" rx="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function StepIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 5.5v13l8-6.5-8-6.5Z" fill="currentColor" stroke="none" />
      <path d="M17.5 5.5v13" />
    </Icon>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 10a7.5 7.5 0 1 1 1.8 6.6" />
      <path d="M4.5 5.5V10h4.6" />
    </Icon>
  );
}

export function SpeedIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 16a8 8 0 1 1 15 0" />
      <path d="M12 12.5 15.6 9" />
      <circle cx="12" cy="13.2" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m8.5 7.5-4 4.5 4 4.5M15.5 7.5l4 4.5-4 4.5M13.4 5.5l-2.8 13" />
    </Icon>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 3.8h5M10.5 3.8v5.1L5.7 17a2 2 0 0 0 1.7 3h9.2a2 2 0 0 0 1.7-3l-4.8-8.1V3.8" />
      <path d="M7.6 14.5h8.8" />
    </Icon>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.6 0 2.2-1 1.6-2.2-.7-1.4.2-2.4 1.8-2.4h2.2c1.7 0 2.9-1.2 2.9-3A8.5 8.5 0 0 0 12 3.5Z" />
      <circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="9.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="7.6" cy="13" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </Icon>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.5 8 4.5v8l-8 4.5-8-4.5v-8l8-4.5Z" />
      <path d="m4.4 8.2 7.6 4.3 7.6-4.3M12 12.5V21" />
    </Icon>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7.5V12l3.2 2" />
      <path d="M4.6 9.5A8 8 0 1 1 4 14" />
      <path d="M4.5 4.8V9h4.2" />
    </Icon>
  );
}

export function MarketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 9.5h15M5.5 9.5V19h13V9.5" />
      <path d="M4.5 9.5 6.2 5h11.6l1.7 4.5" />
      <path d="M9.5 19v-5h5v5" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 8h.01" />
    </Icon>
  );
}

export function RoleIcon({ role, ...props }: IconProps & { role: 'coding' | 'research' | 'design' }) {
  if (role === 'coding') return <CodeIcon {...props} />;
  if (role === 'research') return <FlaskIcon {...props} />;
  return <PaletteIcon {...props} />;
}
