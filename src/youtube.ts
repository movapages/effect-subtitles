import { Effect, Layer, Context } from "effect"
import { spawn } from "node:child_process"
import { stat } from "node:fs/promises"
import { glob } from "glob"
import path from "node:path"
import { YouTubeError } from "./errors.js"

// Service interface
export interface YouTubeService {
  readonly extractAudio: (url: string) => Effect.Effect<string, YouTubeError>
}

// Context.Tag (Effect 3.x)
export const YouTubeService = Context.GenericTag<YouTubeService>("YouTubeService")

// Helper function to try extraction with specific arguments
const tryExtraction = (url: string, out: string, extraArgs: string[]) =>
  Effect.async<string, YouTubeError>((resume) => {
    const args = [
      url,
      '-f', 'bestaudio',
      '-o', out,
      ...extraArgs
    ]
    
    console.log(`Trying yt-dlp with args: ${args.join(' ')}`)
    const ytdlp = spawn('/Users/om/.pyenv/versions/3.11.9/bin/yt-dlp', args)
    
    let stderr = ''
    
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    ytdlp.on('close', async (code) => {
      if (code === 0) {
        try {
          // Detect actual output filename (could be .webm, .m4a, .opus, etc.)
          const files = await glob(out.replace('.%(ext)s', '.*'))
          if (files.length > 0) {
            const stats = await stat(files[0])
            if (stats.size > 0) {
              console.log(`Successfully downloaded: ${files[0]} (${stats.size} bytes)`)
              resume(Effect.succeed(files[0]))
              return
            }
          }
          resume(Effect.fail(new YouTubeError({ 
            reason: `yt-dlp produced no usable file: ${stderr}` 
          })))
        } catch (err) {
          resume(Effect.fail(new YouTubeError({ 
            reason: `glob/stat failed: ${String(err)}` 
          })))
        }
      } else {
        resume(Effect.fail(new YouTubeError({
          reason: `yt-dlp failed with code ${code}: ${stderr}`
        })))
      }
    })
    
    ytdlp.on('error', (error) => {
      resume(Effect.fail(new YouTubeError({
        reason: `Failed to spawn yt-dlp: ${String(error)}`
      })))
    })
  })

// Implementation (downloads audio-only → .m4a or .webm container)
// We simply save the stream as-is; Whisper API accepts m4a/webm.
export const YouTubeServiceLive = Layer.succeed(
  YouTubeService,
  {
    extractAudio: (url) =>
      Effect.gen(function* (_) {
        const out = path.join(process.cwd(), `yt-audio-${Date.now()}.%(ext)s`)
        
        // Strategy 0: Web client spoofing (most reliable currently)
        const webResult = yield* _(tryExtraction(url, out, [
          '--extractor-args', 'youtube:player_client=web'
        ]).pipe(Effect.option))
        
        if (webResult._tag === 'Some') return webResult.value
        
        // Strategy 1: Try with Chrome cookies
        const chromeResult = yield* _(tryExtraction(url, out, [
          '--cookies-from-browser', 'chrome'
        ]).pipe(Effect.option))
        
        if (chromeResult._tag === 'Some') return chromeResult.value
        
        // Strategy 2: Try with Firefox cookies  
        const firefoxResult = yield* _(tryExtraction(url, out, [
          '--cookies-from-browser', 'firefox'
        ]).pipe(Effect.option))
        
        if (firefoxResult._tag === 'Some') return firefoxResult.value
        
        // Strategy 3: Try iOS client
        const iosResult = yield* _(tryExtraction(url, out, [
          '--extractor-args', 'youtube:player_client=ios'
        ]).pipe(Effect.option))
        
        if (iosResult._tag === 'Some') return iosResult.value
        
        // Strategy 4: Try Android client
        const androidResult = yield* _(tryExtraction(url, out, [
          '--extractor-args', 'youtube:player_client=android'
        ]).pipe(Effect.option))
        
        if (androidResult._tag === 'Some') return androidResult.value
        
        // Strategy 5: Try TV client
        const tvResult = yield* _(tryExtraction(url, out, [
          '--extractor-args', 'youtube:player_client=tv'
        ]).pipe(Effect.option))
        
        if (tvResult._tag === 'Some') return tvResult.value
        
        // Strategy 6: Basic extraction as final fallback
        return yield* _(tryExtraction(url, out, []))
      })
  }
)
