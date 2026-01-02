import { Link } from 'react-router-dom'
import { Mail, MessageCircle, Heart, Github, HelpCircle, GitBranch } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { VERSION, getVersionString } from '@/lib/version'

export function Footer() {
  return (
    <footer
      className="flex items-center justify-between px-6 py-3 text-sm"
      style={{
        color: 'var(--theme-sub)',
        borderTop: '1px solid var(--theme-sub-alt)',
      }}
    >
      <div className="flex items-center gap-6">
        <FooterLink icon={HelpCircle} label="faq" href="/faq" internal />
        <FooterLink icon={Mail} label="contact" href="mailto:dev@gisketch.com" />
        <FooterLink icon={MessageCircle} label="discord" href="https://discord.gg/XPQr4wpQVg" />
        <FooterLink icon={Heart} label="support" href="https://ko-fi.com/gisketch" accent />
        <FooterLink icon={Github} label="source" href="https://github.com/gisketch/kitsune-cube" />
      </div>

      <div className="flex items-center gap-2">
        <span>© 2026 - made by</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://gisketch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-80"
                style={{ color: 'var(--theme-accent)' }}
              >
                @gisketch
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>gisketch.com</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span>•</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex cursor-default items-center gap-1"
                style={{ color: 'var(--theme-sub)' }}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>{getVersionString()}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Build {VERSION.commitHash} • {VERSION.commitDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  )
}

export function MobileFooter() {
  return (
    <footer
      className="flex items-center justify-center px-4 py-2 text-xs"
      style={{
        color: 'var(--theme-sub)',
        borderTop: '1px solid var(--theme-sub-alt)',
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="flex cursor-default items-center gap-1"
              style={{ color: 'var(--theme-sub)' }}
            >
              <GitBranch className="h-3 w-3" />
              <span>{getVersionString()}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Build {VERSION.commitHash} • {VERSION.commitDate}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </footer>
  )
}

function FooterLink({
  icon: Icon,
  label,
  href,
  accent,
  internal,
}: {
  icon: typeof Mail
  label: string
  href: string
  accent?: boolean
  internal?: boolean
}) {
  const className = "flex items-center gap-1.5 transition-colors hover:opacity-80"
  const style = { color: accent ? 'var(--theme-accent)' : 'var(--theme-sub)' }

  if (internal) {
    return (
      <Link to={href} className={className} style={style}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={className}
      style={style}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  )
}
