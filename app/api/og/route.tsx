// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const teamA = searchParams.get('teamA') || 'Team A';
    const teamB = searchParams.get('teamB') || 'Team B';
    const sport = searchParams.get('sport') || 'cricket';
    const isCricket = sport === 'cricket';

    // ক্রিকেট প্যারামিটারস
    const score = searchParams.get('score') || '0';
    const wickets = searchParams.get('wickets') || '0';
    const overs = searchParams.get('overs') || '0.0';

    // ফুটবল প্যারামিটারস
    const scoreA = searchParams.get('scoreA') || '0';
    const scoreB = searchParams.get('scoreB') || '0';
    const half = searchParams.get('half') || 'FULL TIME';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#06080F',
            fontFamily: 'sans-serif',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '40px 60px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: isCricket ? '#3b82f6' : '#10b981' }} />
            <span style={{ color: '#ef4444', fontSize: 28, fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase' }}>
              NEXSCORE {sport} LIVE
            </span>
          </div>
          
          {/* Match Title */}
          <div style={{ display: 'flex', color: '#ffffff', fontSize: 60, fontWeight: 900, marginBottom: '35px', textAlign: 'center' }}>
            {teamA} <span style={{ color: '#64748b', margin: '0 20px' }}>VS</span> {teamB}
          </div>

          {/* Dynamic Scorecard Display */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              padding: isCricket ? '24px 70px' : '24px 90px',
              borderRadius: '24px',
              border: '2px solid #334155',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            {isCricket ? (
              <>
                <div style={{ display: 'flex', color: '#3b82f6', fontSize: 105, fontWeight: 900, lineHeight: 1 }}>
                  {score}<span style={{ color: '#64748b', fontSize: 75, margin: '0 10px' }}>/</span>{wickets}
                </div>
                <div style={{ display: 'flex', color: '#94a3b8', fontSize: 30, fontWeight: 700, marginTop: 18 }}>
                  OVERS: <span style={{ color: '#ffffff', marginLeft: 12 }}>{overs}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', color: '#10b981', fontSize: 110, fontWeight: 900, lineHeight: 1 }}>
                  {scoreA} <span style={{ color: '#64748b', margin: '0 25px', fontSize: 80 }}>-</span> {scoreB}
                </div>
                <div style={{ display: 'flex', color: '#fbbf24', fontSize: 28, fontWeight: 800, marginTop: 18, letterSpacing: '2px' }}>
                  {half}
                </div>
              </>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return new Response(`Failed to generate social preview image`, { status: 500 });
  }
}