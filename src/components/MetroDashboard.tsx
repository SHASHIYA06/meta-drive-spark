import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FolderPlus, 
  Search, 
  FileText, 
  Database,
  Sparkles,
  Download,
  RefreshCw,
  Loader2
} from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";
import { FolderTree } from "./FolderTree";
import { FileList } from "./FileList";
import { AIQueryPanel } from "./AIQueryPanel";
import { 
  uploadFiles, 
  listFolders, 
  listFiles, 
  createFolder,
  askAI,
  searchDocuments,
  searchArchitecture,
  searchStructured
} from "@/lib/api";

export const MetroDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string>("idle");

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await listFolders();
      setFolders(data.folders || []);
    } catch (error: any) {
      toast({
        title: "Error loading folders",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadFiles = async (folderId: string) => {
    try {
      setSelectedFolder(folderId);
      const data = await listFiles(folderId);
      setFiles(data.files || []);
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        title: "Error loading files",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setLoading(true);
    setProcessingStatus("uploading");

    try {
      const uploadPromises = Array.from(fileList).map(file => 
        uploadFiles([file], selectedFolder || undefined)
      );
      
      await Promise.all(uploadPromises);
      
      toast({
        title: "Upload successful",
        description: `${fileList.length} file(s) uploaded and indexed`,
      });
      
      if (selectedFolder) {
        await loadFiles(selectedFolder);
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProcessingStatus("idle");
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    try {
      await createFolder(name, selectedFolder || undefined);
      toast({
        title: "Folder created",
        description: `Folder "${name}" created successfully`,
      });
      await loadFolders();
    } catch (error: any) {
      toast({
        title: "Error creating folder",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAISearch = async (type: "document" | "architecture" | "structured") => {
    if (!aiQuery.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setProcessingStatus("searching");
    setAiResponse("");

    try {
      let response;
      
      if (type === "document") {
        response = await askAI(aiQuery, selectedFiles);
      } else if (type === "architecture") {
        response = await searchArchitecture(aiQuery, selectedFiles);
      } else {
        response = await searchStructured(aiQuery, selectedFiles);
      }

      setAiResponse(response.answer || response.result || "No results found");
      
      toast({
        title: "Search completed",
        description: "AI analysis ready",
      });
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProcessingStatus("idle");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-8 text-center">
        <h1 className="text-5xl font-bold mb-3">
          <span className="gradient-text">🚇 KMRCL Metro</span>
        </h1>
        <h2 className="text-3xl font-semibold mb-2 text-foreground">
          Document Intelligence
        </h2>
        <p className="text-muted-foreground text-lg">
          Document search • OCR • Architecture tracing • AI-powered insights
        </p>
        <StatusIndicator status={processingStatus} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Folder Tree */}
        <Card className="glass-panel rounded-xl p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Drive Folders
            </h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={loadFolders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="space-y-2 mb-4">
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
            
            <label className="w-full">
              <Button 
                className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50"
                disabled={loading}
                asChild
              >
                <span>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Files
                </span>
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>

          <FolderTree 
            folders={folders} 
            onSelectFolder={loadFiles}
            selectedFolder={selectedFolder}
          />
        </Card>

        {/* Middle Panel - File List */}
        <Card className="glass-panel rounded-xl p-6 col-span-1">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Files in Selected Folder
          </h3>
          
          <FileList 
            files={files}
            selectedFiles={selectedFiles}
            onSelectFile={(fileId, checked) => {
              setSelectedFiles(prev => 
                checked 
                  ? [...prev, fileId]
                  : prev.filter(id => id !== fileId)
              );
            }}
          />
        </Card>

        {/* Right Panel - AI Query */}
        <Card className="glass-panel rounded-xl p-6 col-span-1">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            AI Search & Analysis
          </h3>
          
          <AIQueryPanel
            query={aiQuery}
            onQueryChange={setAiQuery}
            response={aiResponse}
            loading={loading}
            onSearch={handleAISearch}
            selectedFilesCount={selectedFiles.length}
          />
        </Card>
      </div>
    </div>
  );
};
