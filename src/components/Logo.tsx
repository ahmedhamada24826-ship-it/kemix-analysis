import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark" | "white";
  href?: string;
  width?: number;
  height?: number;
}

export function Logo({
  className = "",
  variant = "full",
  href = "/",
  width = 210,
  height = 54,
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative overflow-hidden rounded flex items-center justify-center">
        <Image
          src="/images/kemix-logo.png"
          alt="KEMIX Analysis"
          width={width}
          height={height}
          priority
          className="object-contain h-auto w-auto max-h-12"
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
