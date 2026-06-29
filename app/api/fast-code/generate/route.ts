import { NextResponse } from "next/server";
import { generateFastCodeResult } from "@/services/fast-code.service";
import { FastCodeValidationError } from "@/validators/fast-code.validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await generateFastCodeResult({
      firstName: body.firstName ?? "",
      middleName: body.middleName ?? null,
      lastName: body.lastName ?? "",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FastCodeValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate FAST Code";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
