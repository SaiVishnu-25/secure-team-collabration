import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  MoreHorizontal,
  Upload,
  Plus,
  Grid,
  List,
  Search,
  Download,
  Trash2,
  Share,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { files as mockFiles, users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FileItem } from '@/types/teams';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return Folder;
  if (file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel')) return FileSpreadsheet;
  if (file.mimeType?.includes('image')) return FileImage;
  return FileText;
};

const getFileIconColor = (file: FileItem) => {
  if (file.type === 'folder') return 'text-yellow-500';
  if (file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel')) return 'text-green-600';
  if (file.mimeType?.includes('powerpoint')) return 'text-orange-500';
  if (file.mimeType?.includes('word')) return 'text-blue-600';
  if (file.mimeType?.includes('pdf')) return 'text-red-500';
  return 'text-muted-foreground';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FilesView() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    // Navigate to secure upload page
    navigate('/upload');
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Navigate to upload page with file preselected
      navigate('/upload');
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNewClick = () => {
    // For now, trigger file input for creating/uploading
    // You can extend this to show a dialog for creating folders
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex bg-background">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        multiple={false}
      />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Files</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={handleNewClick}
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files"
                className="pl-9 h-8 bg-muted border-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-8 h-8', viewMode === 'list' && 'bg-muted')}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-8 h-8', viewMode === 'grid' && 'bg-muted')}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-auto teams-scrollbar p-4">
          {viewMode === 'list' ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Modified</th>
                  <th className="pb-3 font-medium">Modified by</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {mockFiles.map((file) => {
                  const Icon = getFileIcon(file);
                  const iconColor = getFileIconColor(file);

                  return (
                    <tr
                      key={file.id}
                      className={cn(
                        'border-b hover:bg-teams-hover cursor-pointer transition-colors',
                        selectedFile?.id === file.id && 'bg-teams-active'
                      )}
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Icon className={cn('w-5 h-5', iconColor)} />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {format(file.modifiedAt, 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {file.modifiedBy.name}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {file.type === 'folder' ? '-' : formatFileSize(file.size)}
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Download className="w-4 h-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Share className="w-4 h-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Star className="w-4 h-4" />
                              Add to favorites
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mockFiles.map((file) => {
                const Icon = getFileIcon(file);
                const iconColor = getFileIconColor(file);

                return (
                  <div
                    key={file.id}
                    className={cn(
                      'p-4 rounded-lg border hover:bg-teams-hover cursor-pointer transition-colors',
                      selectedFile?.id === file.id && 'border-primary bg-teams-active'
                    )}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center justify-center h-20 mb-3">
                      <Icon className={cn('w-12 h-12', iconColor)} />
                    </div>
                    <p className="font-medium text-sm truncate mb-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(file.modifiedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* File Details Panel */}
      {selectedFile && (
        <div className="w-72 border-l flex flex-col">
          <div className="h-12 border-b flex items-center justify-between px-4">
            <h2 className="font-semibold text-sm truncate">{selectedFile.name}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setSelectedFile(null)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto teams-scrollbar p-4">
            {/* Preview */}
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg mb-4">
              {(() => {
                const Icon = getFileIcon(selectedFile);
                const iconColor = getFileIconColor(selectedFile);
                return <Icon className={cn('w-16 h-16', iconColor)} />;
              })()}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-sm">
                  {selectedFile.type === 'folder' ? 'Folder' : selectedFile.mimeType || 'File'}
                </p>
              </div>
              
              {selectedFile.size && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <p className="text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modified</p>
                <p className="text-sm">{format(selectedFile.modifiedAt, 'MMM d, yyyy h:mm a')}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modified by</p>
                <p className="text-sm">{selectedFile.modifiedBy.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Share className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
