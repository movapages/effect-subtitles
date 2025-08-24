#!/usr/bin/env bun
import "dotenv/config" // load .env in Bun

import { Effect, Layer, Schema as S } from "effect"
import { ArgsSchema, SubtitleResultSchema } from "../src/types.js"
import { YouTubeService, YouTubeServiceLive } from "../src/youtube.js"
import { WhisperService, WhisperServiceLive } from "../src/whisper.js"
import { ValidationError } from "../src/errors.js"

// Compose layers
const AppLayer = Layer.mergeAll(YouTubeServiceLive, WhisperServiceLive)

const program = Effect.gen(function* (_) {
  // ── 1) CLI args boundary: validate
  const args = process.argv.slice(2)
  const flag = args[0]
  const value = args[1]

  if (!flag || !value) {
    console.error("Usage: bun run generate-subtitles --url <youtube-url> | --file <audio-file>")
    process.exit(1)
  }

  let audioPath: string

  if (flag === "--file") {
    // Direct file input - skip YouTube extraction
    audioPath = value
    console.log(`Using local audio file: ${audioPath}`)
  } else if (flag === "--url") {
    // YouTube URL - validate and extract
    const parsed = yield* _(
      S.decodeUnknown(ArgsSchema)({ url: value }).pipe(
        Effect.mapError(
          (e) => new ValidationError({ reason: `Invalid URL: ${String(e)}` })
        )
      )
    )

    // ── 2) Extract audio (external system -> boundary checked by service)
    const yt = yield* _(YouTubeService)
    audioPath = yield* _(yt.extractAudio(parsed.url))
  } else {
    console.error("Usage: bun run generate-subtitles --url <youtube-url> | --file <audio-file>")
    process.exit(1)
  }

  // ── 3) Transcribe via Whisper (external API -> boundary validated inside service)
  const whisper = yield* _(WhisperService)
  const subtitles = yield* _(whisper.transcribe(audioPath))

  // ── 4) Output boundary: validate again (defensive)
  const final = yield* _(
    S.decodeUnknown(SubtitleResultSchema)(subtitles).pipe(
      Effect.mapError(
        (e) => new ValidationError({ reason: `Output validation failed: ${String(e)}` })
      )
    )
  )

  console.log(JSON.stringify(final, null, 2))
})

// Run
Effect.runPromise(program.pipe(Effect.provide(AppLayer))).catch((e) => {
  // Pretty error reporting
  const msg = e && typeof e === "object" && "reason" in e ? (e as any).reason : String(e)
  console.error(`[ERROR] ${msg}`)
  process.exit(1)
})
