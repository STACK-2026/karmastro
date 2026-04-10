import { useState, type ReactNode } from "react";

interface Props {
  front: ReactNode;
  back: ReactNode;
  borderColor?: string;
  className?: string;
  backClassName?: string;
  cardRef?: (el: HTMLDivElement | null) => void;
}

/**
 * Flip card with grid-stack pattern : front and back share the same grid cell
 * so the container sizes itself to the taller face. Prevents overflow/decalage.
 * Each card has its own flipped state (no shared state bug between siblings).
 */
export const FlipCard = ({ front, back, borderColor, className = "", backClassName = "", cardRef }: Props) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      ref={cardRef}
      className="cursor-pointer h-full"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className="relative grid transition-transform duration-500 h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          gridTemplateAreas: '"stack"',
        }}
      >
        {/* Front */}
        <div
          className={`rounded-xl bg-card/60 backdrop-blur-sm p-6 text-center flex flex-col items-center justify-center ${className}`}
          style={{
            gridArea: "stack",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            border: borderColor ? `1px solid ${borderColor}` : undefined,
          }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm p-6 flex flex-col justify-center ${backClassName}`}
          style={{
            gridArea: "stack",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: borderColor ? `1px solid ${borderColor}` : undefined,
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
