import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting an attempt
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  const { attemptId } = params

  // Mock attempt data
  const attempt = {
    id: attemptId,
    lessonId: "l-1",
    startedAt: new Date().toISOString(),
    status: "IN_PROGRESS",
    answers: [] // or whatever structure
  }

  return NextResponse.json(attempt, { status: 200 })
}