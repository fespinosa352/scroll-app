import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Eye, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Target,
  RefreshCw,
  Maximize,
  Minimize
} from 'lucide-react';
import { useMarkupConverter } from '@/hooks/useMarkupConverter';
import { useATSAnalyzer } from '@/hooks/useATSAnalyzer';
import { QuickSuggestions } from './QuickSuggestions';
import { MarkupGuide } from './MarkupGuide';
import { ResumePreview } from './ResumePreview';
import { ATSInsights } from './ATSInsights';

interface ResumeEditorProps {
  initialContent?: string;
  onSave?: (markup: string, structured: any) => void;
  onExport?: (format: 'copy' | 'txt') => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  initialContent = '',
  onSave,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markupContent, setMarkupContent] = useState(initialContent || `# Your Name

your.email@example.com
(555) 123-4567
linkedin.com/in/yourprofile

## Professional Experience

### Your Current Job Title
**Your Company Name**

- Add your key achievements here
- Use action verbs and quantify results
- Focus on impact and outcomes

### Previous Position
**Previous Company**

- Another achievement with metrics
- Show progression and growth
- Highlight relevant skills`);

  const { structuredData, convertMarkupToStructured, convertStructuredToMarkup } = useMarkupConverter();
  const { atsAnalysis, analyzeContent, isAnalyzing } = useATSAnalyzer();

  // Real-time conversion and analysis
  const processContent = useCallback(async () => {
    const structured = convertMarkupToStructured(markupContent);
    await analyzeContent(structured);
  }, [markupContent, convertMarkupToStructured, analyzeContent]);

  useEffect(() => {
    const debounceTimer = setTimeout(processContent, 300);
    return () => clearTimeout(debounceTimer);
  }, [markupContent, processContent]);

  // Keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 key to toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
      // Escape key to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleSave = () => {
    if (onSave) {
      onSave(markupContent, structuredData);
    }
  };

  const handleExport = (format: 'copy' | 'txt') => {
    if (onExport) {
      onExport(format);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const textarea = document.getElementById('markup-editor') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart || markupContent.length;
    const newContent = 
      markupContent.slice(0, cursorPos) + 
      '\n- ' + suggestion + 
      markupContent.slice(cursorPos);
    setMarkupContent(newContent);
  };


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Resume Editor</h1>
        <p className="text-slate-600">Write naturally with markup, get AI-powered ATS optimization</p>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Markup Editor</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Live Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div className={isFullscreen ? "w-full" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
            <div className={isFullscreen ? "w-full" : "lg:col-span-2"}>
              <Card className={isFullscreen ? "h-[calc(100vh-12rem)]" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Markup Editor</CardTitle>
                    <div className="flex items-center space-x-2">
                      {isAnalyzing && <RefreshCw className="h-4 w-4 animate-spin" />}
                      <Badge variant="secondary">
                        {markupContent.split('\n').length} lines
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-8 w-8 p-0"
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4" />
                        ) : (
                          <Maximize className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={isFullscreen ? "h-[calc(100vh-16rem)] flex flex-col" : ""}>
                  <textarea
                    id="markup-editor"
                    value={markupContent}
                    onChange={(e) => setMarkupContent(e.target.value)}
                    className={`w-full p-4 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isFullscreen ? 'flex-1 h-full' : 'h-96'
                    }`}
                    placeholder="Start typing your resume in markdown format..."
                  />
                  <MarkupGuide />
                </CardContent>
              </Card>
            </div>

            {!isFullscreen && (
              <div className="space-y-4">
                <QuickSuggestions onInsert={insertSuggestion} />
                
                {structuredData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Keywords Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {structuredData.keywordsFound?.slice(0, 8).map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <ResumePreview structuredData={structuredData} />
        </TabsContent>

        <TabsContent value="structured">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(structuredData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize">
          <ATSInsights analysis={atsAnalysis} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center space-x-4">
        <Button size="lg" className="px-8" onClick={handleSave}>
          Save Resume
        </Button>
        <Button size="lg" variant="outline" className="px-8" onClick={() => handleExport('copy')}>
          Copy to Clipboard
        </Button>
        <Button size="lg" variant="outline" className="px-8" onClick={() => handleExport('txt')}>
          Download TXT
        </Button>
      </div>
    </div>
  );
};