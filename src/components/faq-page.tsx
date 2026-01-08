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
      'We support GAN cubes (12 ui FreePlay, 356i 3, 356i Carry series), MoYu (WeiLong V10 AI with gyro support), QiYi (QY-SC-S confirmed), and GiiKER cubes. GAN and MoYu V10 cubes have gyroscope support for replays. Note: GAN 356i Carry 2 and Carry E do not have gyro hardware. Check our GitHub for the full tested cube list.',
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
      'To connect your smart cube, you need a browser that supports Bluetooth connections. Google Chrome, Microsoft Edge, Brave, and Opera all work great! Unfortunately, Safari and Firefox can\'t connect to smart cubes yet—but don\'t worry, you can still use the manual timer with any browser. If you\'re on an iPhone or iPad, smart cube features aren\'t available yet due to Apple\'s restrictions, but manual timer mode works perfectly.',
  },
  {
    question: 'How do I connect my smart cube?',
    answer:
      'It\'s easy! 1) Click the "Connect Cube" button and choose your cube brand (GAN, MoYu, QiYi, or GiiKER). 2) Wake up your cube by rotating any side. 3) When the Bluetooth popup appears, look for your cube in the list (it might show as your brand name followed by some numbers). 4) Click on your cube and then click "Pair". That\'s it! If the app asks for a MAC address, don\'t worry—there\'s a step-by-step guide right in the popup to help you find it.',
  },
  {
    question: 'Why is my cube not connecting?',
    answer:
      'Here are some quick fixes to try: 1) Make sure your cube is turned on—rotate a side to wake it up. 2) Keep your cube close to your device (within a few feet). 3) Check that Bluetooth is turned on in your device settings. 4) Try using Chrome, Edge, or Brave browser if you\'re not already. 5) Refresh the page and try again. 6) If your cube was connected to another app, close that app first. Still stuck? Join our Discord and we\'ll help you out!',
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
