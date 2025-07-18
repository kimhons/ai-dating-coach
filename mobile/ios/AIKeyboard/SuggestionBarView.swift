/**
 * AI Dating Coach - Suggestion Bar View
 * Displays AI-generated message suggestions above the keyboard
 */

import UIKit

class SuggestionBarView: UIView {
    
    // MARK: - Properties
    weak var delegate: SuggestionBarDelegate?
    
    private var scrollView: UIScrollView!
    private var stackView: UIStackView!
    private var loadingIndicator: UIActivityIndicatorView!
    private var expandButton: UIButton!
    private var settingsButton: UIButton!
    
    private var suggestions: [MessageSuggestion] = []
    private var isExpanded: Bool = false
    private var isDarkMode: Bool = false
    
    // Configuration
    private let suggestionHeight: CGFloat = 32
    private let expandedHeight: CGFloat = 88
    private let cornerRadius: CGFloat = 16
    private let suggestionSpacing: CGFloat = 8
    
    // Colors
    private var backgroundColor: UIColor {
        return isDarkMode ? UIColor(red: 0.15, green: 0.15, blue: 0.15, alpha: 1.0) : UIColor(red: 0.95, green: 0.95, blue: 0.95, alpha: 1.0)
    }
    
    private var suggestionBackgroundColor: UIColor {
        return isDarkMode ? UIColor(red: 0.25, green: 0.25, blue: 0.25, alpha: 1.0) : UIColor.white
    }
    
    private var textColor: UIColor {
        return isDarkMode ? UIColor.white : UIColor.black
    }
    
    private var accentColor: UIColor {
        return UIColor(red: 0.914, green: 0.118, blue: 0.388, alpha: 1.0) // #E91E63
    }
    
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
        backgroundColor = self.backgroundColor
        layer.cornerRadius = cornerRadius
        layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        
        setupScrollView()
        setupStackView()
        setupLoadingIndicator()
        setupControlButtons()
        setupConstraints()
        
