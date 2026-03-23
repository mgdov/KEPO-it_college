import { NextRequest, NextResponse } from "next/server"

// Mock implementation for running code
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Mock run result
  const result = {
    verdict: "ACCEPTED",
    stdout: "15\n",
    stderr: "",
    executionTime: 0.1
  }

  return NextResponse.json(result, { status: 200 })
}