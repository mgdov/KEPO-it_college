import { NextRequest, NextResponse } from "next/server"

// Mock implementation for creating a game session
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Mock session creation
  const session = {
    id: `session-${Date.now()}`,
    gameType: body.gameType,
    status: "WAITING",
    createdAt: new Date().toISOString()
  }

  return NextResponse.json(session, { status: 201 })
}