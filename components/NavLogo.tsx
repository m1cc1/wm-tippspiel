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
        fontSize: 8,
        fontWeight: 600,
        color: 'var(--text-faint)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: "'Inter Tight', sans-serif",
        whiteSpace: 'nowrap',
        marginTop: 3,
      }}>
        prediction game by MICI
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
