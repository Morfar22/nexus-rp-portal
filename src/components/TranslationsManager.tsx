import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Download, Upload, Edit, RotateCcw, Check, AlertCircle } from "lucide-react";

interface TranslationOverride {
  id: string;
  translation_key: string;
  locale: string;
  value: string;
  category: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const SUPPORTED_LOCALES = ['en', 'da', 'es', 'fr', 'de', 'pt'];
const LOCALE_NAMES = {
  en: 'English',
  da: 'Dansk',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português'
};

export const TranslationsManager = () => {
  const { t, i18n } = useTranslation();
  const [overrides, setOverrides] = useState<TranslationOverride[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  useEffect(() => {
    fetchOverrides();
    setupRealtimeSubscription();
  }, []);

  const fetchOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('translation_overrides')
        .select('*')
        .order('translation_key');

      if (error) throw error;
      setOverrides(data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('translation_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translation_overrides'
        },
        () => {
          fetchOverrides();
          // Reload translations in i18n
          reloadTranslations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const reloadTranslations = async () => {
    try {
      const { data } = await supabase.functions.invoke('translation-sync');
      if (data?.translations) {
        Object.keys(data.translations).forEach(locale => {
          i18n.addResourceBundle(locale, 'translation', data.translations[locale], true, true);
        });
      }
    } catch (error) {
      console.error('Error reloading translations:', error);
    }
  };

  const getDefaultValue = (key: string, locale: string): string => {
    const resources = i18n.getResourceBundle(locale, 'translation');
    const keys = key.split('.');
    let value: any = resources;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return '';
      }
    }
    return typeof value === 'string' ? value : '';
  };

  const getOverrideValue = (key: string, locale: string): string => {
    const override = overrides.find(o => o.translation_key === key && o.locale === locale);
    return override?.value || '';
  };

  const getAllKeys = (): string[] => {
    const keys = new Set<string>();
    
    // Get keys from all locales
    SUPPORTED_LOCALES.forEach(locale => {
      const resources = i18n.getResourceBundle(locale, 'translation');
      const extractKeys = (obj: any, prefix = ''): void => {
        Object.keys(obj || {}).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            extractKeys(obj[key], fullKey);
          } else {
            keys.add(fullKey);
          }
        });
      };
      extractKeys(resources);
    });

    // Add keys from overrides
    overrides.forEach(o => keys.add(o.translation_key));

