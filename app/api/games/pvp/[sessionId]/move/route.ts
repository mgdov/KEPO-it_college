import { NextRequest, NextResponse } from "next/server"

// Mock implementation for making a move in PvP game
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params
  const body = await request.json()

  // Mock move
  const result = {
    id: sessionId,
    move: body.move,
    status: "IN_PROGRESS",
    nextTurn: "opponent"
  }

  return NextResponse.json(result, { status: 200 })
}