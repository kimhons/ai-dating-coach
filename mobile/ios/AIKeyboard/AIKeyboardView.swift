/**
 * AI Dating Coach - Custom iOS Keyboard View
 * Professional keyboard interface with AI coaching integration
 */

import UIKit

class AIKeyboardView: UIView {
    
    // MARK: - Properties
    weak var delegate: AIKeyboardViewDelegate?
    
    private var keyButtons: [UIButton] = []
    private var isShiftEnabled: Bool = false
    private var isNumbersMode: Bool = false
    private var isDarkMode: Bool = false
    
    // Layout configuration
    private let keySpacing: CGFloat = 6
    private let rowSpacing: CGFloat = 8
    private let keyCornerRadius: CGFloat = 8
    private let keyHeight: CGFloat = 42
    
    // Color scheme
    private var keyBackgroundColor: UIColor {
        return isDarkMode ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : UIColor.white
    }
    
    private var keyTextColor: UIColor {
        return isDarkMode ? UIColor.white : UIColor.black
    }
    
    private var specialKeyColor: UIColor {
        return UIColor(red: 0.914, green: 0.118, blue: 0.388, alpha: 1.0) // #E91E63
    }
    
    private var keyboardBackgroundColor: UIColor {
        return isDarkMode ? UIColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1.0) : UIColor(red: 0.98, green: 0.98, blue: 0.98, alpha: 1.0)
    }
    
    // Keyboard layouts
    private let qwertyLayout = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["SHIFT", "z", "x", "c", "v", "b", "n", "m", "DELETE"],
        ["NUMBERS", "SPACE", "AI_SUGGESTIONS", "RETURN"]
    ]
    
    private let numbersLayout = [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\\""],
        ["SYMBOLS", ".", ",", "?", "!", "'", "\\"", "DELETE"],
        ["LETTERS", "SPACE", "AI_SUGGESTIONS", "RETURN"]
    ]
    
    private let symbolsLayout = [
        ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
        ["_", "\\\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
        ["NUMBERS", ".", ",", "?", "!", "'", "\\"", "DELETE"],
        ["LETTERS", "SPACE", "AI_SUGGESTIONS", "RETURN"]
    ]
    
    // MARK: - Initialization
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
        createKeyboard()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
        createKeyboard()
    }
    
    // MARK: - Setup
    private func setupView() {
        backgroundColor = keyboardBackgroundColor
        layer.cornerRadius = 12
        layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
    }
    
    private func createKeyboard() {
        // Remove existing buttons
        keyButtons.forEach { $0.removeFromSuperview() }
        keyButtons.removeAll()
        
        let layout = getCurrentLayout()
        
        for (rowIndex, row) in layout.enumerated() {
            createKeyRow(keys: row, rowIndex: rowIndex, totalRows: layout.count)
        }
    }
    
    private func getCurrentLayout() -> [[String]] {
        if isNumbersMode {
            return numbersLayout
        } else {
            return qwertyLayout
        }
    }
    
    private func createKeyRow(keys: [String], rowIndex: Int, totalRows: Int) {
        let rowStackView = UIStackView()
        rowStackView.axis = .horizontal
        rowStackView.distribution = .fillEqually
        rowStackView.spacing = keySpacing
        rowStackView.translatesAutoresizingMaskIntoConstraints = false
        
        for key in keys {
            let button = createKeyButton(for: key, rowIndex: rowIndex)
            keyButtons.append(button)
            rowStackView.addArrangedSubview(button)
        }
        
        addSubview(rowStackView)
        
        // Set constraints for the row
        let topOffset = CGFloat(rowIndex) * (keyHeight + rowSpacing) + 16
        
        NSLayoutConstraint.activate([
            rowStackView.topAnchor.constraint(equalTo: topAnchor, constant: topOffset),
            rowStackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            rowStackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            rowStackView.heightAnchor.constraint(equalToConstant: keyHeight)
        ])
    }
    
    private func createKeyButton(for key: String, rowIndex: Int) -> UIButton {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure button appearance
        configureKeyButton(button, for: key)
        
        // Add actions
        button.addTarget(self, action: #selector(keyTapped(_:)), for: .touchUpInside)
        button.addTarget(self, action: #selector(keyPressed(_:)), for: .touchDown)
        button.addTarget(self, action: #selector(keyReleased(_:)), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        
        // Add long press gesture for special actions
        let longPressGesture = UILongPressGestureRecognizer(target: self, action: #selector(keyLongPressed(_:)))
        longPressGesture.minimumPressDuration = 0.5
        button.addGestureRecognizer(longPressGesture)
        
        return button
    }
    
    private func configureKeyButton(_ button: UIButton, for key: String) {
        // Set button text and styling based on key type
        switch key {
        case "SPACE":
            button.setTitle("space", for: .normal)
            button.backgroundColor = keyBackgroundColor
            button.setTitleColor(keyTextColor, for: .normal)
            
        case "DELETE":
            button.setTitle("⌫", for: .normal)
            button.backgroundColor = UIColor.systemGray2
            button.setTitleColor(keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
            
        case "RETURN":
            button.setTitle("return", for: .normal)
            button.backgroundColor = specialKeyColor
            button.setTitleColor(.white, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
            
        case "SHIFT":
            let shiftSymbol = isShiftEnabled ? "⇧" : "⇧"
            button.setTitle(shiftSymbol, for: .normal)
            button.backgroundColor = isShiftEnabled ? specialKeyColor : UIColor.systemGray2
            button.setTitleColor(isShiftEnabled ? .white : keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
            
        case "NUMBERS":
            button.setTitle("123", for: .normal)
            button.backgroundColor = UIColor.systemGray2
            button.setTitleColor(keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
            
        case "LETTERS":
            button.setTitle("ABC", for: .normal)
            button.backgroundColor = UIColor.systemGray2
            button.setTitleColor(keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
            
        case "SYMBOLS":
            button.setTitle("#+", for: .normal)
            button.backgroundColor = UIColor.systemGray2
            button.setTitleColor(keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
            
        case "AI_SUGGESTIONS":
            button.setTitle("🤖", for: .normal)
            button.backgroundColor = specialKeyColor
            button.setTitleColor(.white, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 18)
            
        default:
            // Regular letter/number/symbol keys
            let displayText = isShiftEnabled ? key.uppercased() : key.lowercased()
            button.setTitle(displayText, for: .normal)
            button.backgroundColor = keyBackgroundColor
            button.setTitleColor(keyTextColor, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        }
        
        // Common styling
        button.layer.cornerRadius = keyCornerRadius
        button.layer.shadowColor = UIColor.black.cgColor
        button.layer.shadowOffset = CGSize(width: 0, height: 1)
        button.layer.shadowOpacity = 0.1
        button.layer.shadowRadius = 2
        
        // Add border for better visibility
        button.layer.borderWidth = 0.5
        button.layer.borderColor = UIColor.systemGray4.cgColor
    }
    
    // MARK: - Button Actions
    @objc private func keyTapped(_ sender: UIButton) {
        guard let key = getKeyForButton(sender) else { return }
        delegate?.keyboardView(self, didTapKey: key)
        
        // Handle special key actions
        handleSpecialKeyActions(key)
    }
    
    @objc private func keyPressed(_ sender: UIButton) {
        // Visual feedback for key press
        UIView.animate(withDuration: 0.1) {
            sender.transform = CGAffineTransform(scaleX: 0.95, scaleY: 0.95)
            sender.alpha = 0.8
        }
    }
    
    @objc private func keyReleased(_ sender: UIButton) {
        // Reset visual state
        UIView.animate(withDuration: 0.1) {
            sender.transform = .identity
            sender.alpha = 1.0
        }
    }
    
    @objc private func keyLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began,
              let button = gesture.view as? UIButton,
              let key = getKeyForButton(button) else { return }
        
        delegate?.keyboardView(self, didLongPressKey: key)
        
        // Provide haptic feedback for long press
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    private func getKeyForButton(_ button: UIButton) -> String? {
        guard let title = button.title(for: .normal) else { return nil }
        
        // Map display titles back to key identifiers
        switch title {
        case "space": return "SPACE"
        case "⌫": return "DELETE"
        case "return": return "RETURN"
        case "⇧": return "SHIFT"
        case "123": return "NUMBERS"
        case "ABC": return "LETTERS"
        case "#+": return "SYMBOLS"
        case "🤖": return "AI_SUGGESTIONS"
        default: return title
        }
    }
    
    private func handleSpecialKeyActions(_ key: String) {
        switch key {
        case "SHIFT":
            toggleShift()
        case "NUMBERS":
            toggleNumbersMode()
        case "LETTERS":
            isNumbersMode = false
            createKeyboard()
        case "SYMBOLS":
            // Toggle to symbols layout (implement if needed)
            break
        default:
            break
        }
    }
    
    // MARK: - Public Methods
    func toggleShift() {
        isShiftEnabled.toggle()
        updateShiftKeys()
    }
    
    func toggleNumbersMode() {
        isNumbersMode.toggle()
        createKeyboard()
    }
    
    func updateAppearance(isDarkMode: Bool) {
        self.isDarkMode = isDarkMode
        backgroundColor = keyboardBackgroundColor
        createKeyboard()
    }
    
    func updateReturnKeyType(_ returnKeyType: UIReturnKeyType) {
        // Update return key appearance based on context
        let returnButton = keyButtons.first { getKeyForButton($0) == "RETURN" }
        
        switch returnKeyType {
        case .send:
            returnButton?.setTitle("send", for: .normal)
        case .search:
            returnButton?.setTitle("search", for: .normal)
        case .go:
            returnButton?.setTitle("go", for: .normal)
        case .done:
            returnButton?.setTitle("done", for: .normal)
        default:
            returnButton?.setTitle("return", for: .normal)
        }
    }
    
    func showCursorControls() {
        // Show cursor movement controls (implement if needed)
        // This could be a temporary overlay with arrow keys
    }
    
    // MARK: - Private Methods
    private func updateShiftKeys() {
        // Update all letter keys to reflect shift state
        for button in keyButtons {
            guard let key = getKeyForButton(button),
                  key.count == 1,
                  key.rangeOfCharacter(from: .letters) != nil else { continue }
            
            let displayText = isShiftEnabled ? key.uppercased() : key.lowercased()
            button.setTitle(displayText, for: .normal)
        }
        
        // Update shift button appearance
        let shiftButton = keyButtons.first { getKeyForButton($0) == "SHIFT" }
        shiftButton?.backgroundColor = isShiftEnabled ? specialKeyColor : UIColor.systemGray2
        shiftButton?.setTitleColor(isShiftEnabled ? .white : keyTextColor, for: .normal)
    }
    
    // MARK: - Accessibility
    override func accessibilityElementCount() -> Int {
        return keyButtons.count
    }
    
    override func accessibilityElement(at index: Int) -> Any? {
        guard index < keyButtons.count else { return nil }
        return keyButtons[index]
    }
    
    override func index(ofAccessibilityElement element: Any) -> Int {
        guard let button = element as? UIButton else { return NSNotFound }
        return keyButtons.firstIndex(of: button) ?? NSNotFound
    }
}

// MARK: - Extensions
extension AIKeyboardView {
    
    // Add support for custom key layouts based on app context
    func updateLayoutForApp(_ appIdentifier: String) {
        // Customize keyboard layout based on the current dating app
        switch appIdentifier {
        case "com.cardify.tinder":
            // Tinder-specific optimizations
            addQuickResponseKeys(["Hey!", "How's it going?", "What's up?"])
        case "com.bumble.app":
            // Bumble-specific optimizations (women message first)
            addQuickResponseKeys(["Hi there!", "Love your profile!", "Tell me about..."])
        case "co.hinge.app":
            // Hinge-specific optimizations (comment-based)
            addQuickResponseKeys(["Great photo!", "I love that too!", "Where was this?"])
        default:
            // Default layout
            break
        }
    }
    
    private func addQuickResponseKeys(_ responses: [String]) {
        // Add quick response buttons to the keyboard
        // This could be implemented as a scrollable row above the main keyboard
    }
}

// MARK: - Haptic Feedback
extension AIKeyboardView {
    
    private func provideHapticFeedback(for keyType: String) {
        let feedbackGenerator: UIImpactFeedbackGenerator
        
        switch keyType {
        case "DELETE", "RETURN":
            feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
        case "SHIFT", "NUMBERS", "LETTERS":
            feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
        case "AI_SUGGESTIONS":
            feedbackGenerator = UIImpactFeedbackGenerator(style: .heavy)
        default:
            feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
        }
        
        feedbackGenerator.impactOccurred()
    }
}

