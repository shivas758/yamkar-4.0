import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Handle the protocol-specific URL
    // This is where you would implement your custom protocol handling logic
    const protocolData = parseProtocolUrl(url);

    return NextResponse.json({
      message: 'Protocol handled successfully',
      data: protocolData
    });
  } catch (error) {
    console.error('Error handling protocol:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseProtocolUrl(url: string) {
  // Remove the protocol prefix
  const cleanUrl = url.replace('web+yamkar://', '');
  
  // Parse the URL components
  const [path, ...params] = cleanUrl.split('?');
  const queryParams = new URLSearchParams(params.join('?'));
  
  return {
    path,
    params: Object.fromEntries(queryParams)
  };
} 