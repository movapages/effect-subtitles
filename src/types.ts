import { Schema as S } from "effect"

// ── Input (CLI)
export const ArgsSchema = S.Struct({
  url: S.String.pipe(
    S.pattern(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//)
  )
})
export type Args = S.Schema.Type<typeof ArgsSchema>

// ── Output
export const SubtitleTokenSchema = S.Struct({
  id: S.Number,
  value: S.String,
  startTimeMs: S.Number,
  endTimeMs: S.Number,
  score: S.Number
})
export type SubtitleToken = S.Schema.Type<typeof SubtitleTokenSchema>

export const SubtitleResultSchema = S.Array(SubtitleTokenSchema)
export type SubtitleResult = S.Schema.Type<typeof SubtitleResultSchema>
