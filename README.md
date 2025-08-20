# AI Blog Post Generator

This is an advanced web application that leverages the Google Gemini API to serve as a comprehensive content creation and management suite. It's designed for bloggers, marketers, and content creators to streamline their workflow, from idea generation to publishing.

The application is built as a modern, single-page application with a secure, serverless backend to protect API keys.

## ✨ Core Features

*   **✍️ AI-Powered Content Generation**: Create high-quality, SEO-optimized blog posts in Markdown format on any topic. Customize the tone and length to match your brand voice.
*   **🌐 Google Search Grounding**: Generate articles based on up-to-date information from the web, with automatic source citation.
*   **🖼️ Automated Image Generation**: Automatically create a relevant, high-quality header image for each article using Imagen 3.
*   **🔗 WordPress Integration**: Seamlessly publish your generated content, including the header image, directly to your WordPress site.
*   **💡 Content Research & Outlining**: Input a topic or a URL to receive key takeaways, SEO keywords, suggested titles, and a structured article outline.
*   **🛡️ SEO Analysis**: Get an on-demand SEO audit of your generated content, with a score and actionable recommendations for improvement.
*   **🔄 Content Repurposing**: Instantly transform a blog post into a Twitter thread, a LinkedIn post, or an email newsletter.
*   **🤖 Bulk Automation**: Queue up multiple topics for the AI to generate and (optionally) publish automatically on a schedule.
*   **🔍 Google Search Console Integration**: (Mock) Connect to GSC to view top-performing keywords and generate content based on real user search queries.
*   **👤 User Authentication & Profiles**: A mock user authentication system with profiles, preferences, and content history.
*   **📜 Content History**: All generated articles are saved locally for easy access and re-use.

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **AI**: Google Gemini API (`@google/genai`)
*   **Backend**: Vercel Serverless Functions (Node.js)
*   **Authentication**: Mock auth service using JSON Web Tokens (JWT) and cookies.

## 🚀 Setup and Deployment

This project is designed for deployment on a platform that supports serverless Node.js functions, such as **Vercel**.

### 1. Prerequisites

*   A [Google Gemini API Key](https://aistudio.google.com/app/apikey).
*   A [Vercel](https://vercel.com/) account.
*   (Optional) A self-hosted WordPress site with Application Passwords enabled for publishing.

### 2. Deployment Steps

1.  **Fork this repository.**
2.  **Create a new project on Vercel** and import the forked repository. Vercel will automatically detect the project structure.
3.  **Configure Environment Variables** in the Vercel project settings:
    *   `API_KEY`: Your Google Gemini API Key. This is required for all AI features.
    *   `JWT_SECRET`: A long, random, and secret string used for signing authentication tokens. You can generate one using an online tool.

4.  **Deploy!** Vercel will build and deploy the application.

### Backend Logic (`/api/proxy.ts` and `/api/auth.ts`)

This application uses a serverless backend for two critical functions:

1.  **API Key Security (`/api/proxy.ts`)**: The frontend **never** has direct access to the `API_KEY`. All requests to the Google Gemini API are proxied through this serverless function. The function reads the `API_KEY` from the secure server-side environment variables and forwards the request to Google. This is the standard, secure way to handle secret keys in a web application.

2.  **Authentication (`/api/auth.ts`)**: This file contains a **MOCK** authentication service for demonstration purposes.

    > **[!!] SECURITY WARNING [!!]**
    > The authentication system is **NOT production-ready**. It uses an in-memory array to store users (data is lost on restart) and handles passwords in plaintext. For a real-world application, this **MUST** be replaced with a secure authentication provider or a proper database with password hashing (e.g., using bcrypt).