"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnPath = searchParams.get('returnPath') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginAttempts(prev => prev + 1)
    setDebugInfo(null)

    try {
      console.log("Attempting login with:", { email, returnPath })

      // Check if Supabase is initialized
      if (!supabase) {
        console.error("Supabase client is not initialized")
        throw new Error("Authentication service unavailable")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log("Login response:", { data, error })

      if (error) {
        throw error
      }

      if (data.user) {
        // Check what's in the session
        const sessionCheck = await supabase.auth.getSession()
        console.log("Session check:", sessionCheck)
        
        setDebugInfo({
          user: data.user,
          session: data.session,
          sessionCheck
        })

        toast({
          title: "Login successful",
          description: "Welcome back to Outdoorithm Collective CRM!"
        })

        // Force reload the page to apply session cookie changes
        setTimeout(() => {
        window.location.href = returnPath
        }, 1000)
      } else {
        setDebugInfo({ data, message: "No user returned but no error" })
        throw new Error("Login succeeded but no user was returned")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setDebugInfo({ error })
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-brand-50 p-4">
      <Card className="w-full max-w-md border-brand-100">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/OC_Logo_Blue.png"
              alt="Outdoorithm Collective Logo"
              width={60}
              height={60}
              className="rounded-md"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-700">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your CRM dashboard</CardDescription>
          {returnPath !== '/dashboard' && (
            <p className="text-xs text-muted-foreground mt-2">
              You'll be redirected to: {returnPath}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-brand-500"
                  type="button"
                  onClick={() => router.push("/reset-password")}
                >
                  Forgot password?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="Your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-brand-500 hover:bg-brand-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {loginAttempts > 0 && debugInfo && (
            <Alert className="mt-4 bg-gray-50 border-gray-200">
              <AlertDescription className="text-xs font-mono">
                <details>
                  <summary className="cursor-pointer">Debug Info (Attempt #{loginAttempts})</summary>
                  <pre className="mt-2 overflow-auto max-h-32 p-1 bg-gray-100 rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Protected by Supabase Auth</p>
        </CardFooter>
      </Card>
    </div>
  )
} 