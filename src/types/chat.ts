import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

export type ChatMessageType = 'human' | 'ai' | 'system';

export interface ChatContextConfig {
  maxMessages?: number;
  systemPrompt?: string;
}

export class ChatContext {
  private messages: BaseMessage[] = [];
  private maxMessages: number;
  
  constructor(config: ChatContextConfig = {}) {
    this.maxMessages = config.maxMessages || 10;
    if (config.systemPrompt) {
      this.messages.push(new SystemMessage(config.systemPrompt));
    }
  }

  public addMessage(content: string, type: ChatMessageType): void {
    let message: BaseMessage;

    switch (type) {
      case 'human':
        message = new HumanMessage(content);
        break;
      case 'ai':
        message = new AIMessage(content);
        break;
      case 'system':
        message = new SystemMessage(content);
        break;
    }

    this.messages.push(message);
    console.log(`Added ${type} message. Total messages: ${this.messages.length}`);

    // Keep only the last maxMessages (excluding system message)
    const systemMessages = this.messages.filter(m => m instanceof SystemMessage);
    const nonSystemMessages = this.messages.filter(m => !(m instanceof SystemMessage));

    if (nonSystemMessages.length > this.maxMessages) {
      const excess = nonSystemMessages.length - this.maxMessages;
      console.log(`Trimming ${excess} oldest messages to maintain history limit of ${this.maxMessages}`);
      nonSystemMessages.splice(0, excess);
    }

    this.messages = [...systemMessages, ...nonSystemMessages];
    console.log(`Final message count after trim: ${this.messages.length}`);
  }

  public getMessages(): BaseMessage[] {
    return this.messages;
  }

  public clear(): void {
    console.log(`Clearing context. Current message count: ${this.messages.length}`);
    // Preserve system messages when clearing context
    const systemMessages = this.messages.filter(m => m instanceof SystemMessage);
    console.log(`Preserving ${systemMessages.length} system messages`);
    this.messages = systemMessages;
    console.log(`Context cleared. Remaining messages: ${this.messages.length}`);
  }
}