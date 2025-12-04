import { NextRequest, NextResponse } from "next/server";
import { fetchReviewsAndAnalyze, analyzeReviews } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("appId");

  if (!appId) {
    return NextResponse.json(
      { error: "appId is required" },
      { status: 400 }
    );
  }

  const result = await fetchReviewsAndAnalyze(String(appId));

  return NextResponse.json(result);
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validasi minimal
    if (!body.reviews || !Array.isArray(body.reviews)) {
      return NextResponse.json(
        { error: "Field 'reviews' harus berupa array string." },
        { status: 400 }
      );
    }

    // Jalankan analisis
    const result = await analyzeReviews(body.reviews);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
