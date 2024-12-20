
# CLI Chat Application

A command-line interface chat application that supports multiple LLM providers (OpenAI and Anthropic) with configurable system prompts and chat history.

## Features

- Multiple LLM support (GPT-3.5, Claude-2)
- Configurable system prompts per model
- Chat history management
- Model switching on the fly
- Conversation context management

## Setup

1. Create a `config.json` file with your API keys:
```json
{
  "default_llm": "gpt3",
  "llms": {
    "gpt3": {
      "model": "gpt-3.5-turbo",
      "provider": "openai",
      "temperature": 0.7,
      "api_key": "your-openai-key",
      "systemPrompt": "You are a helpful AI assistant powered by GPT-3.5."
    }
  }
}
```

2. Run the application:
```bash
npx ts-node src/index.ts config.json
```

## Commands

- `/list` - Show available models
- `/switch <model-name>` - Switch between models
- `/history` - View chat history
- `/clear` - Clear conversation context
- `quit` or `q` - Exit application
