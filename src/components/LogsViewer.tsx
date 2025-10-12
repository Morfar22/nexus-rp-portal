import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, AlertCircle, Info, AlertTriangle, XCircle, ChevronDown, Filter, Download, Eye, Database, Lock, Zap, Calendar, Clock, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
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
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  method?: string;
  function_id?: string;
  execution_time?: number;
  error_severity?: string;
  identifier?: string;
}

const getHumanReadableMessage = (message: string, type: string, log: any) => {
  if (type === 'auth') {
    if (message.includes('Authentication event')) {
      return `User authentication ${log.status === 200 ? 'successful' : 'failed'} on ${log.path || 'unknown route'}`;
    }
    if (message.includes('login')) {
      return 'User logged into the system';
    }
    if (message.includes('logout')) {
      return 'User logged out of the system';
    }
    if (message.includes('signup')) {
      return 'New user account created';
    }
    return message || 'Authentication activity detected';
  }
  
  if (type === 'database') {
    if (message.includes('Sample database log')) {
      return 'Database activity recorded';
    }
    if (message.includes('connection')) {
      return 'Database connection event';
    }
    if (message.includes('query')) {
      return 'Database query executed';
    }
    return message || 'Database operation completed';
  }
  
  if (type === 'functions') {
    if (message.includes('Function executed')) {
      return `${log.function_id || 'Function'} executed successfully in ${log.execution_time_ms || 0}ms`;
    }
    if (message.includes('error')) {
      return `Error in function ${log.function_id || 'unknown'}`;
    }
    if (message.includes('timeout')) {
      return `Function ${log.function_id || 'unknown'} timed out`;
    }
    return message || `${log.function_id || 'Function'} activity`;
  }
  
  return message || 'System activity recorded';
};

// Move LogTable outside to prevent recreation on every render
const LogTable = ({ 
  logs, 
  title, 
  type, 
  searchTerm, 
  levelFilter, 
  timeFilter,
  itemsPerPage,
  currentPage,
  setCurrentPage,
  getLogLevelIcon,
  getLogLevelColor,
  formatTimestamp,
  exportLogs,
  filterLogs
}: { 
  logs: LogEntry[], 
  title: string, 
  type: string,
  searchTerm: string,
  levelFilter: string,
  timeFilter: string,
  itemsPerPage: number,
  currentPage: number,
  setCurrentPage: (page: number) => void,
  getLogLevelIcon: (level: string) => JSX.Element,
  getLogLevelColor: (level: string) => string,
  formatTimestamp: (timestamp: string | number) => any,
  exportLogs: (logs: LogEntry[], type: string) => void,
  filterLogs: (logs: LogEntry[]) => LogEntry[]
}) => {
  const filteredLogs = filterLogs(logs);
  console.log(`🔍 LogTable for ${type}: raw logs count=${logs.length}, filtered logs count=${filteredLogs.length}`);
  
  // Reset to page 1 when filters change - only when they actually change
  useEffect(() => {
    console.log(`🔄 ${type} useEffect triggered - resetting to page 1. Filters:`, {
      searchTerm, 
      levelFilter, 
      timeFilter,
      currentPage
    });
    setCurrentPage(1);
  }, [searchTerm, levelFilter, timeFilter, setCurrentPage, type]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  const currentItemStart = filteredLogs.length === 0 ? 0 : startIndex + 1;
  const currentItemEnd = Math.min(startIndex + itemsPerPage, filteredLogs.length);
  
  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          {type === 'auth' && <Lock className="h-5 w-5 text-blue-400" />}
          {type === 'database' && <Database className="h-5 w-5 text-green-400" />}
          {type === 'functions' && <Zap className="h-5 w-5 text-purple-400" />}
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-muted-foreground">
            {filteredLogs.length} of {logs.length} entries
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLogs(filteredLogs, type)}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Pagination Info */}
      {filteredLogs.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {currentItemStart} to {currentItemEnd} of {filteredLogs.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <ScrollArea className="h-[600px] w-full">
        <div className="space-y-2 pr-4">
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No logs found matching current filters</p>
              <p className="text-sm mt-2">
                Raw logs: {logs.length} | After filters: {filteredLogs.length}
              </p>
              <p className="text-xs mt-1">
                Time filter: {timeFilter} | Level filter: {levelFilter}
              </p>
            </div>
          ) : (
            paginatedLogs.map((log, index) => (
              <div key={log.id} className="border border-gaming-border rounded-lg p-4 bg-gaming-dark/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getLogLevelIcon(log.level)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{log.event_message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(log.timestamp).relative}
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Bottom Pagination Controls */}
      {filteredLogs.length > itemsPerPage && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      )}
    </Card>
  );
};

