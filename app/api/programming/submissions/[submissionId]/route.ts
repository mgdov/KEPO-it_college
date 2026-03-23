import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting a submission
export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  const { submissionId } = params

  // Mock submission
  const submission = {
    id: submissionId,
    code: "print(sum(map(int, input().split())))",
    language: "python",
    verdict: "ACCEPTED",
    score: 100,
    testResults: [
      { testCase: 1, verdict: "ACCEPTED", time: 0.1 }
    ],
    submittedAt: new Date().toISOString()
  }

  return NextResponse.json(submission, { status: 200 })
}