import { NextResponse } from "next/server";

import { isAppError } from "./errors";

interface ErrorResponseBody {
  message: string;
  details?: unknown;
}

export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (isAppError(error)) {
    const body: ErrorResponseBody = {
      message: error.message,
    };

    if (error.details !== undefined) {
      body.details = error.details;
    }

    return NextResponse.json(body, { status: error.statusCode });
  }

  console.error(fallbackMessage, error);

  if (error instanceof Error && error.message) {
    return NextResponse.json<ErrorResponseBody>(
      {
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json<ErrorResponseBody>(
    {
      message: fallbackMessage,
    },
    { status: 500 }
  );
}
