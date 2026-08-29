import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // URL থেকে ডেটা নিচ্ছি, না পেলে ডিফল্ট ভ্যালু দেখাবে
    const teamA = searchParams.get('teamA') || 'Team A';
    const teamB = searchParams.get('teamB') || 'Team B';
    const score = searchParams.get('score') || '0';
    const wickets = searchParams.get('wickets') || '0';
    const overs = searchParams.get('overs') || '0.0';
    const sport = searchParams.get('sport') || 'cricket';

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
            backgroundColor: '#0f172a', // Tailwind slate-950
            fontFamily: 'sans-serif',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        >
          <div style={{ display: 'flex', color: '#ef4444', fontSize: 32, fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 20 }}>
            NEXSCORE {sport} RESULT
          </div>
          
          <div style={{ display: 'flex', color: 'white', fontSize: 72, fontWeight: '900', marginBottom: 40 }}>
            {teamA} <span style={{ color: '#475569', margin: '0 20px' }}>VS</span> {teamB}
          </div>

          <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '20px 60px', borderRadius: '20px', border: '2px solid #334155', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#3b82f6', fontSize: 120, fontWeight: 'black', lineHeight: 1 }}>
              {score}<span style={{ color: '#64748b', fontSize: 80, margin: '0 10px' }}>/</span>{wickets}
            </div>
            <div style={{ display: 'flex', color: '#94a3b8', fontSize: 36, fontWeight: 'bold', marginTop: 20 }}>
              OVERS: <span style={{ color: 'white', marginLeft: 15 }}>{overs}</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // Cache Headers Added
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}