import { Context } from 'https://edge.netlify.com'

const FIREBASE_API_KEY = Deno.env.get('FIREBASE_API_KEY') || ''

function formatTime(ms: number): string {
  const sec = ms / 1000
  const min = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(2)
  return min > 0 ? `${min}:${s.padStart(5, '0')}` : `${s}s`
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url)
  console.log('[solve-meta] Processing:', url.pathname)
  console.log('[solve-meta] API Key present:', !!FIREBASE_API_KEY)
  
  const patterns = [
    /^\/s\/([a-zA-Z0-9]{8})$/,           // /s/:shortId (8 char short URL)
    /^\/solve\/([^/]+)\/([^/]+)$/,       // /solve/:userId/:solveId
    /^\/solve\/([^/]+)$/,                // /solve/:solveId
    /^\/app\/solve\/([^/]+)\/([^/]+)$/,  // /app/solve/:userId/:solveId  
    /^\/app\/solve\/([^/]+)$/,           // /app/solve/:solveId
  ]
  
  let userId: string | null = null
  let solveId: string | null = null
  let shortId: string | null = null
  
  for (const pattern of patterns) {
    const match = url.pathname.match(pattern)
    if (match) {
      if (pattern.source.includes('/s/')) {
        shortId = match[1]
      } else if (match.length === 3) {
        userId = match[1]
        solveId = match[2]
      } else {
        solveId = match[1]
      }
      break
    }
  }
  
  console.log('[solve-meta] Parsed userId:', userId, 'solveId:', solveId, 'shortId:', shortId)
  
  if (!solveId && !shortId) {
    console.log('[solve-meta] No solveId or shortId, passing through')
    return context.next()
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  
  if (!contentType.includes('text/html')) {
    return response
  }
  
  const html = await response.text()
  
  try {
    const projectId = 'cube-app-92324'
    let solveData: any = null
    let userName = 'Speedcuber'
    let foundUserId: string | null = userId
    
    if (userId) {
      const solveUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/solves/${solveId}?key=${FIREBASE_API_KEY}`
      console.log('[solve-meta] Fetching solve from:', solveUrl.replace(FIREBASE_API_KEY, 'API_KEY'))
      const solveRes = await fetch(solveUrl)
      console.log('[solve-meta] Solve response status:', solveRes.status)
      if (solveRes.ok) {
        const doc = await solveRes.json()
        console.log('[solve-meta] Solve doc has fields:', !!doc.fields)
        if (doc.fields) {
          solveData = parseFirestoreDoc(doc.fields)
        }
      } else {
        const errorText = await solveRes.text()
        console.log('[solve-meta] Solve fetch error:', errorText.substring(0, 200))
      }
      
      if (solveData) {
        const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?key=${FIREBASE_API_KEY}`
        const userRes = await fetch(userUrl)
        if (userRes.ok) {
          const userDoc = await userRes.json()
          if (userDoc.fields) {
            const userData = parseFirestoreDoc(userDoc.fields)
            userName = userData?.displayName || 'Speedcuber'
          }
        }
      }
    }
    
    if (!solveData) {
      const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`
      
      const fieldPath = shortId ? 'shortId' : 'solveId'
      const fieldValue = shortId || solveId
      
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: 'solves', allDescendants: true }],
          where: {
            fieldFilter: {
              field: { fieldPath },
              op: 'EQUAL',
              value: { stringValue: fieldValue }
            }
          },
          limit: 1
        }
      }
      
      console.log('[solve-meta] Querying by', fieldPath, '=', fieldValue)
      
      const queryRes = await fetch(runQueryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      })
      
      if (queryRes.ok) {
        const results = await queryRes.json()
        if (results && results.length > 0 && results[0].document) {
          const doc = results[0].document
          solveData = parseFirestoreDoc(doc.fields)
          
          const pathParts = doc.name.split('/')
          const usersIndex = pathParts.indexOf('users')
          if (usersIndex !== -1 && pathParts[usersIndex + 1]) {
            foundUserId = pathParts[usersIndex + 1]
            
            const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${foundUserId}?key=${FIREBASE_API_KEY}`
            const userRes = await fetch(userUrl)
            if (userRes.ok) {
              const userDoc = await userRes.json()
              if (userDoc.fields) {
                const userData = parseFirestoreDoc(userDoc.fields)
                userName = userData?.displayName || 'Speedcuber'
              }
            }
          }
        }
      }
    }
    
    if (!solveData) {
      console.log('[solve-meta] No solve data found, returning original HTML')
      return new Response(html, { headers: response.headers })
    }
    
    console.log('[solve-meta] Found solve data, time:', solveData.time)
    const time = solveData.time || 0
    const scramble = solveData.scramble || ''
    const formattedTime = formatTime(time)
    
    const title = `${formattedTime} Solve by ${userName} - Kitsune Cube`
    const description = `Check out this ${formattedTime} cube solve on Kitsune Cube! 🦊`
    
    const ogImageParams = new URLSearchParams()
    ogImageParams.set('time', time.toString())
    ogImageParams.set('scramble', scramble)
    ogImageParams.set('name', userName)
    const ogImageUrl = `https://kitsunecube.com/api/og-image?${ogImageParams.toString()}`
    
    const metaTags = `
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url.href}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <title>${escapeHtml(title)}</title>`
    
    const modifiedHtml = html
      .replace(/<title>[^<]*<\/title>/, '')
      .replace(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi, '')
      .replace(/<meta[^>]*(property|name)=["']twitter:[^"']*["'][^>]*>/gi, '')
      .replace(/<head>/i, `<head>${metaTags}`)
    
    return new Response(modifiedHtml, {
      headers: response.headers,
    })
  } catch (e) {
    console.error('solve-meta error:', e)
    return new Response(html, { headers: response.headers })
  }
}

function parseFirestoreDoc(fields: any): any {
  if (!fields) return null
  const result: any = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value as any)
  }
  return result
}

function parseFirestoreValue(value: any): any {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return parseInt(value.integerValue)
  if (value.doubleValue !== undefined) return value.doubleValue
  if (value.booleanValue !== undefined) return value.booleanValue
  if (value.nullValue !== undefined) return null
  if (value.arrayValue) return (value.arrayValue.values || []).map(parseFirestoreValue)
  if (value.mapValue) return parseFirestoreDoc(value.mapValue.fields)
  return null
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const config = {
  path: ['/solve/*', '/app/solve/*'],
}
