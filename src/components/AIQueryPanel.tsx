import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, Database, Sparkles, Download, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIQueryPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  response: string;
  loading: boolean;
  onSearch: (type: "document" | "architecture" | "structured") => void;
  selectedFilesCount: number;
}

export const AIQueryPanel = ({
  query,
  onQueryChange,
  response,
  loading,
  onSearch,
  selectedFilesCount
}: AIQueryPanelProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Textarea
          placeholder="Enter your search query here... e.g., 'Find all circuit diagrams related to power supply'"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          rows={4}
          className="bg-muted/10 border-primary/30 focus:border-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {selectedFilesCount > 0 
            ? `${selectedFilesCount} file(s) selected for search`
            : 'Select files or search all documents'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50"
          onClick={() => onSearch("document")}
          disabled={loading || !query.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Document Details (AI)
        </Button>

        <Button
          className="w-full bg-secondary/20 hover:bg-secondary/30 border border-secondary/50"
          onClick={() => onSearch("architecture")}
          disabled={loading || !query.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
          Architecture Search
        </Button>

        <Button
          className="w-full bg-accent/20 hover:bg-accent/30 border border-accent/50"
          onClick={() => onSearch("structured")}
          disabled={loading || !query.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Structured Search
        </Button>
      </div>

      {response && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">AI Response:</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const blob = new Blob([response], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ai-response.html';
                a.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <ScrollArea className="h-[300px] rounded-lg border border-primary/30 bg-muted/5 p-4">
            <div 
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: response }}
            />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
