/**
 * AI Dating Coach - iOS Keyboard Extension
 * Custom keyboard with real-time AI coaching and message suggestions
 */

import UIKit
import Foundation

class KeyboardViewController: UIInputViewController {
    
    // MARK: - Properties
    private var keyboardView: AIKeyboardView!
    private var suggestionBar: SuggestionBarView!
    private var currentContext: String = ""
    private var isAnalyzing: Bool = false
    private var suggestions: [MessageSuggestion] = []
    
    // Configuration
    private let keyboardHeight: CGFloat = 280
    private let suggestionBarHeight: CGFloat = 44
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupKeyboard()
        setupSuggestionBar()
        setupConstraints()
        setupNotifications()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateKeyboardAppearance()
    }
    
    override func textWillChange(_ textInput: UITextInput?) {
        // Called when the text is about to change
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        // Called when the text has changed
        handleTextChange()
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
            // Suggestion bar at the top
            suggestionBar.topAnchor.constraint(equalTo: view.topAnchor),
            suggestionBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            suggestionBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            suggestionBar.heightAnchor.constraint(equalToConstant: suggestionBarHeight),
            
            // Keyboard view below suggestion bar
            keyboardView.topAnchor.constraint(equalTo: suggestionBar.bottomAnchor),
            keyboardView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            keyboardView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            keyboardView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            // Total height constraint
            view.heightAnchor.constraint(equalToConstant: keyboardHeight)
        ])
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillShow),
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillHide),
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }
    
    // MARK: - Keyboard Appearance
    private func updateKeyboardAppearance() {
        guard let textDocumentProxy = textDocumentProxy else { return }
        
        // Update keyboard theme based on system appearance
        let isDarkMode = traitCollection.userInterfaceStyle == .dark
        keyboardView.updateAppearance(isDarkMode: isDarkMode)
        suggestionBar.updateAppearance(isDarkMode: isDarkMode)
        
        // Update return key type
        keyboardView.updateReturnKeyType(textDocumentProxy.returnKeyType ?? .default)
    }
    
    // MARK: - Text Handling
    private func handleTextChange() {
        guard let textDocumentProxy = textDocumentProxy else { return }
        
        // Get current context (last few words)
        let beforeInput = textDocumentProxy.documentContextBeforeInput ?? ""
        let afterInput = textDocumentProxy.documentContextAfterInput ?? ""
        
        currentContext = beforeInput
        
        // Trigger AI analysis if context is sufficient
        if shouldAnalyzeContext(beforeInput) {
            analyzeCurrentContext()
        }
        
        // Update suggestion bar state
        suggestionBar.updateContext(beforeInput: beforeInput, afterInput: afterInput)
    }
    
    private func shouldAnalyzeContext(_ context: String) -> Bool {
        // Only analyze if we have enough context and user has paused typing
        let words = context.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        return words.count >= 3 && !isAnalyzing
    }
    
    // MARK: - AI Analysis
    private func analyzeCurrentContext() {
        guard !isAnalyzing else { return }
        
        isAnalyzing = true
        suggestionBar.showLoadingState()
        
        // Prepare analysis request
        let analysisRequest = ConversationAnalysisRequest(
            conversationText: currentContext,
            platform: detectCurrentApp(),
            analysisType: "text"
        )
        
        // Call AI service
        AICoachingService.shared.analyzeConversation(request: analysisRequest) { [weak self] result in
            DispatchQueue.main.async {
                self?.handleAnalysisResult(result)
            }
        }
    }
    
    private func handleAnalysisResult(_ result: Result<ConversationAnalysisResult, Error>) {
        isAnalyzing = false
        
        switch result {
        case .success(let analysis):
            suggestions = analysis.nextMessageSuggestions
            suggestionBar.updateSuggestions(suggestions)
            
            // Provide haptic feedback for new suggestions
            let impactFeedback = UIImpactFeedbackGenerator(style: .light)
            impactFeedback.impactOccurred()
            
        case .failure(let error):
            print("Analysis failed: \\(error)")
            suggestionBar.hideLoadingState()
            
            // Show fallback suggestions
            showFallbackSuggestions()
        }
    }
    
    private func showFallbackSuggestions() {
        let fallbackSuggestions = [
            MessageSuggestion(
                text: "That sounds interesting! Tell me more.",
                tone: .casual,
                engagementPrediction: 8.0,
                reasoning: "Shows interest and encourages continuation"
            ),
            MessageSuggestion(
                text: "I'd love to hear about that!",
                tone: .enthusiastic,
                engagementPrediction: 7.5,
                reasoning: "Enthusiastic response that invites sharing"
            ),
            MessageSuggestion(
                text: "What's your favorite part about it?",
                tone: .thoughtful,
                engagementPrediction: 8.5,
                reasoning: "Thoughtful question that shows genuine interest"
            )
        ]
        
        suggestions = fallbackSuggestions
        suggestionBar.updateSuggestions(fallbackSuggestions)
    }
    
    // MARK: - App Detection
    private func detectCurrentApp() -> String {
        // Detect which dating app is currently active
        guard let bundleIdentifier = Bundle.main.bundleIdentifier else {
            return "unknown"
        }
        
        // Map bundle identifiers to platform names
        let platformMap = [
            "com.cardify.tinder": "tinder",
            "com.bumble.app": "bumble",
            "co.hinge.app": "hinge",
            "com.okcupid.okcupid": "okcupid",
            "com.match.match": "match",
            "com.coffeemeetsbagel.app": "coffeemeetsbagel",
            "com.pof.pof": "pof"
        ]
        
        return platformMap[bundleIdentifier] ?? "unknown"
    }
    
    // MARK: - Notification Handlers
    @objc private func keyboardWillShow(_ notification: Notification) {
        // Handle keyboard appearance
    }
    
    @objc private func keyboardWillHide(_ notification: Notification) {
        // Handle keyboard dismissal
    }
    
    // MARK: - Memory Management
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - AIKeyboardViewDelegate
extension KeyboardViewController: AIKeyboardViewDelegate {
    
