export interface LLMConfig {
  model: string;
  provider: string;
  temperature: number;
  api_key: string;
  systemPrompt?: string;
}

export interface AppConfig {
  default_llm: string;
  llms: {
    [key: string]: LLMConfig;
  };
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}