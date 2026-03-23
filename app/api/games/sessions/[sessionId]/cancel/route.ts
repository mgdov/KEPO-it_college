import { NextRequest, NextResponse } from "next/server"

// Mock implementation for canceling a game session
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock cancel
  const result = {
    id: sessionId,
    status: "CANCELLED",
    cancelledAt: new Date().toISOString()
  }

  return NextResponse.json(result, { status: 200 })
}