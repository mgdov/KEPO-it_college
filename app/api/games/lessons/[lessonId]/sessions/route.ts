import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting game sessions for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { lessonId } = params

  // Mock sessions
  const sessions = [
    {
      id: "session-1",
      lessonId,
      gameType: "CHESS",
      status: "FINISHED",
      players: ["player1", "player2"]
    }
  ]

  return NextResponse.json(sessions, { status: 200 })
}