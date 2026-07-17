import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, message = "Success", init?: ResponseInit) {
  return NextResponse.json({ success: true, data, message }, init);
}

export function fail(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, error.flatten().fieldErrors);
  }
  if (error instanceof Error) {
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 400;
    return fail(error.message, status);
  }
  return fail("Unexpected server error", 500);
}
