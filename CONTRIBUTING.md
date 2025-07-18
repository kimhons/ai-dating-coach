# Contributing to AI Dating Coach

Thank you for your interest in contributing to AI Dating Coach! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- iOS Simulator / Android Emulator
- Git
- GitHub account

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/ai-dating-coach.git
   cd ai-dating-coach
   ```

2. **Install Dependencies**
   ```bash
   # Mobile app
   cd mobile && npm install
   
   # Web app
   cd ../web && npm install
   
   # Return to root
   cd ..
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your API keys and configuration
   ```

4. **Start Development Servers**
   ```bash
   # Mobile (iOS)
   cd mobile && npx react-native run-ios
   
   # Mobile (Android)
   npx react-native run-android
   
   # Web
   cd web && npm run dev
   ```

## 📋 Development Guidelines

### Code Style

#### TypeScript
- Use TypeScript for all new code
- Strict type checking enabled
- No `any` types without justification
- Prefer interfaces over types for object definitions

#### React/React Native
- Functional components with hooks
- Custom hooks for shared logic
- PropTypes or TypeScript interfaces for props
- Meaningful component and variable names

#### File Organization
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (mobile)
├── pages/          # Page components (web)
├── hooks/          # Custom React hooks
├── contexts/       # React contexts
├── services/       # API and external services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── constants/      # App constants
```

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(mobile): add voice analysis feature
fix(web): resolve login redirect issue
docs(readme): update installation instructions
```

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `docs/documentation-update` - Documentation updates

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Device/browser
   - App version
   - React Native version (for mobile issues)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs. actual behavior
   - Screenshots/recordings if applicable

3. **Additional Context**
   - Error messages
   - Console logs
   - Related issues

## ✨ Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Provide detailed description** of the feature
3. **Explain the use case** and user benefit
4. **Consider implementation complexity**
5. **Suggest UI/UX if applicable**

## 🧪 Testing

### Mobile Testing
```bash
cd mobile
npm test
npm run test:e2e
```

### Web Testing
```bash
cd web
npm test
npm run test:coverage
```

### Manual Testing Checklist
- [ ] App builds successfully
- [ ] Authentication flow works
- [ ] Core features functional
- [ ] No console errors
- [ ] Responsive design (web)
- [ ] Cross-platform compatibility (mobile)

## 📱 Platform-Specific Guidelines

### Mobile Development

#### iOS
- Test on multiple iOS versions (14+)
- Follow Human Interface Guidelines
- Handle permission requests gracefully
- Test on different screen sizes

#### Android
- Test on multiple Android versions (API 21+)
- Follow Material Design principles
- Handle back button correctly
- Test on different screen densities

### Web Development
- Responsive design (mobile-first)
- Cross-browser compatibility
- Accessibility (WCAG 2.1)
- Performance optimization

## 🔒 Security Guidelines

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables
- Follow OWASP security practices
- Encrypt sensitive user data

### Authentication
- Implement proper session management
- Use secure password policies
- Handle token expiration gracefully
- Implement rate limiting

## 📊 Performance Guidelines

### Mobile
- Optimize image sizes
- Minimize bundle size
- Use lazy loading
- Profile memory usage
- Test on lower-end devices

### Web
- Optimize asset loading
- Use code splitting
- Implement caching strategies
- Monitor Core Web Vitals

## 🎨 Design Guidelines

### UI/UX Principles
- Consistency across platforms
- Accessibility first
- User-centered design
- Progressive disclosure
- Feedback for user actions

### Color Scheme
- Primary: AI-themed blues and purples
- Secondary: Dating-themed pinks and reds
- Neutral: Modern grays
- Success/Error: Standard green/red

## 📚 Documentation

### Code Documentation
- JSDoc for complex functions
- README files for modules
- Inline comments for complex logic
- API documentation for endpoints

### User Documentation
- Feature guides
- Troubleshooting
- API reference
- Deployment guides

## 🚢 Release Process

### Version Numbering
Follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tagged release
- [ ] App store builds created

## 👥 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers
- Focus on the project goals

### Communication
- Use GitHub issues for bug reports
- Use GitHub discussions for questions
- Be clear and concise
- Provide context and examples

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- App credits (for significant contributions)

## 📞 Getting Help

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For questions
- **Email**: [dev@aidatingcoach.com](mailto:dev@aidatingcoach.com)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to AI Dating Coach! 🚀💘