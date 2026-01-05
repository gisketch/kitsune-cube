import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOConfig {
  title: string
  description: string
  keywords?: string
  canonicalPath?: string
  ogImage?: string
  ogType?: string
}

const PAGE_SEO: Record<string, SEOConfig> = {
  '/': {
    title: 'Kitsune Cube 🦊 - The Gamified Smart Cube Timer',
    description: 'The ultimate smart cube training app. Built by a cuber, for cubers. Connect your smart cube, track solves with CFOP analysis, earn achievements, compete on leaderboards, and watch replays.',
    keywords: 'rubiks cube, smart cube, speedcubing, GAN cube, MoYu cube, QiYi cube, CFOP, cube timer, cube analyzer, speedcube timer, gamified cubing',
  },
  '/app': {
    title: 'Timer - Kitsune Cube',
    description: 'Connect your smart cube and start solving. Real-time move tracking, CFOP analysis, and instant replays. Supports GAN, MoYu, QiYi, and GiiKER cubes.',
    keywords: 'cube timer, smart cube timer, GAN cube timer, MoYu cube timer, speedcubing timer, CFOP timer',
  },
  '/app/account': {
    title: 'My Account - Kitsune Cube',
    description: 'View your solve history, statistics, and personal bests. Track your progress over time with detailed analytics.',
    keywords: 'cube statistics, solve history, personal best, cubing progress, speed cube stats',
  },
  '/app/achievements': {
    title: 'Achievements - Kitsune Cube',
    description: 'Unlock tiered achievements for your cubing milestones. From beginner to legend, earn Bronze, Silver, Gold, Diamond, and Obsidian badges.',
    keywords: 'cube achievements, speedcubing badges, cubing milestones, unlock achievements, gamified cubing',
  },
  '/app/leaderboard': {
    title: 'Leaderboards - Kitsune Cube',
    description: 'Compete with speedcubers worldwide. View global rankings by average time, level, achievements, and single solve records.',
    keywords: 'cube leaderboard, speedcubing ranking, fastest cubers, cube competition, global rankings',
  },
  '/app/simulator': {
    title: 'CFOP Simulator - Kitsune Cube',
    description: 'Analyze any solve without a smart cube. Input scramble and solution to see CFOP phase breakdown and move counts.',
    keywords: 'CFOP analyzer, cube simulator, solve analysis, algorithm analyzer, cubing tools',
  },
  '/app/settings': {
    title: 'Settings - Kitsune Cube',
    description: 'Customize your Kitsune Cube experience. Themes, animation speed, inspection timer, and more.',
    keywords: 'cube timer settings, theme customization, app preferences',
  },
  '/app/faq': {
    title: 'FAQ - Kitsune Cube',
    description: 'Frequently asked questions about Kitsune Cube. Learn about supported cubes, features, connectivity, and more.',
    keywords: 'kitsune cube faq, smart cube help, smart cube setup, troubleshooting, cubing questions',
  },
}

const DEFAULT_SEO: SEOConfig = {
  title: 'Kitsune Cube 🦊 - Gamified Smart Cube Companion',
  description: 'A gamified smart cube companion for speedcubers. Connect your smart cube, track solves, and earn achievements.',
}

function updateMetaTag(property: string, content: string, isProperty = false) {
  const attribute = isProperty ? 'property' : 'name'
  let meta = document.querySelector(`meta[${attribute}="${property}"]`)
  
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, property)
    document.head.appendChild(meta)
  }
  
  meta.setAttribute('content', content)
}

function updateCanonical(path: string) {
  const canonicalUrl = `https://kitsunecube.com${path}`
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  
  link.href = canonicalUrl
}

export function useSEO(customConfig?: Partial<SEOConfig>) {
  const location = useLocation()
  
  useEffect(() => {
    const basePath = location.pathname.startsWith('/app') 
      ? location.pathname.split('/').slice(0, 3).join('/') 
      : '/'
    const pageConfig = PAGE_SEO[basePath] || DEFAULT_SEO
    const config = { ...pageConfig, ...customConfig }
    
    document.title = config.title
    
    updateMetaTag('description', config.description)
    if (config.keywords) {
      updateMetaTag('keywords', config.keywords)
    }
    
    updateMetaTag('og:title', config.title, true)
    updateMetaTag('og:description', config.description, true)
    updateMetaTag('og:url', `https://kitsunecube.com${location.pathname}`, true)
    if (config.ogType) {
      updateMetaTag('og:type', config.ogType, true)
    }
    if (config.ogImage) {
      updateMetaTag('og:image', config.ogImage, true)
      updateMetaTag('twitter:image', config.ogImage, true)
    }
    
    updateMetaTag('twitter:title', config.title, true)
    updateMetaTag('twitter:description', config.description, true)
    
    updateCanonical(config.canonicalPath || location.pathname)
  }, [location.pathname, customConfig])
}

export function SEOHead() {
  useSEO()
  return null
}
