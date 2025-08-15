import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RefreshCw, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  event_message: string;
  msg?: string;
  path?: string;
  status?: string;
  error?: string;
}

const LogsViewer = () => {
  const [authLogs, setAuthLogs] = useState<LogEntry[]>([]);
  const [dbLogs, setDbLogs] = useState<LogEntry[]>([]);
  const [edgeLogs, setEdgeLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch logs in parallel
      const [authRes, dbRes, edgeRes] = await Promise.all([
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'auth', limit: 100 }
        }),
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'database', limit: 100 }
        }),
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'functions', limit: 100 }
        })
      ]);

      // Process auth logs
      if (authRes.data?.success && authRes.data?.data) {
        const processedAuthLogs = authRes.data.data.map((log: any) => ({
          id: log.id || `auth-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.level || 'info',
          event_message: log.event_message || '',
          msg: log.msg,
          path: log.path,
          status: log.status,
          error: log.error
        }));
        setAuthLogs(processedAuthLogs);
      }

      // Process database logs
      if (dbRes.data?.success && dbRes.data?.data) {
        const processedDbLogs = dbRes.data.data.map((log: any) => ({
          id: log.id || `db-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.error_severity || 'info',
          event_message: log.event_message || '',
          msg: log.event_message,
          path: null,
          status: null,
          error: null
        }));
        setDbLogs(processedDbLogs);
      }

      // Process edge function logs
      if (edgeRes.data?.success && edgeRes.data?.data) {
        const processedEdgeLogs = edgeRes.data.data.map((log: any) => ({
          id: log.id || `edge-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.status_code >= 400 ? 'error' : 'info',
          event_message: log.event_message || '',
          msg: `${log.method || 'GET'} - ${log.function_id || 'unknown'} (${log.execution_time_ms || 0}ms)`,
          path: log.function_id,
          status: log.status_code?.toString(),
          error: null
        }));
        setEdgeLogs(processedEdgeLogs);
      }

    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLogLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'warn':
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'number' ? timestamp / 1000 : timestamp);
    return date.toLocaleString();
  };

  const filterLogs = (logs: LogEntry[]) => {
    if (!searchTerm) return logs;
    return logs.filter(log => 
      log.event_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.msg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.path?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const LogTable = ({ logs, title }: { logs: LogEntry[], title: string }) => (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <Badge variant="outline" className="text-muted-foreground">
          {logs.length} entries
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filterLogs(logs).map((log, index) => (
          <div key={log.id || index} className="p-3 bg-gaming-dark rounded-lg border border-gaming-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getLogLevelIcon(log.level)}
                <Badge className={getLogLevelColor(log.level)}>
                  {log.level || 'info'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              {log.status && (
                <Badge variant="outline" className="text-xs">
                  {log.status}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-foreground">
              {log.msg || log.event_message}
            </div>
            
            {log.path && (
              <div className="text-xs text-muted-foreground mt-1">
                Path: {log.path}
              </div>
            )}
            
            {log.error && (
              <div className="text-xs text-red-400 mt-1">
                Error: {log.error}
              </div>
            )}
          </div>
        ))}
        
        {filterLogs(logs).length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No logs found
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">System Logs</h2>
        <Button 
          onClick={fetchLogs} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="w-full max-w-md">
        <Input
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gaming-card border-gaming-border"
        />
      </div>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="mt-6">
          <LogTable logs={authLogs} title="Authentication Logs" />
        </TabsContent>
        
        <TabsContent value="database" className="mt-6">
          <LogTable logs={dbLogs} title="Database Logs" />
        </TabsContent>
        
        <TabsContent value="functions" className="mt-6">
          <LogTable logs={edgeLogs} title="Edge Function Logs" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogsViewer;