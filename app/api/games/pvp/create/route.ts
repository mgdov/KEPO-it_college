import { NextRequest, NextResponse } from "next/server"

// Mock implementation for creating a PvP game
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Mock PvP session creation
  const session = {
    id: `pvp-${Date.now()}`,
    gameType: body.gameType,
    status: "WAITING_FOR_OPPONENT",
    createdAt: new Date().toISOString()
  }

  return NextResponse.json(session, { status: 201 })
}