import { Data } from "effect"

export class YouTubeError extends Data.TaggedError("YouTubeError")<{
  reason: string
}> {}

export class WhisperError extends Data.TaggedError("WhisperError")<{
  reason: string
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  reason: string
}> {}
