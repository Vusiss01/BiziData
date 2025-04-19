import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Maximize2,
  Minimize2,
  Code,
  Copy,
  Database,
  X,
  Loader2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
}

interface AIChatAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AIChatAssistant = ({
  isOpen = true,
  onClose = () => {},
}: AIChatAssistantProps) => {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your FoodBase AI assistant. I can help you with creating data models, managing your restaurant database, and answering any questions about the platform. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "ai",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      setMessages((prev) => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex((msg) => msg.isLoading);
        if (loadingIndex !== -1) {
          newMessages.splice(loadingIndex, 1);
        }
        return newMessages;
      });

      const aiResponse = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string) => {
    const userInputLower = userInput.toLowerCase();

    // Restaurant-related queries
    if (
      userInputLower.includes("create restaurant") ||
      userInputLower.includes("add restaurant")
    ) {
      return "I can help you create a new restaurant in your database. To get started, go to the 'Create Project' button on the dashboard and select 'Restaurant' as your project type. You'll need to provide basic information like name, address, and cuisine type. Would you like me to guide you through the process step by step?";
    }

    // Menu-related queries
    if (
      userInputLower.includes("menu") ||
      userInputLower.includes("food item")
    ) {
      return "Managing menu items is easy with FoodBase. You can create, update, and organize your menu items with categories, prices, and images. Each item can have attributes like ingredients, allergens, and nutritional information. Would you like me to show you how to set up your menu structure?";
    }

    // Order-related queries
    if (
      userInputLower.includes("order") ||
      userInputLower.includes("delivery")
    ) {
      return "FoodBase's order management system tracks orders from receipt to delivery. You can view order status, manage delivery assignments, and analyze order patterns. The system supports real-time updates so your customers always know where their food is. Would you like me to explain how to set up order tracking?";
    }

    // Data model queries
    if (
      userInputLower.includes("data model") ||
      userInputLower.includes("schema")
    ) {
      return "FoodBase offers pre-built data models specifically designed for food delivery businesses. These include models for restaurants, menu items, orders, customers, and delivery tracking. Each model can be customized to fit your specific needs. Would you like me to create a new data model for you or explain the existing ones in more detail?";
    }

    // API-related queries
    if (
      userInputLower.includes("api") ||
      userInputLower.includes("integration")
    ) {
      return "Our API allows you to integrate FoodBase with your existing systems or mobile apps. We provide SDKs for JavaScript, Python, and mobile platforms. Each API endpoint is documented with examples. Would you like me to help you generate API keys or explain how to make specific API calls?";
    }

    // Help with code
    if (
      userInputLower.includes("code") ||
      userInputLower.includes("javascript") ||
      userInputLower.includes("react")
    ) {
      return "I can help you with code examples for integrating FoodBase into your application. Here's a simple example to get started:\n\n```javascript\n// Initialize the FoodBase SDK\nconst foodbase = new FoodBase({\n  apiKey: 'YOUR_API_KEY'\n});\n\n// Fetch all restaurants\nconst getRestaurants = async () => {\n  try {\n    const restaurants = await foodbase.restaurants.getAll();\n    console.log(restaurants);\n  } catch (error) {\n    console.error('Error fetching restaurants:', error);\n  }\n};\n```\n\nWould you like more specific code examples?";
    }

    // Default response for other queries
    return "I'm here to help with all aspects of your food delivery database needs. I can assist with creating data models, managing restaurant information, setting up menus, tracking orders, and integrating with your applications. What specific area would you like help with today?";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const formatMessage = (content: string) => {
    // Simple formatting for code blocks
    if (content.includes("```")) {
      const parts = content.split("```");
      return (
        <>
          {parts.map((part, index) => {
            if (index % 2 === 0) {
              return (
                <p key={index} className="whitespace-pre-wrap">
                  {part}
                </p>
              );
            } else {
              const language = part.split("\n")[0];
              const code = part.substring(language.length + 1);
              return (
                <div key={index} className="my-2 relative">
                  <div className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto font-mono text-sm">
                    <pre>{code}</pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              );
            }
          })}
        </>
      );
    }

    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`flex flex-col rounded-lg border shadow-lg bg-card ${expanded ? "w-[500px] h-[600px]" : "w-[350px] h-[500px]"}`}
          transition={{ duration: 0.2 }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b bg-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <h3 className="font-medium">FoodBase AI Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleExpanded}
                      className="text-white hover:bg-orange-500"
                    >
                      {expanded ? (
                        <Minimize2 size={16} />
                      ) : (
                        <Maximize2 size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{expanded ? "Minimize" : "Maximize"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-white hover:bg-orange-500"
                    >
                      <X size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${message.sender === "user" ? "bg-orange-600 text-white" : "bg-gray-100"}`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center justify-center h-6">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm">
                          {formatMessage(message.content)}
                        </div>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Try asking about:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Creating a restaurant",
                  "Menu management",
                  "Order tracking",
                  "Data models",
                  "API integration",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 h-auto"
                    onClick={() => {
                      setInputValue(suggestion);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about FoodBase..."
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="self-end bg-orange-600 hover:bg-orange-700"
                size="icon"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <Zap className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-xs text-gray-500">
                  Powered by FoodBase AI
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-0 px-1 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setMessages([
                    {
                      id: "1",
                      content:
                        "Hello! I'm your FoodBase AI assistant. I can help you with creating data models, managing your restaurant database, and answering any questions about the platform. How can I help you today?",
                      sender: "ai",
                      timestamp: new Date(),
                    },
                  ]);
                }}
              >
                Clear chat
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AIChatAssistant;
