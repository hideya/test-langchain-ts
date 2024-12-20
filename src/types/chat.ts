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
    
    // Keep only the last maxMessages (excluding system message)
    const systemMessages = this.messages.filter(m => m instanceof SystemMessage);
    const nonSystemMessages = this.messages.filter(m => !(m instanceof SystemMessage));
    
    if (nonSystemMessages.length > this.maxMessages) {
      const excess = nonSystemMessages.length - this.maxMessages;
      nonSystemMessages.splice(0, excess);
    }
    
    this.messages = [...systemMessages, ...nonSystemMessages];
  }

  public getMessages(): BaseMessage[] {
    return this.messages;
  }

  public clear(): void {
    // Preserve system messages when clearing context
    const systemMessages = this.messages.filter(m => m instanceof SystemMessage);
    this.messages = systemMessages;
  }
}
