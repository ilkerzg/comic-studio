import { cn } from "@/lib/utils";

type Dialog = { speaker?: string; text: string };

type Props = {
  dialog: Dialog[];
  side?: "left" | "right" | "center";
  width?: number;
  tailDown?: boolean;
  rtl?: boolean;
};

export function SpeechBubbleStack({ dialog, side = "center", width = 260, tailDown = true, rtl }: Props) {
  if (!dialog.length) return null;
  const sorted = rtl ? [...dialog].reverse() : dialog;
  return (
    <div
      className={cn(
        "pointer-events-none flex flex-col gap-2",
        side === "left" ? "items-start" : side === "right" ? "items-end" : "items-center",
      )}
    >
      {sorted.map((d, i) => (
        <SpeechBubble
          key={i}
          dialog={d}
          width={width}
          tail={i === sorted.length - 1 ? (tailDown ? "bottom" : "none") : "none"}
          tailSide={side === "right" ? "right" : "left"}
        />
      ))}
    </div>
  );
}

function SpeechBubble({
  dialog,
  width,
  tail,
  tailSide,
}: {
  dialog: Dialog;
  width: number;
  tail: "bottom" | "none";
  tailSide: "left" | "right";
}) {
  const text = dialog.text.trim();
  const speaker = dialog.speaker?.trim();
  const isThought = text.startsWith("(") && text.endsWith(")");
  const isShout = text === text.toUpperCase() && text.length > 2;

  const body = isThought ? text.slice(1, -1).trim() : text;

  const approxCharsPerLine = Math.max(14, Math.floor(width / 9));
  const lines = Math.max(1, Math.ceil(body.length / approxCharsPerLine));
  const height = 34 + lines * 18 + (speaker ? 12 : 0);
  const tailH = tail === "bottom" ? 16 : 0;
  const tailAnchorX = tailSide === "left" ? 32 : width - 32;

  const strokeClass = isShout ? "stroke-[3]" : "stroke-[2]";
  const fontClass = isShout
    ? "font-[family-name:var(--font-display)] text-[15px] tracking-wider"
    : "text-[13px]";

  return (
    <svg
      viewBox={`0 0 ${width} ${height + tailH}`}
      width={width}
      height={height + tailH}
      className="drop-shadow-[2px_2px_0_oklch(0_0_0)]"
    >
      <defs>
        <filter id="ink" x="-1%" y="-1%" width="102%" height="102%">
          <feGaussianBlur stdDeviation="0" />
        </filter>
      </defs>

      {isThought ? (
        <g fill="white" stroke="black" className={strokeClass}>
          <rect x="4" y="4" rx={height / 2} ry={height / 2} width={width - 8} height={height - 8} />
          <circle cx={tailAnchorX - 24} cy={height + 2} r="4" />
          <circle cx={tailAnchorX - 14} cy={height + 8} r="2.5" />
        </g>
      ) : (
        <>
          <rect
            x="2"
            y="2"
            rx="14"
            ry="14"
            width={width - 4}
            height={height - 4}
            fill="white"
            stroke="black"
            className={strokeClass}
          />
          {tail === "bottom" && (
            <polygon
              points={`${tailAnchorX - 10},${height - 2} ${tailAnchorX + 10},${height - 2} ${
                tailAnchorX + (tailSide === "left" ? -4 : 4)
              },${height + tailH - 2}`}
              fill="white"
              stroke="black"
              className={strokeClass}
            />
          )}
        </>
      )}

      <foreignObject x="14" y="10" width={width - 28} height={height - 20}>
        <div
          className={cn(
            "flex h-full w-full flex-col justify-center text-center leading-[1.15] text-black",
            fontClass,
          )}
        >
          {speaker && (
            <div className="mb-0.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-black/55">
              {speaker}
            </div>
          )}
          <div className="break-words">{body}</div>
        </div>
      </foreignObject>
    </svg>
  );
}
