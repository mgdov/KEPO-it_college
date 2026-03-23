import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting open PvP games for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { lessonId } = params

  // Mock open games
  const openGames = [
    {
      id: "pvp-1",
      lessonId,
      gameType: "CHESS",
      status: "WAITING_FOR_OPPONENT",
      createdBy: "player1"
    }
  ]

  return NextResponse.json(openGames, { status: 200 })
}