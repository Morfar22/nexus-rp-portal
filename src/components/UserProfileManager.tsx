import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Edit2, Save, X, Upload, Camera, Link, Unlink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DiscordIcon from "@/components/icons/DiscordIcon";

const profileSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
  full_name: z.string().max(100, "Full name must be less than 100 characters").optional(),
});

const UserProfileManager = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      full_name: "",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
          form.reset({
            username: data?.username || "",
            full_name: data?.full_name || "",
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Avatar file size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    setIsUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!userProfile || !user) return;

    try {
      let avatarUrl = userProfile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(updatedProfile);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset({
      username: userProfile?.username || "",
      full_name: userProfile?.full_name || "",
    });
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleConnectDiscord = async () => {
    setIsConnectingDiscord(true);
    try {
      const redirectUri = `${window.location.origin}/profile`;
      
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: {
          action: 'get_auth_url',
          data: { redirectUri }
        }
      });

      if (error) throw error;

      if (data.success) {
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Discord connection error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate Discord connection",
        variant: "destructive",
      });
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: {
          action: 'disconnect',
          data: { userId: user?.id }
        }
      });

      if (error) throw error;

      if (data.success) {
        // Refresh profile data
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile(updatedProfile);
        
        toast({
          title: "Success",
          description: "Discord account disconnected successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Discord disconnection error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Discord account",
        variant: "destructive",
      });
    }
  };

  // Handle Discord OAuth callback
  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && user) {
        try {
          const redirectUri = `${window.location.origin}/profile`;
          
          const { data, error } = await supabase.functions.invoke('discord-oauth', {
            body: {
              action: 'exchange_code',
              data: { code, redirectUri }
            }
          });

          if (error) throw error;

          if (data.success) {
            const discordData = data.data;
            
            // Update profile with Discord info
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                discord_id: discordData.user.id,
                discord_username: discordData.user.username,
                discord_discriminator: discordData.user.discriminator,
                discord_access_token: discordData.accessToken,
                discord_refresh_token: discordData.refreshToken,
                discord_connected_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (updateError) throw updateError;

            // Refresh profile data
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            setUserProfile(updatedProfile);
            
            toast({
              title: "Success",
              description: "Discord account connected successfully",
            });

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Discord callback error:', error);
          toast({
            title: "Error",
            description: "Failed to connect Discord account",
            variant: "destructive",
          });
        }
      }
    };

    handleDiscordCallback();
  }, [user, toast]);

  if (!user) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Please sign in to view your profile.</p>
        </div>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading profile...</p>
        </div>
      </Card>
    );
  }

  const displayAvatar = avatarPreview || userProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = userProfile.username || user.user_metadata?.full_name || user.email;

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-foreground">My Profile</h2>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-neon-purple hover:bg-neon-purple/80 text-white p-2 rounded-full cursor-pointer transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {avatarFile && (
                <p className="text-sm text-muted-foreground">
                  New avatar selected: {avatarFile.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Email</Label>
                <p className="text-sm text-muted-foreground mt-1">{user.email} (read-only)</p>
              </div>
              <div>
                <Label className="text-foreground">Member Since</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                <Save className="h-4 w-4 mr-2" />
                {isUploading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Username</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.username || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-foreground">Full Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{userProfile.full_name || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-foreground">Member Since</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(userProfile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-foreground">Last Updated</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Discord Connection Section */}
          <div className="border-t border-gaming-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DiscordIcon className="h-5 w-5 text-discord-blue" />
                <h3 className="text-lg font-semibold text-foreground">Discord Connection</h3>
              </div>
            </div>
            
            {userProfile.discord_id ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-foreground font-medium">
                      Connected as {userProfile.discord_username}#{userProfile.discord_discriminator}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connected on {new Date(userProfile.discord_connected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectDiscord}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted/10 border border-gaming-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="text-foreground font-medium">Discord Not Connected</p>
                    <p className="text-xs text-muted-foreground">
                      Connect your Discord account for additional features
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleConnectDiscord}
                  disabled={isConnectingDiscord}
                  className="border-discord-blue/20 text-discord-blue hover:bg-discord-blue/10"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {isConnectingDiscord ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserProfileManager;