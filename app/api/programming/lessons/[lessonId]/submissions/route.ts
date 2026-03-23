import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting programming submissions
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { lessonId } = params

  // Mock submissions
  const submissions = [
    {
      id: "sub-1",
      lessonId,
      code: "print(sum(map(int, input().split())))",
      language: "python",
      verdict: "ACCEPTED",
      score: 100,
      submittedAt: new Date().toISOString()
    }
  ]

  return NextResponse.json(submissions, { status: 200 })
}