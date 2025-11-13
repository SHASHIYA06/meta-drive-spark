import { FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileListProps {
  files: any[];
  selectedFiles: string[];
  onSelectFile: (fileId: string, checked: boolean) => void;
}

export const FileList = ({ files, selectedFiles, onSelectFile }: FileListProps) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('image')) return Image;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    return File;
  };

  if (files.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a folder to view files</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {files.map((file) => {
          const Icon = getFileIcon(file.mimeType);
          const isSelected = selectedFiles.includes(file.id);

          return (
            <div
              key={file.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isSelected 
                  ? 'bg-primary/10 border-primary/50' 
                  : 'bg-muted/5 border-muted/20 hover:bg-muted/10'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectFile(file.id, checked as boolean)}
              />
              <Icon className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
