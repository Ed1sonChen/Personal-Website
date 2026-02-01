/**
 * Research Assistant Chat API - Using Groq (FREE)
 * Fast, unlimited, no credit card required
 * https://groq.com
 */

import fs from "fs";
import { Groq } from "groq-sdk";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  question: string;
}

// Load actual blog posts and research content
function loadResearchContent(): string {
  let content = "";

  try {
    // Load blog posts
    const blogDir = path.join(process.cwd(), "content/blog/en");
    if (fs.existsSync(blogDir)) {
      const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));

      content += "BLOG POSTS:\n";
      content += "=".repeat(50) + "\n";

      for (const file of files.slice(0, 10)) {
        try {
          const filePath = path.join(blogDir, file);
          const blogContent = fs.readFileSync(filePath, "utf-8");

          // Extract title and first 500 chars
          const titleMatch = blogContent.match(/title:\s*["']([^"']+)["']/);
          const title = titleMatch ? titleMatch[1] : file.replace(/\.mdx$/, "");

          // Remove frontmatter
          const bodyMatch = blogContent.match(
            /^---\n[\s\S]*?\n---\n([\s\S]*)/
          );
          const body = bodyMatch ? bodyMatch[1] : blogContent;

          content += `\n[BLOG] ${title}\n`;
          content += body.substring(0, 800) + "\n...\n";
        } catch (e) {
          console.error(`Error reading blog ${file}:`, e);
        }
      }
    }

    // Load projects and publications
    const collectionsPath = path.join(
      process.cwd(),
      "src/i18n/messages/en/collections.json"
    );
    if (fs.existsSync(collectionsPath)) {
      const collectionsData = JSON.parse(
        fs.readFileSync(collectionsPath, "utf-8")
      );

      if (collectionsData.projects?.items) {
        content += "\n\nPROJECTS:\n";
        content += "=".repeat(50) + "\n";
        for (const proj of collectionsData.projects.items.slice(0, 10)) {
          content += `\n[PROJECT] ${proj.name} (${proj.dates})\n`;
          content += `Description: ${proj.description}\n`;
          if (proj.technologies) {
            content += `Technologies: ${proj.technologies.join(", ")}\n`;
          }
        }
      }

      if (collectionsData.publications?.items) {
        content += "\n\nPUBLICATIONS:\n";
        content += "=".repeat(50) + "\n";
        for (const pub of collectionsData.publications.items.slice(0, 10)) {
          content += `\n[PUBLICATION] ${pub.name}\n`;
          content += `Authors: ${pub.authors || "N/A"}\n`;
          content += `Date: ${pub.dates}\n`;
          content += `Description: ${pub.description}\n`;
        }
      }
    }

    // Load personal info
    const personalPath = path.join(
      process.cwd(),
      "src/i18n/messages/en/personal.json"
    );
    if (fs.existsSync(personalPath)) {
      const personalData = JSON.parse(fs.readFileSync(personalPath, "utf-8"));
      content += "\n\nPERSONAL INFORMATION:\n";
      content += "=".repeat(50) + "\n";
      content += JSON.stringify(personalData, null, 2).substring(0, 1000);
    }
  } catch (error) {
    console.error("Error loading research content:", error);
  }

  return content || "No research content available";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GROQ_API_KEY not configured",
          message:
            "Please set GROQ_API_KEY in your .env.local file. Get a free key at https://console.groq.com/keys",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const { messages, question } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Load actual research content
    const researchContent = loadResearchContent();

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // System prompt with actual research context
    const systemMessage = `You are a research assistant answering questions about my research, projects, publications, and expertise.
You have access to detailed information about my work including blog posts, projects, and publications.
Answer questions based ONLY on the information provided below.
If you don't have specific information to answer a question, be honest about it.
Keep responses concise, helpful, and informative.

MY RESEARCH AND WORK INFORMATION:
${"=".repeat(60)}
${researchContent}
${"=".repeat(60)}

Important Guidelines:
- Only answer based on the provided research content
- If asked about something not mentioned in the content, say you don't have that specific information
- Be helpful and direct
- When referencing projects or publications, mention them by name
- Provide relevant details when available`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user",
          content: question,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      response: responseContent,
      model: "llama-3.1-8b",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Groq API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check if it's an auth error
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        {
          error: "Invalid API Key",
          message:
            "Your Groq API key is invalid. Please get a free key from https://console.groq.com/keys",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate response",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}


