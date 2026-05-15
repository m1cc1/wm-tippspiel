import Link from 'next/link'

// m1c1 logo — rendered in code, no image file needed
// Nunito 300 matches the thin geometric sans of the original logo
const M1C1 = () => (
  <span style={{
    fontSize: 17,
    fontWeight: 300,
    letterSpacing: '0.06em',
    fontFamily: "'Nunito', 'DM Sans', 'Inter Tight', sans-serif",
    color: 'var(--text)',
    lineHeight: 1,
    display: 'inline-block',
  }}>
    m1c1
  </span>
)

export function NavLogo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} style={{textDecoration:'none',color:'var(--text)',flexShrink:0,display:'flex',flexDirection:'column',gap:3}}>
      <LogoContent />
    </Link>
  )
}

export function NavLogoBrand() {
  return (
    <div style={{flexShrink:0,display:'flex',flexDirection:'column',gap:3}}>
      <LogoContent />
    </div>
  )
}

function LogoContent() {
  return (
    <>
      {/* World Cup 2026 — Bebas Neue */}
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 22,
        letterSpacing: '0.05em',
        lineHeight: 1,
        color: 'var(--text)',
      }}>
        World Cup 2026
      </div>
      {/* prediction game by m1c1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        lineHeight: 1,
      }}>
        <span style={{
          fontSize: 8,
          fontWeight: 600,
          color: 'var(--text-faint)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          prediction game by
        </span>
        <M1C1 />
      </div>
    </>
  )
}
