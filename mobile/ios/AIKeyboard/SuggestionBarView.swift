import UIKit

protocol SuggestionBarViewDelegate: AnyObject {
    func suggestionBar(_ suggestionBar: SuggestionBarView, didSelectSuggestion suggestion: String)
    func suggestionBarDidRequestUpgrade(_ suggestionBar: SuggestionBarView)
}

class SuggestionBarView: UIView {
    
    // MARK: - Properties
    weak var delegate: SuggestionBarViewDelegate?
    
    private var scrollView: UIScrollView!
    private var stackView: UIStackView!
    private var loadingIndicator: UIActivityIndicatorView!
    private var upgradeButton: UIButton!
    private var errorLabel: UILabel!
    
    private var suggestions: [AISuggestion] = []
    private var hasTierAccess = true
    private var appearance: UIKeyboardAppearance = .default
    
    // Analytics
    var suggestionsUsedCount = 0
    
    // UI Constants
    private let suggestionHeight: CGFloat = 32
    private let suggestionSpacing: CGFloat = 8
    private let horizontalPadding: CGFloat = 12
    private let cornerRadius: CGFloat = 16
    
    // MARK: - Initialization
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    // MARK: - Setup
    private func setupView() {
        backgroundColor = UIColor.systemBackground
        setupScrollView()
        setupStackView()
        setupLoadingIndicator()
        setupUpgradeButton()
        setupErrorLabel()
        updateAppearance(.default)
    }
    
