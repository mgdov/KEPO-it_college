import { NextRequest, NextResponse } from "next/server"

// Mock implementation for submitting code
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Mock submit result
  const result = {
    verdict: "ACCEPTED",
    score: 100,
    testResults: [
      { testCase: 1, verdict: "ACCEPTED", time: 0.1 }
    ]
  }

  return NextResponse.json(result, { status: 200 })
}