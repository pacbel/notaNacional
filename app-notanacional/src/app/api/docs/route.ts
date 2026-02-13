import { NextResponse } from "next/server";

import { getSwaggerSpec } from "@/lib/swagger";

export function GET() {
  return NextResponse.json(getSwaggerSpec());
}
