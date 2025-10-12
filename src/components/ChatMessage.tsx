import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, FileIcon, ImageIcon, Download, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    message: string;
    sender_type: 'visitor' | 'staff' | 'ai';
    created_at: string;
    sender_id?: string;
    attachments?: ChatAttachment[];
  };
  isOwn?: boolean;
  senderName?: string;
  showAvatar?: boolean;
}

export default function ChatMessage({ 
  message, 
  isOwn = false, 
  senderName,
  showAvatar = true 
}: ChatMessageProps) {
  const [imageError, setImageError] = useState<string[]>([]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (type: string) => {
    return type.startsWith('image/');
  };

  const handleImageError = (attachmentId: string) => {
    setImageError(prev => [...prev, attachmentId]);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const getSenderIcon = () => {
    switch (message.sender_type) {
      case 'ai':
        return <Bot className="h-4 w-4 text-purple-500" />;
      case 'staff':
        return <User className="h-4 w-4 text-neon-teal" />;
      default:
        return <User className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSenderBadge = () => {
    switch (message.sender_type) {
      case 'ai':
        return (
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Bot className="h-3 w-3 mr-1" />
            AI Assistant
          </Badge>
        );
      case 'staff':
        return (
          <Badge variant="secondary" className="bg-neon-teal/20 text-neon-teal border-neon-teal/30">
            Staff
          </Badge>
        );
      default:
        return null;
    }
  };

  const getMessageStyles = () => {
    if (message.sender_type === 'ai') {
      return 'bg-purple-500/10 border border-purple-500/20 text-foreground';
    } else if (isOwn) {
      return 'bg-neon-teal text-white';
    } else {
      return 'bg-gaming-dark border border-gaming-border text-foreground';
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} flex items-end space-x-2`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8 mb-1">
            <AvatarFallback className="bg-gaming-darker text-foreground">
              {getSenderIcon()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} space-y-1 max-w-full`}>
          {/* Sender info */}
          {!isOwn && (senderName || message.sender_type === 'ai') && (
            <div className="flex items-center space-x-2">
              {senderName && (
                <span className="text-xs text-muted-foreground font-medium">
                  {senderName}
                </span>
              )}
              {getSenderBadge()}
            </div>
          )}

          {/* Message bubble */}
          <div className={`p-3 rounded-lg text-sm relative ${getMessageStyles()}`}>
            {/* Message text */}
            <div className="whitespace-pre-wrap break-words">
              {message.message}
            </div>

            {/* File attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className="border border-gray-500/20 rounded-lg overflow-hidden">
                    {isImageFile(attachment.file_type) && !imageError.includes(attachment.id) ? (
                      <div className="relative">
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="max-w-full max-h-64 rounded-t-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                          onError={() => handleImageError(attachment.id)}
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            onClick={() => window.open(attachment.file_url, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="p-2 bg-gray-900/50 text-xs text-white">
                          {attachment.file_name} • {formatFileSize(attachment.file_size)}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => downloadFile(attachment.file_url, attachment.file_name)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs opacity-70 mt-2">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}