const LogsViewer = () => {
  const [authLogs, setAuthLogs] = useState<LogEntry[]>([]);
  const [dbLogs, setDbLogs] = useState<LogEntry[]>([]);
  const [edgeLogs, setEdgeLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [authCurrentPage, setAuthCurrentPage] = useState(1);
  const [dbCurrentPage, setDbCurrentPage] = useState(1);
  const [edgeCurrentPage, setEdgeCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const { toast } = useToast();

  console.log('🔧 LogsViewer component mounted/rendered');

  const fetchLogs = async () => {
    console.log('🚀 Starting fetchLogs function...');
    setLoading(true);
    try {
      console.log('🔍 Fetching logs from analytics...');
      console.log('📡 Supabase client available:', !!supabase);
      
      // Fetch logs in parallel
      console.log('📡 About to call edge functions...');
      const [authRes, dbRes, edgeRes] = await Promise.all([
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'auth', limit: 100 }
        }).then(res => {
          console.log('✅ Auth function response:', res);
          return res;
        }).catch(err => {
          console.error('❌ Auth logs fetch failed:', err);
          return { data: null, error: err };
        }),
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'database', limit: 100 }
        }).then(res => {
          console.log('✅ DB function response:', res);
          return res;
        }).catch(err => {
          console.error('❌ Database logs fetch failed:', err);
          return { data: null, error: err };
        }),
        supabase.functions.invoke('fetch-analytics-logs', {
          body: { logType: 'functions', limit: 100 }
        }).then(res => {
          console.log('✅ Edge function response:', res);
          return res;
        }).catch(err => {
          console.error('❌ Edge function logs fetch failed:', err);
          return { data: null, error: err };
        })
      ]);

      console.log('📊 Log fetch results:', {
        auth: authRes,
        database: dbRes,
        edge: edgeRes
      });

      // Process auth logs
      console.log('📋 Processing auth logs:', authRes);
      if (authRes.data?.success && authRes.data?.data) {
        const processedAuthLogs = authRes.data.data.map((log: any) => ({
          id: log.id || `auth-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.level || 'info',
          event_message: getHumanReadableMessage(log.event_message || '', 'auth', log),
          msg: log.msg,
          path: log.path,
          status: log.status,
          error: log.error,
          user_id: log.user_id,
          ip_address: log.ip_address,
          user_agent: log.user_agent
        }));
        console.log('✅ Auth logs processed:', processedAuthLogs.length);
        setAuthLogs(processedAuthLogs);
      } else {
        console.log('❌ No auth logs data:', authRes.error || 'Unknown error');
        setAuthLogs([]);
      }

      // Process database logs  
      console.log('📋 Processing database logs:', dbRes);
      if (dbRes.data?.success && dbRes.data?.data) {
        const processedDbLogs = dbRes.data.data.map((log: any) => ({
          id: log.id || `db-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.error_severity || 'LOG',
          event_message: getHumanReadableMessage(log.event_message || '', 'database', log),
          msg: log.event_message,
          path: null,
          status: null,
          error: null,
          error_severity: log.error_severity,
          identifier: log.identifier
        }));
        console.log('✅ Database logs processed:', processedDbLogs.length);
        setDbLogs(processedDbLogs);
      } else {
        console.log('❌ No database logs data:', dbRes.error || 'Unknown error');
        setDbLogs([]);
      }

      // Process edge function logs
      console.log('📋 Processing edge function logs:', edgeRes);
      if (edgeRes.data?.success && edgeRes.data?.data) {
        const processedEdgeLogs = edgeRes.data.data.map((log: any) => ({
          id: log.id || `edge-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp,
          level: log.status_code >= 400 ? 'error' : log.status_code >= 300 ? 'warn' : 'info',
          event_message: getHumanReadableMessage(log.event_message || '', 'functions', log),
          msg: `${log.method || 'GET'} - ${log.function_id || 'unknown'} (${log.execution_time_ms || 0}ms)`,
          path: log.function_id,
          status: log.status_code?.toString(),
          error: null,
          method: log.method,
          function_id: log.function_id,
          execution_time: log.execution_time_ms
        }));
        console.log('✅ Edge function logs processed:', processedEdgeLogs.length);
        setEdgeLogs(processedEdgeLogs);
      } else {
        console.log('❌ No edge function logs data:', edgeRes.error || 'Unknown error');
        setEdgeLogs([]);
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
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(interval);
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
    let date: Date;
    
    if (typeof timestamp === 'number') {
      // Timestamps are now in milliseconds
      date = new Date(timestamp);
    } else {
      // Normalize placeholder timestamps like "+057618-..." to now
      if (/^\+\d+/.test(timestamp)) {
        date = new Date();
      } else {
        date = new Date(timestamp);
      }
    }
    
    // Fallback to current time if date is invalid
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filterLogs = (logs: LogEntry[]) => {
    console.log('🔍 filterLogs called with:', { 
      totalLogs: logs.length, 
      searchTerm, 
      levelFilter, 
      timeFilter,
      firstLog: logs[0]
    });

    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.event_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.msg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.function_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level?.toLowerCase() === levelFilter.toLowerCase());
    }

    // Time filter
    if (timeFilter !== 'all') {
      console.log('⏰ Applying time filter:', timeFilter);
      const now = new Date();
      const timeThreshold = new Date();
      
      switch (timeFilter) {
        case '1h':
          timeThreshold.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeThreshold.setDate(now.getDate() - 1);
          break;
        case '7d':
          timeThreshold.setDate(now.getDate() - 7);
          break;
        case '30d':
          timeThreshold.setDate(now.getDate() - 30);
          break;
      }
      
      console.log('⏰ Time threshold:', timeThreshold);
      console.log('⏰ Current time:', now);
      
      filtered = filtered.filter(log => {
        let logDate: Date;
        const ts: any = log.timestamp as any;
        
        console.log('⏰ Processing log timestamp:', ts, 'type:', typeof ts);
        
        if (typeof ts === 'number') {
          // Handle timestamps - if it looks like milliseconds, use directly
          logDate = new Date(ts);
        } else {
          logDate = new Date(ts);
        }
        
        console.log('⏰ Converted log date:', logDate);
        console.log('⏰ Is valid date:', !isNaN(logDate.getTime()));
        console.log('⏰ Log date >= threshold:', logDate >= timeThreshold);
        
        return !isNaN(logDate.getTime()) && logDate >= timeThreshold;
      });
      
      console.log('⏰ After time filter:', filtered.length, 'logs remain');
    }

    return filtered.sort((a, b) => {
      const parseTs = (t: any) => {
        if (typeof t === 'number') return new Date(t);
        return /^\+\d+/.test(t) ? new Date() : new Date(t);
      };
      const dateA = parseTs(a.timestamp as any);
      const dateB = parseTs(b.timestamp as any);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const exportLogs = (logs: LogEntry[], type: string) => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${type}-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Logs Monitor</h2>
          <p className="text-muted-foreground">Real-time monitoring of authentication, database, and edge function logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Updates Every 30s</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-foreground hover:bg-gaming-accent/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="p-4 bg-gaming-card border-gaming-border">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Search</label>
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gaming-dark border-gaming-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Level</label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="bg-gaming-dark border-gaming-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gaming-dark border-gaming-border">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="log">Log</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time Range</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-gaming-dark border-gaming-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gaming-dark border-gaming-border">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Authentication</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Edge Functions</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="mt-6">
          <LogTable 
            logs={authLogs} 
            title="Authentication Logs" 
            type="auth"
            searchTerm={searchTerm}
            levelFilter={levelFilter}
            timeFilter={timeFilter}
            itemsPerPage={itemsPerPage}
            currentPage={authCurrentPage}
            setCurrentPage={setAuthCurrentPage}
            getLogLevelIcon={getLogLevelIcon}
            getLogLevelColor={getLogLevelColor}
            formatTimestamp={formatTimestamp}
            exportLogs={exportLogs}
            filterLogs={filterLogs}
          />
        </TabsContent>
        
        <TabsContent value="database" className="mt-6">
          <LogTable 
            logs={dbLogs} 
            title="Database Logs" 
            type="database"
            searchTerm={searchTerm}
            levelFilter={levelFilter}
            timeFilter={timeFilter}
            itemsPerPage={itemsPerPage}
            currentPage={dbCurrentPage}
            setCurrentPage={setDbCurrentPage}
            getLogLevelIcon={getLogLevelIcon}
            getLogLevelColor={getLogLevelColor}
            formatTimestamp={formatTimestamp}
            exportLogs={exportLogs}
            filterLogs={filterLogs}
          />
        </TabsContent>
        
        <TabsContent value="functions" className="mt-6">
          <LogTable 
            logs={edgeLogs} 
            title="Edge Function Logs" 
            type="functions"
            searchTerm={searchTerm}
            levelFilter={levelFilter}
            timeFilter={timeFilter}
            itemsPerPage={itemsPerPage}
            currentPage={edgeCurrentPage}
            setCurrentPage={setEdgeCurrentPage}
            getLogLevelIcon={getLogLevelIcon}
            getLogLevelColor={getLogLevelColor}
            formatTimestamp={formatTimestamp}
            exportLogs={exportLogs}
            filterLogs={filterLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogsViewer;
