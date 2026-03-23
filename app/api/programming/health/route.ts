import { NextRequest, NextResponse } from "next/server"

// Mock implementation for programming service health check
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok" }, { status: 200 })
}