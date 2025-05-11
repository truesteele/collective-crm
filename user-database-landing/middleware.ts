import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Array of paths that don't require authentication
const publicPaths = [
  '/login',
  '/reset-password',
  '/update-password',
  '/landing'
]

export async function middleware(req: NextRequest) {
  console.log(`[Middleware] Processing path: ${req.nextUrl.pathname}`)
  
  const res = NextResponse.next()
  
  // Check if the request is for a public path
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isStaticAsset = req.nextUrl.pathname.startsWith('/_next') || 
                         req.nextUrl.pathname.startsWith('/images') || 
                         req.nextUrl.pathname.includes('.')
  
  // If it's a static asset, let it through
  if (isStaticAsset) {
    return res
  }
  
  console.log(`[Middleware] Path info: isPublicPath=${isPublicPath}, isStaticAsset=${isStaticAsset}`)
  
  try {
    // Create Supabase client specific to this middleware request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = req.cookies.get(name)?.value
            console.log(`[Middleware] Getting cookie ${name}: ${cookie ? 'exists' : 'missing (or value is undefined/empty)'}`)
            return cookie
          },
          set: (name, value, options) => {
            console.log(`[Middleware] Setting cookie ${name}`)
            res.cookies.set({ name, value, ...options })
          },
          remove: (name, options) => {
            console.log(`[Middleware] Removing cookie ${name}`)
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    console.log(`[Middleware] Session exists: ${!!session}`)
    
    // If authenticated and on the landing page, redirect to dashboard
    if (session && (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/landing')) {
      console.log('[Middleware] Authenticated user on landing/root, redirecting to dashboard')
      const dashboardUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(dashboardUrl)
    }
    
    // If authenticated and trying to access login or other public pages, redirect to dashboard
    if (session && isPublicPath) {
      console.log('[Middleware] Authenticated user trying to access public path, redirecting to dashboard')
      const dashboardUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(dashboardUrl)
    }
    
    // If not authenticated and trying to access protected routes, redirect to login
    if (!session && !isPublicPath && req.nextUrl.pathname !== '/landing') {
      console.log('[Middleware] Unauthenticated user trying to access protected path, redirecting to login')
      // Store the original URL as return path
      const returnPath = encodeURIComponent(req.nextUrl.pathname)
      const loginUrl = new URL(`/login?returnPath=${returnPath}`, req.url)
      return NextResponse.redirect(loginUrl)
    }
    
    console.log('[Middleware] Proceeding with request')
    return res
  } catch (error) {
    console.error('[Middleware] Error:', error)
    
    // If there's an error, allow public paths but redirect others to login
    if (!isPublicPath && req.nextUrl.pathname !== '/landing') {
      console.log('[Middleware] Error encountered, redirecting to login')
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    
    return res
  }
}

// Configure matcher for routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/* (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
} 