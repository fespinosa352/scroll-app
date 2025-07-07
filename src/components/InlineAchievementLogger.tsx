import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, TrendingUp, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SmartSuggestion {
  id: string;
  text: string;
  category: string;
  atsImpact: number;
}

const InlineAchievementLogger = () => {
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Smart suggestions based on common achievements
  const smartSuggestions: SmartSuggestion[] = [
    {
      id: "1",
      text: "Led a project that improved team efficiency",
      category: "Leadership",
      atsImpact: 8
    },
    {
      id: "2", 
      text: "Completed a certification or training program",
      category: "Skills",
      atsImpact: 6
    },
    {
      id: "3",
      text: "Exceeded quarterly targets or KPIs",
      category: "Performance",
      atsImpact: 9
    },
    {
      id: "4",
      text: "Implemented a process improvement initiative",
      category: "Innovation",
      atsImpact: 7
    }
  ];

  const handleQuickAdd = async (suggestionText?: string) => {
    const achievement = suggestionText || inputValue;
    if (!achievement.trim()) return;

    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate ATS impact (simulate analysis)
    const atsImpact = suggestionText 
      ? smartSuggestions.find(s => s.text === suggestionText)?.atsImpact || 5
      : Math.floor(Math.random() * 5) + 4; // 4-8 points

    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <div>
          <p className="font-medium">Achievement logged!</p>
          <p className="text-sm text-slate-600">+{atsImpact} ATS score points</p>
        </div>
      </div>
    );

    setInputValue("");
    setIsAdding(false);
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    handleQuickAdd(suggestion.text);
  };

  if (!isAdding && showSuggestions) {
    return (
      <div className="space-y-4">
        {/* Smart Suggestions */}
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-slate-900">We noticed you might have achieved...</h4>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {smartSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  size="touch"
                  className="h-auto p-4 justify-start text-left bg-white/80 hover:bg-white border-blue-200"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isProcessing}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{suggestion.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">+{suggestion.atsImpact} ATS</span>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Button */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-slate-400 transition-colors">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 hover:text-slate-900"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick add: "I just achieved..."
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-slate-900">Add Achievement</h4>
        </div>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your achievement..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            disabled={isProcessing}
          />
          <Button 
            onClick={() => handleQuickAdd()}
            disabled={!inputValue.trim() || isProcessing}
            variant="primary"
            size="touch"
            className="min-w-[48px]"
          >
            {isProcessing ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-500">
            Press Enter to add • We'll calculate your ATS impact
          </p>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setInputValue("");
            }}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineAchievementLogger;