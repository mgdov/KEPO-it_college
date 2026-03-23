import { NextRequest, NextResponse } from "next/server"

// Mock implementation for downloading material
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string; materialId: string } }
) {
  const { lessonId, materialId } = params

  // Mock binary data (dummy PDF)
  const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]) // %PDF-1.4

  return new NextResponse(dummyPdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="material.pdf"'
    }
  })
}