import { NextRequest, NextResponse } from "next/server"

// Mock implementation for getting game types
export async function GET(request: NextRequest) {
  const gameTypes = [
    { id: "MILLIONAIRE", name: "Кто хочет стать миллионером" },
    { id: "CHESS", name: "Шахматы" },
    { id: "CHECKERS", name: "Шашки" },
    // etc.
  ]

  return NextResponse.json(gameTypes, { status: 200 })
}