        showEmptyState()
    }
    
    private func setupScrollView() {
        scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.contentInsetAdjustmentBehavior = .never
        addSubview(scrollView)
    }
    
    private func setupStackView() {
        stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .horizontal
        stackView.spacing = suggestionSpacing
        stackView.alignment = .center
        stackView.distribution = .equalSpacing
        scrollView.addSubview(stackView)
    }
    
    private func setupLoadingIndicator() {
        loadingIndicator = UIActivityIndicatorView(style: .medium)
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.color = accentColor
        loadingIndicator.hidesWhenStopped = true
        addSubview(loadingIndicator)
    }
    
    private func setupControlButtons() {
        // Expand/collapse button
        expandButton = UIButton(type: .system)
        expandButton.translatesAutoresizingMaskIntoConstraints = false
        expandButton.setTitle("⌃", for: .normal)
        expandButton.setTitleColor(textColor, for: .normal)
        expandButton.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        expandButton.backgroundColor = suggestionBackgroundColor
        expandButton.layer.cornerRadius = 12
        expandButton.addTarget(self, action: #selector(expandButtonTapped), for: .touchUpInside)
        addSubview(expandButton)
        
        // Settings button
        settingsButton = UIButton(type: .system)
        settingsButton.translatesAutoresizingMaskIntoConstraints = false
        settingsButton.setTitle("⚙", for: .normal)
        settingsButton.setTitleColor(textColor, for: .normal)
        settingsButton.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        settingsButton.backgroundColor = suggestionBackgroundColor
        settingsButton.layer.cornerRadius = 12
        settingsButton.addTarget(self, action: #selector(settingsButtonTapped), for: .touchUpInside)
        addSubview(settingsButton)
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Scroll view
            scrollView.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            scrollView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            scrollView.trailingAnchor.constraint(equalTo: expandButton.leadingAnchor, constant: -8),
            scrollView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),
            
            // Stack view
            stackView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            stackView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            stackView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            stackView.heightAnchor.constraint(equalTo: scrollView.heightAnchor),
            
            // Loading indicator
            loadingIndicator.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: scrollView.centerYAnchor),
            
            // Expand button
            expandButton.trailingAnchor.constraint(equalTo: settingsButton.leadingAnchor, constant: -4),
            expandButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            expandButton.widthAnchor.constraint(equalToConstant: 24),
            expandButton.heightAnchor.constraint(equalToConstant: 24),
            
            // Settings button
            settingsButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
            settingsButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            settingsButton.widthAnchor.constraint(equalToConstant: 24),
            settingsButton.heightAnchor.constraint(equalToConstant: 24)
        ])
    }
    
    // MARK: - Public Methods
    func updateSuggestions(_ suggestions: [MessageSuggestion]) {
        self.suggestions = suggestions
        hideLoadingState()
        displaySuggestions()
    }
    
    func showLoadingState() {
        clearSuggestions()
        loadingIndicator.startAnimating()
        scrollView.isHidden = true
    }
    
    func hideLoadingState() {
        loadingIndicator.stopAnimating()
        scrollView.isHidden = false
    }
    
    func clearSuggestions() {
        suggestions.removeAll()
        stackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        showEmptyState()
    }
    
    func updateAppearance(isDarkMode: Bool) {
        self.isDarkMode = isDarkMode
        backgroundColor = self.backgroundColor
        expandButton.backgroundColor = suggestionBackgroundColor
        settingsButton.backgroundColor = suggestionBackgroundColor
        expandButton.setTitleColor(textColor, for: .normal)
        settingsButton.setTitleColor(textColor, for: .normal)
        
        // Update existing suggestion buttons
        for view in stackView.arrangedSubviews {
            if let button = view as? UIButton {
                updateSuggestionButtonAppearance(button)
            }
        }
    }
    
    func updateContext(beforeInput: String, afterInput: String) {
        // Update UI based on current text context
        let hasText = !beforeInput.isEmpty
        expandButton.isHidden = !hasText
        
        if !hasText {
            clearSuggestions()
        }
    }
    
    func toggleExpanded() {
        isExpanded.toggle()
        updateExpandedState()
    }
    
    // MARK: - Private Methods
    private func displaySuggestions() {
        // Clear existing suggestions
        stackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        
        if suggestions.isEmpty {
            showEmptyState()
            return
        }
        
        // Create suggestion buttons
        for suggestion in suggestions {
            let button = createSuggestionButton(for: suggestion)
            stackView.addArrangedSubview(button)
        }
        
        // Add "more" button if we have suggestions
        if !suggestions.isEmpty {
            let moreButton = createMoreButton()
            stackView.addArrangedSubview(moreButton)
        }
        
        // Scroll to beginning
        DispatchQueue.main.async {
            self.scrollView.setContentOffset(.zero, animated: true)
        }
    }
    
    private func createSuggestionButton(for suggestion: MessageSuggestion) -> UIButton {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure appearance
        updateSuggestionButtonAppearance(button)
        
        // Set content
        button.setTitle(suggestion.text, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        button.titleLabel?.numberOfLines = isExpanded ? 2 : 1
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        
        // Add tone indicator
        if isExpanded {
            addToneIndicator(to: button, tone: suggestion.tone)
        }
        
        // Set constraints
        NSLayoutConstraint.activate([
            button.heightAnchor.constraint(equalToConstant: isExpanded ? expandedHeight - 12 : suggestionHeight),
            button.widthAnchor.constraint(greaterThanOrEqualToConstant: 80)
        ])
        
        // Add action
        button.addTarget(self, action: #selector(suggestionButtonTapped(_:)), for: .touchUpInside)
        
        // Store suggestion in button
        button.accessibilityIdentifier = suggestion.text
        
        return button
    }
    
    private func updateSuggestionButtonAppearance(_ button: UIButton) {
        button.backgroundColor = suggestionBackgroundColor
        button.setTitleColor(textColor, for: .normal)
        button.layer.cornerRadius = 16
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.systemGray4.cgColor
        
        // Add shadow
        button.layer.shadowColor = UIColor.black.cgColor
        button.layer.shadowOffset = CGSize(width: 0, height: 1)
        button.layer.shadowOpacity = 0.1
        button.layer.shadowRadius = 2
        
        // Content insets
        button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
    }
    
    private func addToneIndicator(to button: UIButton, tone: SuggestionTone) {
        // Add a small colored indicator for the tone
        let indicator = UIView()
        indicator.translatesAutoresizingMaskIntoConstraints = false
        indicator.backgroundColor = tone.color
        indicator.layer.cornerRadius = 3
        button.addSubview(indicator)
        
        NSLayoutConstraint.activate([
            indicator.topAnchor.constraint(equalTo: button.topAnchor, constant: 4),
            indicator.trailingAnchor.constraint(equalTo: button.trailingAnchor, constant: -4),
            indicator.widthAnchor.constraint(equalToConstant: 6),
            indicator.heightAnchor.constraint(equalToConstant: 6)
        ])
    }
    
    private func createMoreButton() -> UIButton {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle("+ More", for: .normal)
        button.setTitleColor(accentColor, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        button.backgroundColor = suggestionBackgroundColor
        button.layer.cornerRadius = 16
        button.layer.borderWidth = 1
        button.layer.borderColor = accentColor.cgColor
        button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
        
        NSLayoutConstraint.activate([
            button.heightAnchor.constraint(equalToConstant: suggestionHeight),
            button.widthAnchor.constraint(equalToConstant: 60)
        ])
        
        button.addTarget(self, action: #selector(moreButtonTapped), for: .touchUpInside)
        
        return button
    }
    
    private func showEmptyState() {
        // Show placeholder when no suggestions are available
        let placeholderLabel = UILabel()
        placeholderLabel.translatesAutoresizingMaskIntoConstraints = false
        placeholderLabel.text = "Start typing for AI suggestions..."
        placeholderLabel.textColor = UIColor.systemGray
        placeholderLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        placeholderLabel.textAlignment = .center
        
        stackView.addArrangedSubview(placeholderLabel)
        
        NSLayoutConstraint.activate([
            placeholderLabel.heightAnchor.constraint(equalToConstant: suggestionHeight)
        ])
    }
    
    private func updateExpandedState() {
        let expandSymbol = isExpanded ? "⌄" : "⌃"
        expandButton.setTitle(expandSymbol, for: .normal)
        
        // Update height constraint if needed
        // This would typically be handled by the parent view controller
        
        // Recreate suggestions with new layout
        if !suggestions.isEmpty {
            displaySuggestions()
        }
    }
    
    // MARK: - Button Actions
    @objc private func suggestionButtonTapped(_ sender: UIButton) {
        guard let suggestionText = sender.accessibilityIdentifier,
              let suggestion = suggestions.first(where: { $0.text == suggestionText }) else { return }
        
        // Animate button press
        UIView.animate(withDuration: 0.1, animations: {
            sender.transform = CGAffineTransform(scaleX: 0.95, scaleY: 0.95)
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                sender.transform = .identity
            }
        }
        
        delegate?.suggestionBar(self, didSelectSuggestion: suggestion)
    }
    
    @objc private func moreButtonTapped() {
        delegate?.suggestionBar(self, didRequestMoreSuggestions: ())
    }
    
    @objc private func expandButtonTapped() {
        toggleExpanded()
    }
    
    @objc private func settingsButtonTapped() {
        delegate?.suggestionBarDidRequestSettings(self)
    }
    
    // MARK: - Accessibility
    override var accessibilityElements: [Any]? {
        get {
            var elements: [Any] = []
            elements.append(contentsOf: stackView.arrangedSubviews)
            elements.append(expandButton!)
            elements.append(settingsButton!)
            return elements
        }
        set {
            super.accessibilityElements = newValue
        }
    }
}

// MARK: - Animation Extensions
extension SuggestionBarView {
    
    func animateNewSuggestions() {
        // Animate the appearance of new suggestions
        stackView.arrangedSubviews.forEach { view in
            view.alpha = 0
            view.transform = CGAffineTransform(scaleX: 0.8, scaleY: 0.8)
        }
        
        UIView.animateKeyframes(withDuration: 0.6, delay: 0, options: [], animations: {
            for (index, view) in self.stackView.arrangedSubviews.enumerated() {
                UIView.addKeyframe(withRelativeStartTime: Double(index) * 0.1, relativeDuration: 0.3) {
                    view.alpha = 1
                    view.transform = .identity
                }
            }
        })
    }
    
    func animateSuggestionSelection(_ button: UIButton) {
        // Animate suggestion selection with a highlight effect
        let originalBackgroundColor = button.backgroundColor
        
        UIView.animate(withDuration: 0.2, animations: {
            button.backgroundColor = self.accentColor.withAlphaComponent(0.3)
        }) { _ in
            UIView.animate(withDuration: 0.2) {
                button.backgroundColor = originalBackgroundColor
            }
        }
    }
}

// MARK: - Gesture Handling
extension SuggestionBarView {
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        
        // Provide haptic feedback for touch
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }
}