    return Array.from(keys).sort();
  };

  const getCategory = (key: string): string => {
    const override = overrides.find(o => o.translation_key === key);
    if (override) return override.category;
    
    // Auto-detect from key prefix
    const prefix = key.split('.')[0];
    return prefix || 'general';
  };

  const filteredKeys = getAllKeys().filter(key => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      SUPPORTED_LOCALES.some(locale => 
        getDefaultValue(key, locale).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getOverrideValue(key, locale).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = categoryFilter === 'all' || getCategory(key) === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(getAllKeys().map(getCategory))).sort();

  const handleEdit = (key: string) => {
    setEditingKey(key);
    const values: Record<string, string> = {};
    SUPPORTED_LOCALES.forEach(locale => {
      values[locale] = getOverrideValue(key, locale) || getDefaultValue(key, locale);
    });
    setEditValues(values);
  };

  const handleSave = async () => {
    if (!editingKey) return;

    try {
      const category = getCategory(editingKey);
      
      for (const locale of SUPPORTED_LOCALES) {
        const value = editValues[locale];
        if (!value) continue;

        const { error } = await supabase
          .from('translation_overrides')
          .upsert({
            translation_key: editingKey,
            locale,
            value,
            category,
            is_active: true
          }, {
            onConflict: 'translation_key,locale'
          });

        if (error) throw error;
      }

      toast.success('Translation updated successfully');
      setEditingKey(null);
      await reloadTranslations();
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('Failed to save translation');
    }
  };

  const handleReset = async (key: string, locale: string) => {
    try {
      const { error } = await supabase
        .from('translation_overrides')
        .delete()
        .eq('translation_key', key)
        .eq('locale', locale);

      if (error) throw error;
      toast.success('Translation reset to default');
      await reloadTranslations();
    } catch (error) {
      console.error('Error resetting translation:', error);
      toast.error('Failed to reset translation');
    }
  };

  const handleAddNew = async () => {
    if (!newKey.trim()) {
      toast.error('Please enter a translation key');
      return;
    }

    try {
      const values: Record<string, string> = {};
      SUPPORTED_LOCALES.forEach(locale => {
        values[locale] = editValues[locale] || '';
      });

      for (const locale of SUPPORTED_LOCALES) {
        if (!values[locale]) continue;

        const { error } = await supabase
          .from('translation_overrides')
          .insert({
            translation_key: newKey,
            locale,
            value: values[locale],
            category: newCategory,
            is_active: true
          });

        if (error) throw error;
      }

      toast.success('New translation added');
      setNewKey('');
      setEditValues({});
      await reloadTranslations();
    } catch (error) {
      console.error('Error adding translation:', error);
      toast.error('Failed to add translation');
    }
  };

  const handleExport = () => {
    const exportData: Record<string, any> = {};
    
    SUPPORTED_LOCALES.forEach(locale => {
      exportData[locale] = {};
      overrides
        .filter(o => o.locale === locale)
        .forEach(o => {
          const keys = o.translation_key.split('.');
          let current = exportData[locale];
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = o.value;
        });
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${new Date().toISOString()}.json`;
    a.click();
    toast.success('Translations exported');
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading translations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Translation Manager</span>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Translation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Translation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Translation Key</Label>
                    <Input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="e.g., common.new_feature"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., common, profile, chat"
                    />
                  </div>
                  {SUPPORTED_LOCALES.map(locale => (
                    <div key={locale}>
                      <Label>{LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]}</Label>
                      <Input
                        value={editValues[locale] || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [locale]: e.target.value }))}
                        placeholder={`Translation in ${locale}`}
                      />
                    </div>
                  ))}
                  <Button onClick={handleAddNew} className="w-full">
                    Add Translation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Key</TableHead>
                <TableHead>Category</TableHead>
                {SUPPORTED_LOCALES.slice(0, 3).map(locale => (
                  <TableHead key={locale}>{LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]}</TableHead>
                ))}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeys.slice(0, 50).map(key => {
                const hasOverride = SUPPORTED_LOCALES.some(l => getOverrideValue(key, l));
                return (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs">{key}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategory(key)}</Badge>
                    </TableCell>
                    {SUPPORTED_LOCALES.slice(0, 3).map(locale => {
                      const override = getOverrideValue(key, locale);
                      const defaultVal = getDefaultValue(key, locale);
                      return (
                        <TableCell key={locale} className="max-w-[200px] truncate">
                          {override ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              {override}
                            </span>
                          ) : defaultVal ? (
                            <span className="text-muted-foreground">{defaultVal}</span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              Missing
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(key)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit: {key}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {SUPPORTED_LOCALES.map(locale => {
                              const override = getOverrideValue(key, locale);
                              const defaultVal = getDefaultValue(key, locale);
                              return (
                                <div key={locale} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>{LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES]}</Label>
                                    {override && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReset(key, locale)}
                                      >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Reset
                                      </Button>
                                    )}
                                  </div>
                                  {defaultVal && (
                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                      Default: {defaultVal}
                                    </div>
                                  )}
                                  <Textarea
                                    value={editValues[locale] || ''}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, [locale]: e.target.value }))}
                                    placeholder={defaultVal || `Enter translation for ${locale}`}
                                    rows={3}
                                  />
                                </div>
                              );
                            })}
                            <Button onClick={handleSave} className="w-full">
                              Save All Languages
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredKeys.length > 50 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing 50 of {filteredKeys.length} results. Use search to narrow down.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
