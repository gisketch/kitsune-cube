<p align="center">
  <img src="public/favicon.svg" alt="Kitsune Cube Logo" width="80" height="80">
</p>

<h1 align="center">🦊 Kitsune Cube</h1>

<p align="center">
  <strong>A gamified smart cube companion for speedcubers who demand more.</strong>
</p>

<p align="center">
  <a href="https://kitsunecube.com">Website</a> •
  <a href="https://discord.gg/XPQr4wpQVg">Discord</a> •
  <a href="https://ko-fi.com/gisketch">Support</a>
</p>

---

## 🎯 Why Kitsune Cube?

As a software developer and speedcubing enthusiast, I've been inspired by amazing apps like Cubeast, Acubemy, and csTimer. Building on their ideas, I wanted to create something that combines the best of analytics, gamification, and replay features into one seamless experience. **Kitsune Cube** is the result—a feature-rich training platform designed to make every solve count.

**Free to use.** Built by a cuber, for cubers.

---

## ✨ Features

### 🎮 Gamification System
- **XP & Leveling** — Earn experience points for every solve, with faster times giving bonus XP
- **50+ Unique Achievements** — Unlock tiered achievements (Bronze → Silver → Gold → Diamond → Obsidian) across multiple categories:
  - **Grind** — Solve milestones (100, 1K, 10K, 100K solves)
  - **Smart Cube** — TPS records, efficient crosses, smooth F2L flow
  - **CFOP Specific** — OLL/PLL skips, God's Number solves, full-step mastery
  - **Anomaly** — Rare achievements for unusual solve patterns
  - **Streak** — Daily solve streak tracking

### 📊 Advanced Analytics
- **CFOP Phase Breakdown** — Real-time analysis of Cross, F2L (each pair), OLL, and PLL phases
- **Move-by-Move Timing** — See exactly where you're fast and where you can improve
- **TPS (Turns Per Second)** — Track your execution speed
- **Phase Goals** — Set personal targets for each CFOP phase

### 🎬 Full Replay System
- **Live Solve Playback** — Watch any solve with move-by-move animation
- **Gyroscope Recording** — Smart cubes with gyro capture real hand movements
- **Speed Controls** — Adjust playback speed, pause, and step through moves
- **Share Replays** — Share your best solves with a link

### 🏆 Leaderboards
- **Global Rankings** — Compete on average time, level, achievements, and single solve records
- **Public Solve Library** — Browse and replay top solves from the community

### 🔧 Smart Cube Integration
- **Bluetooth Connection** — Connect via Web Bluetooth API
- **Real-time Tracking** — Every move synced instantly
- **Battery Monitoring** — Keep track of your cube's battery level
- **Calibration System** — Easy cube state synchronization

### 🎨 Customization
- **Multiple Themes** — Choose from Kitsune, Dark, Light, Serika, and more
- **Custom Cube Colors** — Match your physical cube's color scheme
- **Adjustable Animation Speed** — Fine-tune the 3D cube visualization
- **Inspection Timer** — WCA-compliant 15-second inspection option

### 📱 Additional Features
- **WCA-Compliant Scrambles** — Powered by cubing.js for official-quality scrambles
- **Cloud Sync** — Create an account or sign in to sync solves across devices
- **Offline Support** — Works without internet, syncs when back online
- **Manual Timer Mode** — Use without a smart cube with keyboard/touch controls
- **Solve History** — Track all your solves with filtering and statistics
- **Simulator Mode** — Input scrambles and solutions to analyze any solve
- **Keyboard Shortcuts** — Full command palette for power users

---

## 🧊 Supported Smart Cubes

### ✅ GAN (Fully Supported)
| Cube | Gyro Support |
|------|--------------|
| GAN 12 UI | ✅ Yes |
| GAN 356i V3 | ✅ Yes |
| GAN 356i Carry | ✅ Yes |
| GAN 356i Play | ✅ Yes |
| All GAN Smart Cubes | ✅ Yes |

### 🧪 MoYu (Experimental)
| Cube | Gyro Support |
|------|--------------|
| WeiLong V10 AI | ❌ No |

### 🧪 QiYi (Experimental)
| Cube | Gyro Support |
|------|--------------|
| AI Smart Cube | ❌ No |

### 🧪 GiiKER (Experimental)
| Cube | Gyro Support |
|------|--------------|
| i3S | ❌ No |
| i2 | ❌ No |

> **Experimental cubes are being actively tested.** If you own a MoYu, QiYi, or GiiKER smart cube, help us improve support by reporting issues on our [Discord](https://discord.gg/XPQr4wpQVg).

---

## 🔧 Supported Solving Methods

| Method | Analysis Support |
|--------|------------------|
| CFOP | ✅ Full phase breakdown |
| Roux | 🔄 Basic tracking |
| ZBLL | 🔄 Basic tracking |
| ZZ | 🔄 Planned |
| Petrus | 🔄 Planned |

---

## 🗺️ Roadmap

- [ ] **More Smart Cubes** — MoYu, QiYi, Giiker support
- [ ] **Smarter Analyzer** — OLL/PLL case recognition and algorithm suggestions
- [ ] **Rotation Detection** — Accurate cube rotation tracking
- [ ] **Slice Move Detection** — M, E, S move recognition
- [ ] **More Methods** — Full Roux, ZZ, and Petrus analysis
- [ ] **csTimer Import** — Sync your existing solve history
- [ ] **Algorithm Trainer** — Practice OLL, PLL, and more
- [ ] **Battle Mode** — Real-time racing against friends
- [ ] **Mobile App** — Native iOS/Android apps

---

## 🛠️ Tech Stack

- **Frontend** — React 19, TypeScript, Vite
- **3D Graphics** — Three.js, React Three Fiber
- **Styling** — Tailwind CSS, Framer Motion
- **Cube Logic** — cubing.js (scrambles), gan-web-bluetooth
- **Backend** — Firebase (Auth, Firestore)
- **Charts** — Recharts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Chromium-based browser (Chrome, Edge, Brave) for Web Bluetooth support
- A GAN smart cube (optional, manual timer available)

### Installation

```bash
# Clone the repository
git clone https://github.com/gisketch/kitsune-cube.git
cd kitsune-cube

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute
1. **Report Bugs** — Open an issue with detailed reproduction steps
2. **Suggest Features** — Share ideas in Discord or GitHub Issues
3. **Submit PRs** — Bug fixes, features, or documentation improvements
4. **Test Smart Cubes** — Help verify compatibility with non-GAN cubes
5. **Translations** — Help localize the app

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write clean, self-documenting code (minimal comments)
4. Test your changes thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- Follow existing patterns in the codebase
- Use TypeScript strictly
- Prefer functional components with hooks
- Use Tailwind for styling

---

## 💬 Community

- **Discord** — [Join our server](https://discord.gg/XPQr4wpQVg) for support, suggestions, and community
- **GitHub Issues** — Report bugs or request features
- **Ko-fi** — [Support development](https://ko-fi.com/gisketch)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [cubing.js](https://github.com/cubing/cubing.js) — WCA-compliant scramble generation
- [gan-web-bluetooth](https://github.com/nicola-lissandrini/gan-web-bluetooth) — GAN cube connectivity
- [MonkeyType](https://monkeytype.com) — UI/UX inspiration
- The speedcubing community for endless motivation

---

<p align="center">
  Made with 🧡 by <a href="https://gisketch.com">@gisketch</a>
</p>
