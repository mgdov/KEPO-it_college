import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting whose turn it is in PvP game
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock turn
  const turn = {
    id: sessionId,
    currentTurn: "player1",
    timeLeft: 300 // seconds
  }

  return NextResponse.json(turn, { status: 200 })
}