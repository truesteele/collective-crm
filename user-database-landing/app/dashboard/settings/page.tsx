import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive email notifications when changes are made to the database
              </span>
            </Label>
            <Switch id="email-notifications" />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="browser-notifications" className="flex flex-col space-y-1">
              <span>Browser Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive browser notifications when changes are made to the database
              </span>
            </Label>
            <Switch id="browser-notifications" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Customize your display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal text-sm text-muted-foreground">Enable dark mode for the application</span>
            </Label>
            <Switch id="dark-mode" />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="compact-view" className="flex flex-col space-y-1">
              <span>Compact View</span>
              <span className="font-normal text-sm text-muted-foreground">Show more data in less space</span>
            </Label>
            <Switch id="compact-view" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Export your data for backup or analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Export Format</Label>
            <div className="flex space-x-2">
              <Button variant="outline">CSV</Button>
              <Button variant="outline">JSON</Button>
              <Button variant="outline">Excel</Button>
            </div>
          </div>

          <div className="pt-4">
            <Button>Export All Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
