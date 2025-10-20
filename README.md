# HelpDesk AI

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT-412991?style=for-the-badge&logo=openai)

A complete RAG (Retrieval-Augmented Generation) chat application built with Next.js 14, TypeScript, and Tailwind CSS for answering questions about documentation.

## Features

- 💬 Clean chat interface with streaming responses
- 🔍 RAG pipeline with BM25 retrieval
- 📚 Citation of source documents
- 🎯 Context-aware responses
- ⚡ Built with Next.js 14 and TypeScript

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone [https://github.com/amaregit/helpdesk-ai.git]
   cd helpdesk-ai
   npm install

2. **Environment variables:**
   Create a `.env.local` file with:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_optional
   ADMIN_PASSWORD=admin_password
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

## Features

- 💬 Clean chat interface with streaming responses
- 🔍 RAG pipeline with BM25 retrieval
- 📚 Citation of source documents
- 🎯 Context-aware responses
- ⚡ Built with Next.js 14 and TypeScript
- 🔐 Admin panel with authentication
- 📊 Usage monitoring and analytics
- 📁 File upload for knowledge base management
- 🧪 Automated evaluation system

## Admin Panel

Access the admin panel at `/admin` with password authentication. Features include:
- Document re-indexing
- File upload for new knowledge base documents
- System evaluation and testing
- Usage monitoring and statistics
- Performance metrics

## API Endpoints

- `POST /api/chat` - Chat with streaming responses
- `GET /api/index` - Get index status
- `POST /api/index` - Reindex documents (admin)
- `GET /api/eval` - Run evaluation tests (admin)
- `POST /api/upload` - Upload documents (admin)
- `GET /api/monitoring` - Get usage stats (admin)
- `POST /api/monitoring` - Reset stats (admin)
