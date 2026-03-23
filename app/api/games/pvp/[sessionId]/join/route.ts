import { NextRequest, NextResponse } from "next/server"

// Mock implementation for joining a PvP game
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock join
  const result = {
    id: sessionId,
    status: "IN_PROGRESS",
    players: ["player1", "player2"],
    joinedAt: new Date().toISOString()
  }

  return NextResponse.json(result, { status: 200 })
}