import { Folder, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FolderTreeProps {
  folders: any[];
  onSelectFolder: (folderId: string) => void;
  selectedFolder: string;
}

export const FolderTree = ({ folders, onSelectFolder, selectedFolder }: FolderTreeProps) => {
  if (folders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No folders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {folders.map((folder) => (
        <Button
          key={folder.id}
          variant={selectedFolder === folder.id ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
          onClick={() => onSelectFolder(folder.id)}
        >
          <ChevronRight className={`w-4 h-4 mr-2 transition-transform ${
            selectedFolder === folder.id ? 'rotate-90' : ''
          }`} />
          <Folder className="w-4 h-4 mr-2" />
          <span className="truncate">{folder.name}</span>
        </Button>
      ))}
    </div>
  );
};
