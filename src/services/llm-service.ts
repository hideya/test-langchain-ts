import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LLMConfig, ConfigurationError } from '../types/config';

export async function initChatModel(config: LLMConfig): Promise<BaseChatModel> {
  try {
    console.log(`Initializing chat model with provider: ${config.provider}`);

    switch (config.provider.toLowerCase()) {
      case 'openai':
        console.log(`Using OpenAI model: ${config.model}`);
        return new ChatOpenAI({
          modelName: config.model,
          temperature: config.temperature,
          openAIApiKey: config.api_key,
        });

      case 'anthropic':
        console.log(`Using Anthropic model: ${config.model}`);
        return new ChatAnthropic({
          modelName: config.model,
          temperature: config.temperature,
          anthropicApiKey: config.api_key,
        });

      default:
        throw new ConfigurationError(`Unsupported provider: ${config.provider}`);
    }
  } catch (error) {
    console.error('Error initializing chat model:', (error as Error).message);
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(`Failed to initialize chat model: ${(error as Error).message}`);
  }
}