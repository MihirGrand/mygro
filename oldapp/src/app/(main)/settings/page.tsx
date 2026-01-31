'use client';

import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  User,
  Bell,
  Shield,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Key,
  Mail,
  Save,
  Trash2,
  LogOut,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    geofenceAlerts: true,
    batteryAlerts: true,
    screenTimeAlerts: true,
    weeklyReports: true,
  });

  const [privacy, setPrivacy] = useState({
    locationHistoryDays: '30',
    autoDeleteData: true,
    shareAnalytics: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}>
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* main settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* profile section */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Profile</h2>
                <p className="text-muted-foreground text-sm">Your account information</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                    <SelectTrigger>
                      <Globe className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* notifications section */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-2">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-semibold">Notifications</h2>
                <p className="text-muted-foreground text-sm">Configure alert preferences</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-muted-foreground text-sm">Receive alerts via email</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={notifications.emailAlerts}
                  onChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-muted-foreground text-sm">Receive push notifications on your device</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={notifications.pushNotifications}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, pushNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Geofence Alerts</p>
                  <p className="text-muted-foreground text-sm">Notify when children enter/exit zones</p>
                </div>
                <ToggleSwitch
                  checked={notifications.geofenceAlerts}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, geofenceAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Battery Alerts</p>
                  <p className="text-muted-foreground text-sm">Notify on low battery warnings</p>
                </div>
                <ToggleSwitch
                  checked={notifications.batteryAlerts}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, batteryAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Screen Time Alerts</p>
                  <p className="text-muted-foreground text-sm">Notify when limits are reached</p>
                </div>
                <ToggleSwitch
                  checked={notifications.screenTimeAlerts}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, screenTimeAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-muted-foreground text-sm">Receive weekly activity summaries</p>
                </div>
                <ToggleSwitch
                  checked={notifications.weeklyReports}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, weeklyReports: checked })
                  }
                />
              </div>
            </div>
          </Card>

          {/* privacy section */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold">Privacy & Data</h2>
                <p className="text-muted-foreground text-sm">Manage your data and privacy settings</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Location History Retention</p>
                  <p className="text-muted-foreground text-sm">How long to keep location data</p>
                </div>
                <Select
                  value={privacy.locationHistoryDays}
                  onValueChange={(value) =>
                    setPrivacy({ ...privacy, locationHistoryDays: value })
                  }>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-delete Old Data</p>
                  <p className="text-muted-foreground text-sm">
                    Automatically remove data older than retention period
                  </p>
                </div>
                <ToggleSwitch
                  checked={privacy.autoDeleteData}
                  onChange={(checked) => setPrivacy({ ...privacy, autoDeleteData: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Analytics</p>
                  <p className="text-muted-foreground text-sm">Help improve the app with anonymous data</p>
                </div>
                <ToggleSwitch
                  checked={privacy.shareAnalytics}
                  onChange={(checked) => setPrivacy({ ...privacy, shareAnalytics: checked })}
                />
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-red-500 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                  Delete All Data
                </Button>
              </div>
            </div>
          </Card>

          {/* save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* account status */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Plan</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Premium
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Children</span>
                <span className="font-medium">3 / 5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Member since</span>
                <span className="font-medium">Jan 2024</span>
              </div>
            </div>
          </Card>

          {/* appearance */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Appearance</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2">
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button variant="default" className="gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </Card>

          {/* security */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Security</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Auth
              </Button>
            </div>
          </Card>

          {/* api settings */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">API Configuration</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apiUrl" className="text-sm">
                  Backend URL
                </Label>
                <Input
                  id="apiUrl"
                  placeholder="https://api.example.com"
                  defaultValue="http://localhost:5000"
                  className="text-sm"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Update this to your ngrok URL during development
              </p>
            </div>
          </Card>

          {/* danger zone */}
          <Card className="border-red-500/30 p-4">
            <h3 className="mb-3 font-semibold text-red-500">Danger Zone</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                <LogOut className="h-4 w-4" />
                Sign Out All Devices
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
