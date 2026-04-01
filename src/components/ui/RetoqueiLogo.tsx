/**
 * RetoqueiLogo — SVG logo component matching the brand identity.
 * The mark is a bold "Q" letterform with a diagonal slash/tail at the bottom-right,
 * rendered in the brand gold color (#C9A14A) on a dark rounded square background.
 */

interface LogoMarkProps {
  /** Size in px (width = height). Default 32. */
  size?: number
  /** Show rounded square background. Default true. */
  withBackground?: boolean
  /** Background color. Default brand dark. */
  bgColor?: string
  /** Mark color. Default brand gold. */
  color?: string
  className?: string
}

export function RetoqueiLogoMark({
  size = 32,
  withBackground = true,
  bgColor = '#0B0B0B',
  color = '#C9A14A',
  className,
}: LogoMarkProps) {
  const r = size * 0.18   // border radius
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Retoquei"
    >
      {withBackground && (
        <rect width="100" height="100" rx={r * (100 / size)} fill={bgColor} />
      )}
      {/* Outer ring of the Q */}
      <circle cx="47" cy="46" r="26" stroke={color} strokeWidth="13" />
      {/* Diagonal slash/tail — the distinctive brand element */}
      <line
        x1="63" y1="62"
        x2="81" y2="82"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LogoProps {
  /** Total height in px. Width scales proportionally. Default 32. */
  size?: number
  /** Show text "Retoquei" next to the mark. Default false. */
  withText?: boolean
  /** Text color. Default white. */
  textColor?: string
  /** Mark color. Default brand gold. */
  color?: string
  className?: string
}

export function RetoqueiLogo({
  size = 32,
  withText = false,
  textColor = '#FFFFFF',
  color = '#C9A14A',
  className,
}: LogoProps) {
  if (!withText) {
    return (
      <RetoqueiLogoMark
        size={size}
        color={color}
        withBackground
        className={className}
      />
    )
  }

  const fontSize = size * 0.55

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <RetoqueiLogoMark size={size} color={color} withBackground />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontFamily: 'inherit',
        }}
      >
        Retoquei
      </span>
    </div>
  )
}

/** Full horizontal wordmark — mark + text, for landing pages & auth screens */
export function RetoqueiWordmark({
  height = 40,
  color = '#C9A14A',
  textColor = '#FFFFFF',
  className,
}: {
  height?: number
  color?: string
  textColor?: string
  className?: string
}) {
  return (
    <RetoqueiLogo
      size={height}
      withText
      color={color}
      textColor={textColor}
      className={className}
    />
  )
}
