import { NextRequest, NextResponse } from "next/server"

// Mock implementation for polling PvP game status
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock poll
  const status = {
    id: sessionId,
    status: "IN_PROGRESS",
    lastMove: { player: "player1", move: "e2-e4" },
    polledAt: new Date().toISOString()
  }

  return NextResponse.json(status, { status: 200 })
}