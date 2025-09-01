import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';

interface FileAttachmentProps {
  sessionId: string;
  senderId?: string;
  senderType: 'visitor' | 'staff';
  onFileUploaded?: (attachment: any) => void;
  isDisabled?: boolean;
}

interface UploadingFile {
  name: string;
  size: number;
  type: string;
  progress: number;
}

export default function FileAttachment({ 
  sessionId, 
  senderId, 
  senderType, 
  onFileUploaded,
  isDisabled 
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const handleFileSelect = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      await uploadFile(file);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `${file.name} is larger than 10MB limit`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only images, PDFs, text files, and Word documents are allowed",
        variant: "destructive"
      });
      return;
    }

    const uploadingFile: UploadingFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('senderType', senderType);
      if (senderId) {
        formData.append('senderId', senderId);
      }

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('chat-file-upload', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        onFileUploaded?.(data.attachment);
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded successfully`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
    }
  };

  const removeUploadingFile = (fileName: string) => {
    setUploadingFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        onClick={handleFileSelect}
        disabled={isDisabled || uploadingFiles.length > 0}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-neon-teal"
        title="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Upload progress indicators */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 space-y-2">
          {uploadingFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="bg-gaming-card border border-gaming-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-teal" />
                  <Button
                    onClick={() => removeUploadingFile(file.name)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}