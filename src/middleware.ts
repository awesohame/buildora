import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define public routes using createRouteMatcher
const isPublicRoute = createRouteMatcher([
  '/site(.*)', 
  '/api/uploadthing(.*)', 
  '/agency/sign-in(.*)', 
  '/agency/sign-up(.*)'
])

export default clerkMiddleware((auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    auth.protect()
  }

  const url = req.nextUrl
  const searchParams = url.searchParams.toString()
  const pathWithSearchParams = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`

  const hostname = req.headers.get('host')
  const customSubDomain = hostname
    ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)
    .filter(Boolean)[0]

  // Subdomain handling
  if (customSubDomain) {
    return NextResponse.rewrite(
      new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
    )
  }

  // Redirect sign-in/sign-up routes if not already on those routes
  if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
    return NextResponse.redirect(new URL('/agency/sign-in', req.url))
  }

  // Handle root and site routes
  if (
    url.pathname === '/' ||
    (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)
  ) {
    return NextResponse.rewrite(new URL('/site', req.url))
  }

  // Handle agency and subaccount routes
  if (
    url.pathname.startsWith('/agency') ||
    url.pathname.startsWith('/subaccount')
  ) {
    return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url))
  }
})

export const config = {
  matcher: [
    // Matches all routes except files and Next.js internals
    "/((?!.*\\..*|_next).*)", 
    "/", 
    "/(api|trpc)(.*)"
  ],
}