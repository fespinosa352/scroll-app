
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  date: string;
  tags: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  achievement?: Achievement;
}

const ChatAchievementLogger = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your achievement assistant. Tell me about something great you accomplished recently, and I'll help you capture it properly for your resume. What win would you like to log today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const response = generateAIResponse(inputValue);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        achievement: response.achievement
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      if (response.achievement) {
        toast.success("Achievement logged successfully!");
      }
    }, 1500);
  };

  const generateAIResponse = (userInput: string) => {
    // Simple AI simulation - in real app, this would call an LLM
    const input = userInput.toLowerCase();
    
    if (input.includes("launch") || input.includes("project") || input.includes("product")) {
      const achievement: Achievement = {
        id: Date.now().toString(),
        title: "Product Launch Success",
        description: userInput,
        category: "Leadership",
        impact: "Successful product delivery",
        date: new Date().toISOString().split('T')[0],
        tags: ["leadership", "product-management", "project-delivery"]
      };

      return {
        content: "Great! I've captured your product launch achievement. This shows strong leadership and project management skills. The experience demonstrates your ability to drive results and deliver complex initiatives. Would you like to add any specific metrics or outcomes?",
        achievement
      };
    }

    if (input.includes("team") || input.includes("manage") || input.includes("lead")) {
      return {
        content: "That sounds like excellent leadership experience! Can you tell me more about the size of the team, the specific outcomes, and any measurable results? For example, did this improve efficiency, save costs, or increase revenue?"
      };
    }

    if (input.includes("save") || input.includes("improve") || input.includes("increase")) {
      return {
        content: "Excellent! Quantifiable achievements are gold for resumes. Can you share the specific numbers? For example, percentage improvements, dollar amounts saved, or time reduced? Also, what was your specific role in achieving this result?"
      };
    }

    return {
      content: "That's interesting! To help me capture this achievement effectively, could you tell me: 1) What was the specific challenge or goal? 2) What actions did you take? 3) What was the measurable outcome or impact?"
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'assistant' && (
                      <Bot className="w-5 h-5 mt-0.5 text-blue-600" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-5 h-5 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.achievement && (
                        <div className="mt-3 p-3 bg-white/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-medium">Achievement Logged</span>
                          </div>
                          <p className="text-xs font-medium">{message.achievement.title}</p>
                          <div className="flex gap-1 mt-2">
                            {message.achievement.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your latest achievement... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
              <Button 
                type="submit" 
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              I'll help you format your achievements for maximum impact on your resume
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAchievementLogger;
