import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is Kitsune Cube?',
    answer:
      'Kitsune Cube is a gamified smart cube companion app for speedcubers. It connects to your smart cube via Bluetooth and provides real-time solve tracking, CFOP analysis, achievements, leaderboards, and a full replay system with gyroscope support.',
  },
  {
    question: 'Which smart cubes are supported?',
    answer:
      'Currently, all GAN smart cubes are fully supported (GAN 12 UI, GAN 356i V3, GAN 356i Carry, GAN 356i Play, etc.). Support for MoYu, QiYi, and Giiker cubes is in development. You can also use the app without a smart cube using the manual timer mode.',
  },
  {
    question: 'Do I need a smart cube to use Kitsune Cube?',
    answer:
      'No! While smart cubes unlock advanced features like move tracking, CFOP analysis, and gyro replays, you can use the manual timer mode with any regular Rubik\'s cube. Just press Space or tap to start/stop the timer.',
  },
  {
    question: 'Is Kitsune Cube free?',
    answer:
      'Yes, Kitsune Cube is currently free with all features included. In the future, there may be a Pro version to help cover database and hosting costs, but core features will always remain free. I want to keep it fair for everyone. You can also support development on Ko-fi.',
  },
  {
    question: 'Which browsers are supported?',
    answer:
      'Smart cube connectivity requires the Web Bluetooth API, which is only available in Chromium-based browsers (Google Chrome, Microsoft Edge, Brave, Opera). Safari and Firefox are not currently supported for smart cube features, but manual timer mode works in all browsers.',
  },
  {
    question: 'How do I connect my GAN smart cube?',
    answer:
      'Click the "Connect Cube" button in the app, then put your cube into pairing mode (usually by shaking it or holding the power button). Select your cube from the Bluetooth device list. Some cubes may require entering a MAC address—check your cube\'s documentation.',
  },
  {
    question: 'Why is my cube not connecting?',
    answer:
      'Make sure Bluetooth is enabled on your device and you\'re using a supported browser (Chrome, Edge, Brave). Ensure your cube is charged and in pairing mode. Try refreshing the page or restarting your browser. If problems persist, join our Discord for support.',
  },
  {
    question: 'How does the CFOP analysis work?',
    answer:
      'The analyzer detects the cross color and tracks each phase of your solve: Cross, F2L (all 4 pairs), OLL, and PLL. It shows move counts and timing for each phase, helping you identify where you can improve. The analysis requires a smart cube for accurate tracking.',
  },
  {
    question: 'Are the scrambles WCA-compliant?',
    answer:
      'Yes! Scrambles are generated using cubing.js, the same library used by official WCA scramble generators. They\'re random-state scrambles that meet competition standards.',
  },
  {
    question: 'How do I earn achievements?',
    answer:
      'Achievements are earned automatically as you solve. Some track milestones (number of solves, moves), others require specific feats (sub-X times, OLL/PLL skips, TPS records). Most achievements have multiple tiers: Bronze, Silver, Gold, Diamond, and Obsidian.',
  },
  {
    question: 'What is the XP system?',
    answer:
      'Every solve earns XP based on your time—faster solves give bonus XP. Smart cube solves earn full XP, while manual timer solves earn half. XP accumulates to increase your level, which is displayed on leaderboards and your profile.',
  },
  {
    question: 'Can I share my solves?',
    answer:
      'Yes! Each solve has a share button that copies a link. Anyone with the link can view your solve details, including the scramble, solution, CFOP breakdown, and watch the full replay with gyroscope movement if available.',
  },
  {
    question: 'How does the replay system work?',
    answer:
      'Smart cubes record every move and timestamp during a solve. Cubes with gyroscopes also record hand orientation. The replay system animates your solve move-by-move with adjustable speed. You can pause, step through moves, and see exact timing.',
  },
  {
    question: 'Will my data sync across devices?',
    answer:
      'Yes, if you create an account or sign in. Your solves, achievements, and settings sync to the cloud and are available on any device. You can sign in with Google or create an account with email. Without signing in, data is stored locally in your browser.',
  },
  {
    question: 'Does the app work offline?',
    answer:
      'Yes! Core features work offline. Your solves are saved locally and will sync to the cloud when you reconnect. Leaderboards and other users\' solves require an internet connection.',
  },
  {
    question: 'What solving methods are supported?',
    answer:
      'The analyzer currently provides full CFOP breakdown with phase detection. Roux and ZBLL have basic tracking. Full support for ZZ, Petrus, and other methods is planned for future updates.',
  },
  {
    question: 'How do I calibrate my cube?',
    answer:
      'If your virtual cube gets out of sync with your physical cube, use the calibration feature. Set your physical cube to the solved state and click "Calibrate" to reset the virtual representation.',
  },
  {
    question: 'Can I import my csTimer history?',
    answer:
      'Not yet, but csTimer import is on the roadmap. Join the Discord to stay updated on this feature.',
  },
  {
    question: 'How do I report bugs or suggest features?',
    answer:
      'Join our Discord server (link in footer) to report bugs, suggest features, or chat with other users. You can also open issues on GitHub.',
  },
  {
    question: 'Is the app open source?',
    answer:
      'Yes! Kitsune Cube is open source under the MIT License. Check out the GitHub repository to view the code, contribute, or fork for your own projects.',
  },
]

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="w-full overflow-hidden rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:opacity-90"
      >
        <span className="pr-4 font-medium" style={{ color: 'var(--theme-text)' }}>
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: 'var(--theme-accent)' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="border-t px-5 pb-4 pt-3"
              style={{
                borderColor: 'var(--theme-sub-alt)',
                color: 'var(--theme-sub)',
              }}
            >
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1
          className="mb-2 text-3xl font-bold"
          style={{ color: 'var(--theme-text)' }}
        >
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--theme-sub)' }}>
          Everything you need to know about Kitsune Cube
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {FAQ_ITEMS.map((item, index) => (
          <FAQAccordionItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

      <div
        className="mt-10 rounded-lg p-6 text-center"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
      >
        <p className="mb-3 text-lg font-medium" style={{ color: 'var(--theme-text)' }}>
          Still have questions?
        </p>
        <p style={{ color: 'var(--theme-sub)' }}>
          Join our{' '}
          <a
            href="https://discord.gg/XPQr4wpQVg"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-80"
            style={{ color: 'var(--theme-accent)' }}
          >
            Discord community
          </a>{' '}
          for support and discussion.
        </p>
      </div>
    </div>
  )
}
