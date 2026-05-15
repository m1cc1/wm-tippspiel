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
        <span style={{fontSize:9,fontWeight:300,letterSpacing:'0.05em',fontFamily:"'Outfit','Nunito','Inter Tight',sans-serif",color:'var(--text-faint)',lineHeight:1}}>m<span style={{fontSize:6.5,verticalAlign:'-0.5px'}}>1</span>c<span style={{fontSize:6.5,verticalAlign:'-0.5px'}}>1</span></span>
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
