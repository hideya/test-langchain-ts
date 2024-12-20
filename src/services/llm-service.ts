import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LLMConfig, ConfigurationError } from '../types/config';
import { ChatContext, ChatContextConfig } from '../types/chat';

export class LLMService {
  public currentModel: string;
  private models: Map<string, BaseChatModel> = new Map();
  private contexts: Map<string, ChatContext> = new Map();
  private contextConfig: ChatContextConfig;

  private constructor(defaultLLM: string, contextConfig?: ChatContextConfig) {
    this.currentModel = defaultLLM;
    this.contextConfig = contextConfig || {};
  }

  static async initialize(
    llmConfigs: { [key: string]: LLMConfig },
    defaultLLM: string,
    contextConfig?: ChatContextConfig
  ): Promise<LLMService> {
    const service = new LLMService(defaultLLM, contextConfig);
    await service.initializeModels(llmConfigs);
    return service;
  }

  private initializeContexts(configs: { [key: string]: LLMConfig }): void {
    for (const [modelName, config] of Object.entries(configs)) {
      const contextConfig = {
        ...this.contextConfig,
        systemPrompt: config.systemPrompt || this.contextConfig.systemPrompt
      };
      this.contexts.set(modelName, new ChatContext(contextConfig));
      console.log(`Initialized chat context for ${modelName} with system prompt:`, contextConfig.systemPrompt);
    }
  }

  private async initializeModel(config: LLMConfig): Promise<BaseChatModel> {
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

  private async initializeModels(configs: { [key: string]: LLMConfig }): Promise<void> {
    const initPromises = Object.entries(configs).map(async ([name, config]) => {
      const model = await this.initializeModel(config);
      this.models.set(name, model);
    });

    await Promise.all(initPromises);
    // Initialize contexts after all models are set up
    this.initializeContexts(configs);
  }

  public getCurrentModel(): BaseChatModel {
    const model = this.models.get(this.currentModel);
    if (!model) {
      throw new ConfigurationError(`Current model ${this.currentModel} not initialized`);
    }
    return model;
  }

  public getCurrentContext(): ChatContext {
    const context = this.contexts.get(this.currentModel);
    if (!context) {
      throw new ConfigurationError(`Context for model ${this.currentModel} not initialized`);
    }
    return context;
  }

  public switchModel(modelName: string): void {
    if (!this.models.has(modelName)) {
      throw new ConfigurationError(`Model ${modelName} not found in available configurations`);
    }
    console.log(`\nSwitching from ${this.currentModel} to ${modelName}`);
    console.log(`Current context messages count: ${this.getCurrentContext().getMessages().length}`);
    this.currentModel = modelName;
    console.log(`New context messages count: ${this.getCurrentContext().getMessages().length}`);
    console.log(`Switched to model: ${modelName}`);
  }

  public listAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  public clearCurrentContext(): void {
    const context = this.getCurrentContext();
    console.log(`Clearing context for model ${this.currentModel}`);
    console.log(`Messages before clear: ${context.getMessages().length}`);
    context.clear();
    console.log(`Messages after clear: ${context.getMessages().length}`);
    console.log(`Cleared chat context for model: ${this.currentModel}`);
  }
}