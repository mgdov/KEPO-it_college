import { NextRequest, NextResponse } from "next/server"

// Mock implementation for updating game session state
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params
  const body = await request.json()

  // Mock update
  const updatedSession = {
    id: sessionId,
    ...body,
    updatedAt: new Date().toISOString()
  }

  return NextResponse.json(updatedSession, { status: 200 })
}