declare module '@google/generative-ai' {
  // Minimal type shim to satisfy TypeScript in this project. You can replace with official types when available.
  export class GoogleGenerativeAI {
    constructor(apiKey: string)
    getGenerativeModel(options: { model: string }): any
  }
}
