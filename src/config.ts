import { Config, Effect } from "effect"

export const OpenAIConfig = {
  apiKey: Config.string("OPENAI_API_KEY")
}

export const loadConfig = Effect.gen(function* (_) {
  const apiKey = yield* _(OpenAIConfig.apiKey)
  return { apiKey }
})