    func keyboardView(_ keyboardView: AIKeyboardView, didTapKey key: String) {
        guard let textDocumentProxy = textDocumentProxy else { return }
        
        switch key {
        case "DELETE":
            textDocumentProxy.deleteBackward()
        case "RETURN":
            textDocumentProxy.insertText("\\n")
        case "SPACE":
            textDocumentProxy.insertText(" ")
        case "SHIFT":
            keyboardView.toggleShift()
        case "NUMBERS":
            keyboardView.toggleNumbersMode()
        case "AI_SUGGESTIONS":
            suggestionBar.toggleExpanded()
        default:
            textDocumentProxy.insertText(key)
        }
        
        // Provide haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }
    
    func keyboardView(_ keyboardView: AIKeyboardView, didLongPressKey key: String) {
        // Handle long press actions (e.g., accent characters, special functions)
        switch key {
        case "DELETE":
            // Delete word
            guard let textDocumentProxy = textDocumentProxy else { return }
            
            // Delete characters until we hit a space or beginning
            while let beforeInput = textDocumentProxy.documentContextBeforeInput,
                  !beforeInput.isEmpty,
                  !beforeInput.hasSuffix(" ") {
                textDocumentProxy.deleteBackward()
            }
            
        case "SPACE":
            // Show cursor movement controls
            keyboardView.showCursorControls()
            
        default:
            break
        }
    }
}

// MARK: - SuggestionBarDelegate
extension KeyboardViewController: SuggestionBarDelegate {
    
    func suggestionBar(_ suggestionBar: SuggestionBarView, didSelectSuggestion suggestion: MessageSuggestion) {
        guard let textDocumentProxy = textDocumentProxy else { return }
        
        // Insert the suggestion text
        textDocumentProxy.insertText(suggestion.text)
        
        // Track usage
        AICoachingService.shared.trackSuggestionUsage(suggestion: suggestion, platform: detectCurrentApp())
        
        // Provide haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        // Clear suggestions after use
        suggestionBar.clearSuggestions()
    }
    
    func suggestionBar(_ suggestionBar: SuggestionBarView, didRequestMoreSuggestions: Void) {
        // Request additional suggestions with different tones
        guard !isAnalyzing else { return }
        
        isAnalyzing = true
        suggestionBar.showLoadingState()
        
        AICoachingService.shared.generateMoreSuggestions(
            context: currentContext,
            platform: detectCurrentApp(),
            excludedSuggestions: suggestions
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.handleAdditionalSuggestions(result)
            }
        }
    }
    
    private func handleAdditionalSuggestions(_ result: Result<[MessageSuggestion], Error>) {
        isAnalyzing = false
        
        switch result {
        case .success(let newSuggestions):
            suggestions.append(contentsOf: newSuggestions)
            suggestionBar.updateSuggestions(suggestions)
            
        case .failure(let error):
            print("Additional suggestions failed: \\(error)")
            suggestionBar.hideLoadingState()
        }
    }
    
    func suggestionBarDidRequestSettings(_ suggestionBar: SuggestionBarView) {
        // Open keyboard settings or main app
        openMainApp()
    }
    
    private func openMainApp() {
        // Open the main AI Dating Coach app
        guard let url = URL(string: "aidatingcoach://keyboard-settings") else { return }
        
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }
    }
}

// MARK: - Supporting Types
struct MessageSuggestion {
    let text: String
    let tone: SuggestionTone
    let engagementPrediction: Double
    let reasoning: String
}

enum SuggestionTone {
    case casual
    case enthusiastic
    case flirty
    case thoughtful
    
    var displayName: String {
        switch self {
        case .casual: return "Casual"
        case .enthusiastic: return "Enthusiastic"
        case .flirty: return "Flirty"
        case .thoughtful: return "Thoughtful"
        }
    }
    
    var color: UIColor {
        switch self {
        case .casual: return UIColor.systemBlue
        case .enthusiastic: return UIColor.systemOrange
        case .flirty: return UIColor.systemPink
        case .thoughtful: return UIColor.systemPurple
        }
    }
}

struct ConversationAnalysisRequest {
    let conversationText: String
    let platform: String
    let analysisType: String
}

struct ConversationAnalysisResult {
    let nextMessageSuggestions: [MessageSuggestion]
    let engagementScore: Double
    let sentimentScore: Double
    let coachingFeedback: String
}

// MARK: - Protocols
protocol AIKeyboardViewDelegate: AnyObject {
    func keyboardView(_ keyboardView: AIKeyboardView, didTapKey key: String)
    func keyboardView(_ keyboardView: AIKeyboardView, didLongPressKey key: String)
}

protocol SuggestionBarDelegate: AnyObject {
    func suggestionBar(_ suggestionBar: SuggestionBarView, didSelectSuggestion suggestion: MessageSuggestion)
    func suggestionBar(_ suggestionBar: SuggestionBarView, didRequestMoreSuggestions: Void)
    func suggestionBarDidRequestSettings(_ suggestionBar: SuggestionBarView)
}

