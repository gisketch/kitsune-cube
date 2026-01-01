import { Mail, MessageCircle, Heart, Github } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
        <FooterLink icon={Mail} label="contact" href="mailto:dev@gisketch.com" />
        <FooterLink icon={MessageCircle} label="discord" href="https://discord.gg/XPQr4wpQVg" />
        <FooterLink icon={Heart} label="support" href="https://ko-fi.com/gisketch" accent />
        <FooterLink icon={Github} label="source" href="https://github.com/gisketch/kitsune-cube" />
      </div>

      <div className="flex items-center gap-1">
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
      </div>
    </footer>
  )
}

function FooterLink({
  icon: Icon,
  label,
  href,
  accent,
}: {
  icon: typeof Mail
  label: string
  href: string
  accent?: boolean
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-1.5 transition-colors hover:opacity-80"
      style={{ color: accent ? 'var(--theme-accent)' : 'var(--theme-sub)' }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  )
}
