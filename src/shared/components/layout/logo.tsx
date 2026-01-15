import { Link } from '@tanstack/react-router';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 32,
  showText = false,
  className = '',
}: LogoProps) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      <img
        src="/logo.webp"
        alt="Parcener Logo"
        width={size}
        height={size}
        style={{
          aspectRatio: '1/1',
          borderRadius: size * 0.3,
        }}
      />
      {showText && (
        <span
          className="font-bold tracking-tight text-slate-900"
          style={{ fontSize: `${size * 0.6}px` }}
        >
          Parcener
        </span>
      )}
    </Link>
  );
}
