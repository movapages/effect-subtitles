# AI Subtitles MVP

## Senior TypeScript Developer Assessment

### rFluent AI•ÂMaximum 3 Hours

## . MANDATORY REQUIREMENT

```
This assignment MUST use the Effect framework. Solutions not implementing
Effect will be automatically rejected, regardless of functionality.
See Annex A for Effect code examples and patterns.
```
## 1 ◎Project Overview

You will develop a TypeScript CLI application that generates AI-powered subtitles from YouTube
videos using external speech-to-text APIs. This challenge evaluates your ability to architect type-safe,
maintainable solutions using functional programming principles.

```
⋆Career Opportunity: Success in this assessment leads to a senior position developing
our multi-platform subtitle generation system, enabling millions of learners to access YouTube
and Netflix content with accurate AI-generated subtitles in their target languages.
```
## 2 ÔTechnical Specification

### 2.1 Required Technology Stack

- Runtime:Bun (latest stable version)
- Language:TypeScript (strict mode enabled)
- Framework:Effect (Effect Documentation) (Effect Tutorial)
- Speech-to-Text: External API of your choice (OpenAI Whisper API, AssemblyAI, Google
    Cloud Speech-to-Text, etc.)

### 2.2 Interface Definition

```
CLI Interface:
bun run generate-subtitles --url <youtube-url>
Output Format:JSON array conforming to the SubtitleToken interface
```

1 type SubtitleToken = {
2 id: number;
3 value: string;
4 startTimeMs: number;
5 endTimeMs: number;
6 score: number; // Confidence score from API
7 };
8
9 type SubtitleResult = Array<SubtitleToken>;
Listing 1: Required TypeScript Interfaces

## 3  Implementation Requirements

### 3.1 Core Functionality

1. YouTube Audio Processing
    - Extract audio stream from YouTube URL
    - Convert to format compatible with chosen API
    - Handle various video qualities and formats
2. Effect-based Architecture
    - Implement services usingEffect.Service
    - UseContextandLayerfor dependency injection
    - Handle configuration withConfigmodule
    - Implement proper error handling with tagged errors
3. API Integration
    - Process audio through external speech-to-text service
    - Handle rate limiting, retries, and network failures
    - Transform API responses to required format
4. CLI Implementation
    - Accept YouTube URL as command-line argument
    - Validate input URL format
    - Output properly formatted JSON
    - Implement comprehensive error reporting


### 3.2 Effect Framework Requirements

```
ÐMandatory Effect Patterns:
```
- UseEffect.genfor async operations
- Implement services with dependency injection
- Create properLayercomposition
- Handle errors using tagged error types
- UseSchemafor data validation
- ImplementConfigfor environment variables

## 4 Deliverables

1. Source Code:Complete TypeScript implementation using Effect
2. README.md:Comprehensive documentation including:
    - Project setup and installation steps
    - Environment configuration (API keys, etc.)
    - CLI usage examples with sample outputs
    - Architecture overview explaining Effect usage
    - Troubleshooting guide for common issues
3. Configuration:Propertsconfig.jsonandpackage.json
4. Tests:Basic test coverage demonstrating Effect testing patterns


## 5 Bonus Considerations

- Advanced Effect patterns (custom operators, resource management)
- Comprehensive error recovery strategies
- Performance optimizations for large video files
- Elegant handling of API rate limits with exponential backoff
- Clean separation of concerns in service architecture
- Innovative use of Effect’s concurrency features

## Ready to showcase your Effect expertise?

### We look forward to reviewing your implementation.
###
### API key: [REDACTED - Set in .env file]
###
CURL -

curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "input": "write a haiku about ai",
    "store": true
  }'

npm install openai

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in .env file
});

const response = openai.responses.create({
  model: "gpt-4o-mini",
  input: "write a haiku about ai",
  store: true,
});

response.then((result) => console.log(result.output_text));




