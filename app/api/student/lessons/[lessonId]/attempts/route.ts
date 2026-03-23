import { NextRequest, NextResponse } from "next/server"

// Mock implementation for creating an attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { lessonId } = params

  // Mock logic: check if lesson is active
  // For simplicity, assume all lessons are active
  const isActive = true

  if (!isActive) {
    return NextResponse.json({ error: "Lesson not active" }, { status: 403 })
  }

  // Mock attempt creation
  const attempt = {
    id: `attempt-${Date.now()}`,
    lessonId,
    startedAt: new Date().toISOString(),
    status: "IN_PROGRESS"
  }

  return NextResponse.json(attempt, { status: 201 })
}