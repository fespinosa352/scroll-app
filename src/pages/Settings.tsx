import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, User, Mail, Camera, Save, Trash2, AlertTriangle, Download, Upload, Shield } from "lucide-react";
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useDatabaseReset } from '@/hooks/useDatabaseReset';
import { useDataBackup } from '@/hooks/useDataBackup';
import { useNavigate } from 'react-router-dom';
import chameleonLogo from "@/assets/chameleon-logo.png";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updating, updateProfile, createProfile } = useProfile();
  const { resetDatabase, isResetting } = useDatabaseReset();
  const { exportUserData, importUserData, isExporting, isImporting } = useDataBackup();
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile) {
      await updateProfile(formData);
    } else {
      await createProfile(formData);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importUserData(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center p-1">
                <img src={chameleonLogo} alt="Chameleon" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-600">Manage your profile and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.avatar_url} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-lg">
                  {formData.display_name ? getInitials(formData.display_name) : (
                    user?.email ? getInitials(user.email) : 'U'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    placeholder="https://example.com/your-photo.jpg"
                    value={formData.avatar_url}
                    onChange={handleInputChange}
                  />
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enter a URL to your profile picture
                </p>
              </div>
            </div>

            <Separator />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Your email address cannot be changed here
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Full Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-slate-500">
                  This will be used in your welcome message and profile
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                />
                <p className="text-xs text-slate-500">
                  A brief description about yourself (optional)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{updating ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card className="mt-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Shield className="w-5 h-5" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>
              Backup and restore your professional data to prevent accidental loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Data Protection:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Export all your data as a backup file</li>
                <li>• Restore data from a previous backup</li>
                <li>• Keep your data safe during updates</li>
                <li>• Transfer data between accounts if needed</li>
              </ul>
              <p className="text-sm text-blue-600 mt-3 font-medium">
                💡 Tip: Export your data before using the reset function below
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={exportUserData}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button 
                  variant="outline"
                  disabled={isImporting}
                  className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Reset Section */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription>
              Permanently delete all your professional data. This action cannot be undone.
              <strong className="text-red-600"> Export your data first!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• All work experience records</li>
                <li>• All education records</li>
                <li>• All certifications</li>
                <li>• All saved resumes</li>
                <li>• All job analyses</li>
                <li>• All achievements and projects</li>
                <li>• All skills data</li>
              </ul>
              <p className="text-sm text-red-600 mt-3 font-medium">
                Your account and profile information will remain intact.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={isResetting}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isResetting ? 'Resetting...' : 'Reset All Data'}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Are you absolutely sure?</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This action will permanently delete all your professional data including:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1 pl-4">
                      <li>• Work experience records</li>
                      <li>• Education records</li>
                      <li>• Certifications</li>
                      <li>• Saved resumes</li>
                      <li>• Job analyses</li>
                      <li>• Projects and achievements</li>
                      <li>• Skills data</li>
                    </ul>
                    <p className="text-red-600 font-medium">
                      This action cannot be undone. You'll need to re-enter all your information.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetDatabase}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, delete all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;