    private func setupScrollView() {
        scrollView = UIScrollView()
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(scrollView)
        
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    private func setupStackView() {
        stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.distribution = .equalSpacing
        stackView.spacing = suggestionSpacing
        stackView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 6),
            stackView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: horizontalPadding),
            stackView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -horizontalPadding),
            stackView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -6),
            stackView.heightAnchor.constraint(equalToConstant: suggestionHeight)
        ])
    }
    
    private func setupLoadingIndicator() {
        loadingIndicator = UIActivityIndicatorView(style: .medium)
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        addSubview(loadingIndicator)
        
        NSLayoutConstraint.activate([
            loadingIndicator.centerXAnchor.constraint(equalTo: centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])
    }
    
    private func setupUpgradeButton() {
        upgradeButton = UIButton(type: .system)
        upgradeButton.setTitle("Upgrade for AI Suggestions", for: .normal)
        upgradeButton.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        upgradeButton.layer.cornerRadius = cornerRadius
        upgradeButton.addTarget(self, action: #selector(upgradeButtonTapped), for: .touchUpInside)
        upgradeButton.translatesAutoresizingMaskIntoConstraints = false
        upgradeButton.isHidden = true
        addSubview(upgradeButton)
        
        NSLayoutConstraint.activate([
            upgradeButton.centerXAnchor.constraint(equalTo: centerXAnchor),
            upgradeButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            upgradeButton.heightAnchor.constraint(equalToConstant: suggestionHeight),
            upgradeButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 200)
        ])
    }
    
    private func setupErrorLabel() {
        errorLabel = UILabel()
        errorLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        errorLabel.textAlignment = .center
        errorLabel.numberOfLines = 1
        errorLabel.translatesAutoresizingMaskIntoConstraints = false
        errorLabel.isHidden = true
        addSubview(errorLabel)
        
        NSLayoutConstraint.activate([
            errorLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            errorLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            errorLabel.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor, constant: horizontalPadding),
            errorLabel.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -horizontalPadding)
        ])
    }
    
    // MARK: - Public Methods
    func setSuggestions(_ suggestions: [AISuggestion]) {
        self.suggestions = suggestions
        hideAllStates()
        buildSuggestionButtons()
    }
    
    func clearSuggestions() {
        suggestions.removeAll()
        hideAllStates()
        clearSuggestionButtons()
    }
    
    func showLoading() {
        hideAllStates()
        loadingIndicator.startAnimating()
    }
    
    func showError(_ message: String) {
        hideAllStates()
        errorLabel.text = message
        errorLabel.isHidden = false
    }
    
    func setTierAccess(_ hasAccess: Bool) {
        hasTierAccess = hasAccess
        if !hasAccess {
            showUpgradePrompt()
        }
    }
    
    func showUpgradeMessage(_ message: String) {
        hideAllStates()
        upgradeButton.setTitle(message, for: .normal)
        upgradeButton.isHidden = false
    }
    
    func updateAppearance(_ appearance: UIKeyboardAppearance) {
        self.appearance = appearance
        let isDarkMode = appearance == .dark
        
        backgroundColor = isDarkMode ? UIColor.systemGray6 : UIColor.systemBackground
        
        // Update loading indicator
        loadingIndicator.color = isDarkMode ? UIColor.white : UIColor.black
        
        // Update upgrade button
        upgradeButton.backgroundColor = isDarkMode ? UIColor.systemBlue : UIColor.systemBlue
        upgradeButton.setTitleColor(UIColor.white, for: .normal)
        
        // Update error label
        errorLabel.textColor = isDarkMode ? UIColor.systemRed : UIColor.systemRed
        
        // Update existing suggestion buttons
        updateSuggestionButtonAppearances()
    }
    
    // MARK: - Private Methods
    private func hideAllStates() {
        loadingIndicator.stopAnimating()
        upgradeButton.isHidden = true
        errorLabel.isHidden = true
    }
    
    private func showUpgradePrompt() {
        hideAllStates()
        upgradeButton.isHidden = false
    }
    
    private func buildSuggestionButtons() {
        clearSuggestionButtons()
        
        for (index, suggestion) in suggestions.enumerated() {
            let button = createSuggestionButton(for: suggestion, at: index)
            stackView.addArrangedSubview(button)
        }
        
        // Update scroll view content size
        DispatchQueue.main.async {
            self.scrollView.contentSize = self.stackView.frame.size
        }
    }
    
    private func clearSuggestionButtons() {
        stackView.arrangedSubviews.forEach { view in
            stackView.removeArrangedSubview(view)
            view.removeFromSuperview()
        }
    }
    
    private func createSuggestionButton(for suggestion: AISuggestion, at index: Int) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(suggestion.text, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        button.titleLabel?.numberOfLines = 1
        button.layer.cornerRadius = cornerRadius
        button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
        button.tag = index
        button.addTarget(self, action: #selector(suggestionButtonTapped(_:)), for: .touchUpInside)
        
        // Set minimum width
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 80).isActive = true
        
        updateSuggestionButtonAppearance(button, for: suggestion)
        return button
    }
    
    private func updateSuggestionButtonAppearance(_ button: UIButton, for suggestion: AISuggestion) {
        let isDarkMode = appearance == .dark
        
        // Set colors based on suggestion confidence
        let confidence = suggestion.confidence
        
        if confidence >= 0.8 {
            // High confidence - primary color
            button.backgroundColor = isDarkMode ? UIColor.systemBlue : UIColor.systemBlue
            button.setTitleColor(UIColor.white, for: .normal)
        } else if confidence >= 0.6 {
            // Medium confidence - secondary color
            button.backgroundColor = isDarkMode ? UIColor.systemGray2 : UIColor.systemGray5
            button.setTitleColor(isDarkMode ? UIColor.white : UIColor.black, for: .normal)
        } else {
            // Low confidence - tertiary color
            button.backgroundColor = isDarkMode ? UIColor.systemGray3 : UIColor.systemGray6
            button.setTitleColor(isDarkMode ? UIColor.lightGray : UIColor.darkGray, for: .normal)
        }
        
        // Add border for light mode
        if !isDarkMode {
            button.layer.borderWidth = 0.5
            button.layer.borderColor = UIColor.systemGray4.cgColor
        } else {
            button.layer.borderWidth = 0
        }
    }
    
    private func updateSuggestionButtonAppearances() {
        for (index, view) in stackView.arrangedSubviews.enumerated() {
            if let button = view as? UIButton, index < suggestions.count {
                updateSuggestionButtonAppearance(button, for: suggestions[index])
            }
        }
    }
    
    // MARK: - Actions
    @objc private func suggestionButtonTapped(_ sender: UIButton) {
        let index = sender.tag
        guard index < suggestions.count else { return }
        
        let suggestion = suggestions[index]
        
        // Animate button press
        animateButtonPress(sender)
        
        // Track usage
        suggestionsUsedCount += 1
        
        // Notify delegate
        delegate?.suggestionBar(self, didSelectSuggestion: suggestion.text)
        
        // Clear suggestions after use
        clearSuggestions()
    }
    
    @objc private func upgradeButtonTapped() {
        animateButtonPress(upgradeButton)
        delegate?.suggestionBarDidRequestUpgrade(self)
    }
    
    // MARK: - Animations
    private func animateButtonPress(_ button: UIButton) {
        UIView.animate(withDuration: 0.1, animations: {
            button.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
            button.alpha = 0.7
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                button.transform = .identity
                button.alpha = 1.0
            }
        }
    }
}

// MARK: - Supporting Types
struct AISuggestion {
    let text: String
    let confidence: Double
    let type: SuggestionType
    let metadata: [String: Any]?
    
    init(text: String, confidence: Double = 0.8, type: SuggestionType = .general, metadata: [String: Any]? = nil) {
        self.text = text
        self.confidence = confidence
        self.type = type
        self.metadata = metadata
    }
}

enum SuggestionType {
    case general
    case opener
    case response
    case question
    case compliment
    case humor
}

