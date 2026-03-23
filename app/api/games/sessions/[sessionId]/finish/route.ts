import { NextRequest, NextResponse } from "next/server"

// Mock implementation for finishing a game session
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock finish
  const result = {
    id: sessionId,
    status: "FINISHED",
    winner: "player1",
    finishedAt: new Date().toISOString()
  }

  return NextResponse.json(result, { status: 200 })
}