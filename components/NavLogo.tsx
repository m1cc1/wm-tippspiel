import Link from 'next/link'

// The nav logo — used on all logged-in pages via Navbar
// and inline on homepage/login
export function NavLogo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} style={{textDecoration:'none',color:'var(--text)',flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
      {/* World Cup 2026 — Bebas Neue */}
      <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:'0.05em',lineHeight:1,color:'var(--text)'}}>
        World Cup 2026
      </div>
      {/* prediction game by m1c1 logo image */}
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
        <span style={{fontSize:8,fontWeight:500,color:'var(--text-faint)',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>
          prediction game by
        </span>
        <img
          src="/m1c1-logo.jpg"
          alt="m1c1"
          style={{
            height:14,
            width:'auto',
            display:'block',
            mixBlendMode:'multiply',  // blends white bg of logo with cream page bg
            opacity:0.85,
          }}
        />
      </div>
    </Link>
  )
}

// Same logo but as a div (not a link) — for homepage nav where we handle click ourselves
export function NavLogoBrand({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{cursor:onClick?'pointer':'default',flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:'0.05em',lineHeight:1,color:'var(--text)'}}>
        World Cup 2026
      </div>
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
        <span style={{fontSize:8,fontWeight:500,color:'var(--text-faint)',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>
          prediction game by
        </span>
        <img
          src="/m1c1-logo.jpg"
          alt="m1c1"
          style={{height:14,width:'auto',display:'block',mixBlendMode:'multiply',opacity:0.85}}
        />
      </div>
    </div>
  )
}
