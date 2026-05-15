import Link from 'next/link'

function LogoContent() {
  return (
    <>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 22,
        letterSpacing: '0.05em',
        lineHeight: 1,
        color: 'var(--text)',
      }}>
        World Cup 2026
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 3,
        lineHeight: 1,
      }}>
        <span style={{
          fontSize: 8,
          fontWeight: 600,
          color: 'var(--text-faint)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          prediction game by
        </span>
        {/* m1c1 logo — transparent PNG, same visual weight as label text */}
        <img
          src="/m1c1-logo.png"
          alt="m1c1"
          style={{
            height: 7,
            width: 'auto',
            display: 'block',
            opacity: 1,
          }}
        />
      </div>
    </>
  )
}

export function NavLogo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} style={{textDecoration:'none',color:'var(--text)',flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
      <LogoContent />
    </Link>
  )
}

export function NavLogoBrand() {
  return (
    <div style={{flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
      <LogoContent />
    </div>
  )
}
