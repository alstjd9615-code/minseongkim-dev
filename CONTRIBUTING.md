# Contributing to AI Portfolio Builder

Thank you for your interest in contributing to AI Portfolio Builder! 🎉

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/minseongkim-dev.git
   cd minseongkim-dev
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 💻 Development Workflow

### Frontend Development

```bash
# Start dev server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
# Navigate to infrastructure
cd infrastructure

# Build Lambda functions
sam build

# Test locally
sam local invoke FunctionName --event events/test-event.json
```

## 📝 Code Style

### TypeScript/React

- Use functional components with hooks
- Follow existing naming conventions
- Add TypeScript types for all props and state
- Use `const` for constants, `let` for variables (avoid `var`)
- Prefer `async/await` over `.then()` chains

### Python

- Follow PEP 8 style guide
- Use type hints where applicable
- Add docstrings to functions
- Handle exceptions properly

### Example

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

## 🧪 Testing

Before submitting a PR:

1. Ensure linting passes: `npm run lint`
2. Test the build: `npm run build`
3. Test backend functions if modified
4. Manually test affected features

## 📦 Commit Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(blog): add tag editing to blog editor
fix(auth): resolve Cognito token refresh issue
docs(readme): update deployment instructions
refactor(api): improve error handling
```

## 🔄 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features (when test infrastructure exists)
3. **Update README.md** if needed
4. **Ensure CI passes** on your PR
5. **Request a review** from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes locally
```

## 🐛 Reporting Bugs

Use GitHub Issues with the following information:

- **Description**: Clear and concise description
- **Steps to Reproduce**: How to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: Browser/OS/Node version

## 💡 Suggesting Features

Feature requests are welcome! Please include:

- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions you've considered
- **Additional Context**: Mockups, examples, etc.

## 📚 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what is best for the community

## 🎯 Priority Areas

We especially welcome contributions in:

- 🧪 **Testing**: Adding unit and integration tests
- 📱 **Mobile Responsiveness**: Improving mobile UI/UX
- ♿ **Accessibility**: ARIA labels, keyboard navigation
- 🌍 **Internationalization**: Multi-language support
- 📝 **Documentation**: Tutorials, guides, API docs
- 🎨 **UI/UX**: Design improvements
- 🔒 **Security**: Security enhancements

## 📞 Questions?

- Open a GitHub Issue
- Check existing issues and discussions
- Review the README and documentation

Thank you for contributing! 🚀

---

**Co-authored-by**: Remember to add the following to your commit message:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```
