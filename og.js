import { ImageResponse } from '@vercel/og';

// Configure to run on Edge for fast image generation
export const config = {
  runtime: 'edge',
};

export default function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || 'world-world';

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
            backgroundColor: '#111',
            fontSize: 60,
            letterSpacing: -2,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              backgroundImage: 'linear-gradient(90deg, #00ff00, #00ffff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {text}
          </div>
          <div
            style={{
              fontSize: 30,
              marginTop: 20,
              color: '#888',
              fontWeight: 400,
            }}
          >
            Edit GitHub repos on the go
          </div>
        </div>
      ),
      {
        width: 600,
        height: 400,
      }
    );
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
