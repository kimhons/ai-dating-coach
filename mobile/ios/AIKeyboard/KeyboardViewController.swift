import UIKit
import Foundation

class KeyboardViewController: UIInputViewController {
    
    // MARK: - Properties
    private var keyboardView: AIKeyboardView!
    private var suggestionBar: SuggestionBarView!
    private var keyboardHeight: CGFloat = 216
    private var suggestionHeight: CGFloat = 44
    
    // AI Service
    private let aiService = AIKeyboardService.shared
    private let tierService = TierService.shared
    private let analyticsService = AnalyticsService.shared
    
    // Typing state
    private var currentText: String = ""
    private var isGeneratingSuggestions = false
    private var lastSuggestionTime: Date = Date()
    private let suggestionThrottleInterval: TimeInterval = 1.0
    
    // User preferences
    private var isHapticEnabled = true
    private var isDarkMode = false
    private var suggestionCount = 3
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupKeyboard()
        setupSuggestionBar()
        setupConstraints()
        loadUserPreferences()
        setupNotifications()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateKeyboardAppearance()
        checkTierAccess()
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        saveTypingSession()
    }
    
    // MARK: - Setup Methods
    private func setupKeyboard() {
        keyboardView = AIKeyboardView()
        keyboardView.delegate = self
        keyboardView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(keyboardView)
    }
    
    private func setupSuggestionBar() {
        suggestionBar = SuggestionBarView()
        suggestionBar.delegate = self
        suggestionBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(suggestionBar)
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Suggestion bar at top
            suggestionBar.topAnchor.constraint(equalTo: view.topAnchor),
            suggestionBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            suggestionBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            suggestionBar.heightAnchor.constraint(equalToConstant: suggestionHeight),
            
            // Keyboard below suggestion bar
            keyboardView.topAnchor.constraint(equalTo: suggestionBar.bottomAnchor),
            keyboardView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            keyboardView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            keyboardView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        // Set keyboard height
        let heightConstraint = view.heightAnchor.constraint(equalToConstant: keyboardHeight + suggestionHeight)
        heightConstraint.priority = UILayoutPriority(999)
        heightConstraint.isActive = true
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(tierUpdated),
            name: .tierUpdated,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(preferencesUpdated),
            name: .keyboardPreferencesUpdated,
            object: nil
        )
    }
    
    // MARK: - User Preferences
    private func loadUserPreferences() {
        let defaults = UserDefaults(suiteName: "group.com.aidatingcoach.keyboard")
        isHapticEnabled = defaults?.bool(forKey: "haptic_enabled") ?? true
        isDarkMode = defaults?.bool(forKey: "dark_mode") ?? false
        suggestionCount = defaults?.integer(forKey: "suggestion_count") ?? 3
    }
    
    private func updateKeyboardAppearance() {
        let appearance = isDarkMode ? UIKeyboardAppearance.dark : UIKeyboardAppearance.light
        keyboardView.updateAppearance(appearance)
        suggestionBar.updateAppearance(appearance)
    }
    
    // MARK: - Tier Management
    private func checkTierAccess() {
        Task {
            do {
                let hasAccess = try await tierService.checkFeatureAccess(.keyboardSuggestions)
                DispatchQueue.main.async {
                    self.suggestionBar.setTierAccess(hasAccess)
                    if !hasAccess {
                        self.showUpgradePrompt()
                    }
                }
            } catch {
                print("Error checking tier access: \\(error)")
            }
        }
    }
    
    private func showUpgradePrompt() {
        suggestionBar.showUpgradeMessage("Upgrade to Premium for unlimited AI suggestions")
    }
    
    // MARK: - Text Input Handling
    override func textWillChange(_ textInput: UITextInput?) {
        super.textWillChange(textInput)
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        
        guard let textInput = textInput else { return }
        
        // Get current text context
        if let selectedRange = textInput.selectedTextRange,
           let textRange = textInput.textRange(from: textInput.beginningOfDocument, to: selectedRange.start) {
            currentText = textInput.text(in: textRange) ?? ""
        }
        
        // Generate suggestions if enough text
        if currentText.count >= 3 {
            generateSuggestions()
        } else {
            suggestionBar.clearSuggestions()
        }
    }
    
    // MARK: - AI Suggestion Generation
    private func generateSuggestions() {
        // Throttle suggestion generation
        let now = Date()
        guard now.timeIntervalSince(lastSuggestionTime) >= suggestionThrottleInterval else { return }
        lastSuggestionTime = now
        
        // Check if already generating
        guard !isGeneratingSuggestions else { return }
        
        // Check tier access
        Task {
            do {
                let hasAccess = try await tierService.checkFeatureAccess(.keyboardSuggestions)
                guard hasAccess else {
                    DispatchQueue.main.async {
                        self.showUpgradePrompt()
                    }
                    return
                }
                
                await generateAISuggestions()
            } catch {
                print("Error checking tier access for suggestions: \\(error)")
            }
        }
    }
    
    @MainActor
    private func generateAISuggestions() async {
        isGeneratingSuggestions = true
        suggestionBar.showLoading()
        
        do {
            // Track usage
            try await tierService.trackUsage(.keyboardSuggestions)
            
            // Get AI suggestions
            let suggestions = try await aiService.generateSuggestions(
                text: currentText,
                context: getConversationContext(),
                count: suggestionCount
            )
            
            // Update UI
            suggestionBar.setSuggestions(suggestions)
            
            // Analytics
            analyticsService.trackEvent("keyboard_suggestions_generated", parameters: [
                "suggestion_count": suggestions.count,
                "text_length": currentText.count
            ])
            
        } catch {
            print("Error generating suggestions: \\(error)")
            suggestionBar.showError("Unable to generate suggestions")
            
            // Track error
            analyticsService.trackEvent("keyboard_suggestion_error", parameters: [
                "error": error.localizedDescription
            ])
        }
        
        isGeneratingSuggestions = false
    }
    
    private func getConversationContext() -> ConversationContext {
        // Try to extract context from the current app
        let bundleId = Bundle.main.bundleIdentifier ?? ""
        let appName = getAppName(from: bundleId)
        
        return ConversationContext(
            platform: detectDatingPlatform(bundleId: bundleId),
            appName: appName,
            conversationType: .message,
            previousMessages: extractPreviousMessages()
        )
    }
    
    private func detectDatingPlatform(bundleId: String) -> DatingPlatform {
        switch bundleId.lowercased() {
        case let id where id.contains("tinder"):
            return .tinder
        case let id where id.contains("bumble"):
            return .bumble
        case let id where id.contains("hinge"):
            return .hinge
        case let id where id.contains("match"):
            return .match
        default:
            return .unknown
        }
    }
    
    private func getAppName(from bundleId: String) -> String {
        // Extract app name from bundle ID
        let components = bundleId.components(separatedBy: ".")
        return components.last?.capitalized ?? "Unknown App"
    }
    
    private func extractPreviousMessages() -> [String] {
        // This would require more complex text analysis
        // For now, return empty array
        return []
    }
    
    // MARK: - Haptic Feedback
    private func performHapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        guard isHapticEnabled else { return }
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
    
    // MARK: - Session Management
    private func saveTypingSession() {
        let session = TypingSession(
            startTime: Date(),
            endTime: Date(),
            charactersTyped: currentText.count,
            suggestionsUsed: suggestionBar.suggestionsUsedCount,
            platform: getConversationContext().platform.rawValue
        )
        
        analyticsService.trackTypingSession(session)
    }
    
    // MARK: - Notification Handlers
    @objc private func tierUpdated() {
        checkTierAccess()
    }
    
    @objc private func preferencesUpdated() {
        loadUserPreferences()
        updateKeyboardAppearance()
    }
    
    // MARK: - Memory Management
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - AIKeyboardViewDelegate
extension KeyboardViewController: AIKeyboardViewDelegate {
    func keyboardView(_ keyboardView: AIKeyboardView, didTapKey key: String) {
        performHapticFeedback(.light)
        
        switch key {
        case "delete":
            textDocumentProxy.deleteBackward()
        case "return":
            textDocumentProxy.insertText("\\n")
        case "space":
            textDocumentProxy.insertText(" ")
        case "shift":
            keyboardView.toggleShift()
        case "numbers":
            keyboardView.showNumbersKeyboard()
        case "letters":
            keyboardView.showLettersKeyboard()
        case "globe":
            advanceToNextInputMode()
        default:
            textDocumentProxy.insertText(key)
        }
        
        // Track key press
        analyticsService.trackEvent("keyboard_key_pressed", parameters: [
            "key": key
        ])
    }
    
