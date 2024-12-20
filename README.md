
# CLI Chat Application

A command-line interface chat application that supports multiple LLM providers (OpenAI and Anthropic) with configurable system prompts and chat history.

## Features

- Multiple LLM support (GPT-3.5, Claude-2)
- Configurable system prompts per model
- Chat history management
- Model switching on the fly
- Conversation context management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the application:
- Copy `llm-config-example.json` to `llm-config.json`
- Update the API keys and other settings in `llm-config.json`

## Usage

Run the application:
```bash
npm start
```

## Commands

- `/list` - Show available models
- `/switch <model-name>` - Switch between models
- `/history` - View chat history
- `/clear` - Clear conversation context
- `quit` or `q` - Exit application
