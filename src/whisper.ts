import { Config, Effect, Layer, Schedule, Duration, Context, Schema as S } from "effect"
import OpenAI from "openai"
import fs from "node:fs"
import { WhisperError } from "./errors.js"
import { SubtitleResult, SubtitleResultSchema } from "./types.js"

// Service interface
export interface WhisperService {
  readonly transcribe: (filePath: string) => Effect.Effect<SubtitleResult, WhisperError>
}

// Context.Tag (Effect 3.x)
export const WhisperService = Context.GenericTag<WhisperService>("WhisperService")

// Implementation: uses OpenAI Whisper API with `verbose_json`
// so we can map segments -> SubtitleToken[]
export const WhisperServiceLive = Layer.effect(
  WhisperService,
  Effect.gen(function* (_) {
    const apiKey = yield* _(Config.string("OPENAI_API_KEY"))
    const client = new OpenAI({ apiKey })

    const call = (filePath: string) =>
      Effect.tryPromise({
        try: async () => {
          // whisper-1 supports 'verbose_json' (segments with timestamps)
          const resp = await client.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            response_format: "verbose_json"
          }) as any

          // Map segments -> SubtitleToken[]
          const result: SubtitleResult = (resp.segments ?? []).map(
            (seg: any, i: number) => ({
              id: i + 1,
              value: String(seg.text ?? "").trim(),
              startTimeMs: Math.max(0, Math.round((seg.start ?? 0) * 1000)),
              endTimeMs: Math.max(0, Math.round((seg.end ?? 0) * 1000)),
              // Whisper returns 'avg_logprob'/'compression_ratio'/'no_speech_prob'
              // If 'confidence' is unavailable, set a heuristic score (1 is fine)
              score: typeof seg.confidence === "number" ? seg.confidence : 1
            })
          )

          // Validate at output boundary
          const decoded = await S.decodeUnknown(SubtitleResultSchema)(result)
            .pipe(Effect.runPromise)

          return decoded
        },
        catch: (e) => {
          console.error("Whisper API error:", e)
          return new WhisperError({ reason: `Whisper API failed: ${String(e)}` })
        }
      })

    // Return service with retry/backoff (handles rate-limit blips)
    return {
      transcribe: (filePath) =>
        call(filePath).pipe(
          Effect.retry(
            Schedule.exponential(Duration.millis(200)).pipe(
              Schedule.jittered,      // add jitter for politeness
              Schedule.upTo(Duration.seconds(10))
            )
          )
        )
    }
  })
)
