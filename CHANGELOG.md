# Changelog

All notable changes to Kitsune Cube will be documented in this file.

## [0.1.0] - 2026-01-03

### Added

- **Multi-Brand Smart Cube Support** 🎉
  - MoYu WeiLong V10 AI (Experimental)
  - QiYi AI Smart Cube (Experimental)
  - GiiKER i3S and i2 (Experimental)
  - Mock cube for development testing (dev-only)

- **Brand Picker Modal**
  - New connection flow with brand selection
  - Visual cards showing supported models per brand
  - Hover tooltip showing all supported models for each brand
  - Beta badges for experimental brands
  - Discord link for reporting issues

- **Adapter Architecture**
  - Unified adapter pattern for all smart cube protocols
  - Consistent event stream (moves, gyroscope, battery, facelets)
  - Easy to add new cube brands in the future

### Changed

- Replaced `useGanCube` hook with unified `useSmartCube` hook
- Updated landing page "Supported Cubes" section to show all brands
- Updated roadmap to reflect multi-brand support completion
- Cube info modal now shows brand name and gyroscope availability

### Technical

- Added `gan-web-bluetooth` (chribot fork) for GAN + MoYu support
- Added `btcube-web` for QiYi support
- Added `cubing` library for GiiKER support
- Added comprehensive adapter test suite (19 tests)

---

## [0.0.43] - Previous

- Initial GAN-only smart cube support
- CFOP phase analysis
- Gamification system with XP and levels
- 50+ tiered achievements
- Full solve replays with gyroscope
- 10+ themes