    func keyboardView(_ keyboardView: AIKeyboardView, didLongPressKey key: String) {
        performHapticFeedback(.medium)
        
        // Handle long press actions (e.g., accented characters)
        switch key {
        case "delete":
            // Delete word
            if let selectedRange = textDocumentProxy.selectedTextRange {
                textDocumentProxy.deleteBackward()
            }
        default:
            break
        }
    }
}

// MARK: - SuggestionBarViewDelegate
extension KeyboardViewController: SuggestionBarViewDelegate {
    func suggestionBar(_ suggestionBar: SuggestionBarView, didSelectSuggestion suggestion: String) {
        performHapticFeedback(.medium)
        
        // Replace current word with suggestion
        replaceCurrentWordWith(suggestion)
        
        // Track suggestion usage
        analyticsService.trackEvent("keyboard_suggestion_used", parameters: [
            "suggestion": suggestion,
            "original_text": currentText
        ])
        
        // Update usage count
        Task {
            try? await tierService.trackUsage(.keyboardSuggestions)
        }
    }
    
    func suggestionBarDidRequestUpgrade(_ suggestionBar: SuggestionBarView) {
        // Open main app to upgrade screen
        let url = URL(string: "aidatingcoach://upgrade")!
        extensionContext?.open(url, completionHandler: nil)
        
        analyticsService.trackEvent("keyboard_upgrade_requested")
    }
    
