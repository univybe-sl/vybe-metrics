import Image from "next/image";

/** Univybe mascot, cropped to the face inside a circle. */
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full bg-[#f3f3f3] ring-2 ring-accent/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/mascot.jpg"
        alt="Univybe"
        fill
        sizes={`${size * 2}px`}
        priority
        className="origin-[50%_28%] scale-[1.45] object-cover"
      />
    </span>
  );
}
