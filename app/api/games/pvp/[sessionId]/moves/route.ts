import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting moves in PvP game
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  // Mock moves
  const moves = [
    { player: "player1", move: "e2-e4", timestamp: new Date().toISOString() },
    { player: "player2", move: "e7-e5", timestamp: new Date().toISOString() }
  ]

  return NextResponse.json(moves, { status: 200 })
}