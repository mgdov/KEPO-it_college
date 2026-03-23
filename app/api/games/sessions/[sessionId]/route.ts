import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting a game session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock session data
  const session = {
    id: sessionId,
    gameType: "CHESS",
    status: "IN_PROGRESS",
    players: ["player1", "player2"],
    currentTurn: "player1"
  }

  return NextResponse.json(session, { status: 200 })
}