    private func replaceCurrentWordWith(_ suggestion: String) {
        // Find the current word boundaries
        guard let selectedRange = textDocumentProxy.selectedTextRange else { return }
        
        // Get text before cursor
        if let textRange = textDocumentProxy.textRange(from: textDocumentProxy.beginningOfDocument, to: selectedRange.start),
           let textBeforeCursor = textDocumentProxy.text(in: textRange) {
            
            // Find last word
            let words = textBeforeCursor.components(separatedBy: .whitespacesAndNewlines)
            if let lastWord = words.last, !lastWord.isEmpty {
                // Delete the last word
                for _ in 0..<lastWord.count {
                    textDocumentProxy.deleteBackward()
                }
            }
        }
        
        // Insert the suggestion
        textDocumentProxy.insertText(suggestion)
        
        // Add space after suggestion
        textDocumentProxy.insertText(" ")
    }
}

// MARK: - Supporting Types
struct ConversationContext {
    let platform: DatingPlatform
    let appName: String
    let conversationType: ConversationType
    let previousMessages: [String]
}

enum DatingPlatform: String, CaseIterable {
    case tinder = "tinder"
    case bumble = "bumble"
    case hinge = "hinge"
    case match = "match"
    case unknown = "unknown"
}

enum ConversationType {
    case message
    case bio
    case prompt
}

struct TypingSession {
    let startTime: Date
    let endTime: Date
    let charactersTyped: Int
    let suggestionsUsed: Int
    let platform: String
}

// MARK: - Notification Names
extension Notification.Name {
    static let tierUpdated = Notification.Name("tierUpdated")
    static let keyboardPreferencesUpdated = Notification.Name("keyboardPreferencesUpdated")
}

