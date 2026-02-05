"use client";

import Image from "next/image";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ResearchChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/research-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          question: inputValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);

      const errorAssistantMessage: Message = {
        id: `assistant_error_${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}. Please make sure the API is configured correctly.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div
        className="fixed bottom-20 right-4 flex items-center gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip */}
        {isHovered && (
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap dark:bg-gray-800 animate-in fade-in-50 duration-200">
            You can ask anything about me!
            <div className="absolute w-0 h-0 border-l-8 border-r-0 border-t-8 border-b-0 border-l-transparent border-t-gray-900 -right-2 top-1/2 transform -translate-y-1/2 dark:border-t-gray-800"></div>
          </div>
        )}
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="hover:opacity-80 transition-opacity pulse-halo rounded-full"
          title="Ask me anything about my research"
          aria-label="Open research chat"
        >
          <Image
            src="/icon.png"
            alt="Chat"
            width={56}
            height={56}
            className="size-14"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-1rem)] flex flex-col rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-3 text-black dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h3 className="font-semibold">Ask My Research</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 max-h-96">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
            <div>
              <p className="font-medium">Ask me anything about my research!</p>
              <p className="mt-2 text-xs">
                I&apos;ll answer based on my projects, publications, and blog
                posts.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="max-w-xs rounded-lg bg-gray-200 px-3 py-2 dark:bg-gray-700">
              <div className="flex gap-1">
                <div className="size-2 animate-bounce rounded-full bg-gray-600 dark:bg-gray-400"></div>
                <div className="animation-bounce size-2 rounded-full bg-gray-600 animation-delay-100 dark:bg-gray-400"></div>
                <div className="size-2 animate-bounce rounded-full bg-gray-600 animation-delay-200 dark:bg-gray-400"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
