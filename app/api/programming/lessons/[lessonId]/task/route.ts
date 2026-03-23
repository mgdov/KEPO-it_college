import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting programming task
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { lessonId } = params

  // Mock task
  const task = {
    id: "pt-1",
    lessonId,
    title: "Sum of array elements",
    statement: "Write a program that calculates the sum of all elements in an array.",
    allowedLanguages: ["python", "javascript", "c"],
    testCases: [
      { input: "5\n1 2 3 4 5", expected: "15" }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 65536
  }

  return NextResponse.json(task, { status: 200 })
}