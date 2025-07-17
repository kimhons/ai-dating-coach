import UIKit

protocol AIKeyboardViewDelegate: AnyObject {
    func keyboardView(_ keyboardView: AIKeyboardView, didTapKey key: String)
    func keyboardView(_ keyboardView: AIKeyboardView, didLongPressKey key: String)
}

class AIKeyboardView: UIView {
    
    // MARK: - Properties
    weak var delegate: AIKeyboardViewDelegate?
    
    private var keyboardLayout: KeyboardLayout = .letters
    private var isShiftEnabled = false
    private var isCapsLockEnabled = false
    private var appearance: UIKeyboardAppearance = .default
    
    // UI Components
    private var stackView: UIStackView!
    private var keyButtons: [String: UIButton] = [:]
    
    // Layout Constants
    private let keySpacing: CGFloat = 6
    private let rowSpacing: CGFloat = 8
    private let keyCornerRadius: CGFloat = 6
    private let keyHeight: CGFloat = 42
    
    // Key Layouts
    private let lettersLayout = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["shift", "z", "x", "c", "v", "b", "n", "m", "delete"],
        ["numbers", "globe", "space", "return"]
    ]
    
    private let numbersLayout = [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""],
        ["symbols", ".", ",", "?", "!", "'", "delete"],
        ["letters", "globe", "space", "return"]
    ]
    
    private let symbolsLayout = [
        ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
        ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
        ["numbers", ".", ",", "?", "!", "'", "delete"],
        ["letters", "globe", "space", "return"]
    ]
    
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
        setupStackView()
        buildKeyboard()
        updateAppearance(.default)
    }
    
    private func setupStackView() {
        stackView = UIStackView()
        stackView.axis = .vertical
        stackView.distribution = .fillEqually
        stackView.spacing = rowSpacing
        stackView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            stackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            stackView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8)
        ])
    }
    
    // MARK: - Keyboard Building
    private func buildKeyboard() {
        // Clear existing views
        stackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        keyButtons.removeAll()
        
        let layout = getCurrentLayout()
        
        for row in layout {
            let rowStackView = createRowStackView()
            
            for key in row {
                let button = createKeyButton(for: key)
                keyButtons[key] = button
                rowStackView.addArrangedSubview(button)
            }
            
            stackView.addArrangedSubview(rowStackView)
        }
    }
    
    private func getCurrentLayout() -> [[String]] {
        switch keyboardLayout {
        case .letters:
            return lettersLayout
        case .numbers:
            return numbersLayout
        case .symbols:
            return symbolsLayout
        }
    }
    
    private func createRowStackView() -> UIStackView {
        let rowStack = UIStackView()
        rowStack.axis = .horizontal
        rowStack.distribution = .fillProportionally
        rowStack.spacing = keySpacing
        return rowStack
    }
    
    private func createKeyButton(for key: String) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(getDisplayText(for: key), for: .normal)
        button.titleLabel?.font = getFont(for: key)
        button.layer.cornerRadius = keyCornerRadius
        button.addTarget(self, action: #selector(keyTapped(_:)), for: .touchUpInside)
        
        // Add long press gesture
        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(keyLongPressed(_:)))
        longPress.minimumPressDuration = 0.5
        button.addGestureRecognizer(longPress)
        
        // Set button constraints
        button.heightAnchor.constraint(equalToConstant: keyHeight).isActive = true
        
        // Set width constraints for special keys
        switch key {
        case "space":
            button.widthAnchor.constraint(greaterThanOrEqualToConstant: 120).isActive = true
        case "shift", "delete":
            button.widthAnchor.constraint(equalToConstant: 60).isActive = true
        case "return":
            button.widthAnchor.constraint(equalToConstant: 80).isActive = true
        case "numbers", "letters", "symbols":
            button.widthAnchor.constraint(equalToConstant: 70).isActive = true
        case "globe":
            button.widthAnchor.constraint(equalToConstant: 50).isActive = true
        default:
            button.widthAnchor.constraint(equalToConstant: 32).isActive = true
        }
        
        updateButtonAppearance(button, for: key)
        return button
    }
    
    private func getDisplayText(for key: String) -> String {
        switch key {
        case "space":
            return "space"
        case "delete":
            return "⌫"
        case "return":
            return "return"
        case "shift":
            return isShiftEnabled ? "⇧" : "⇧"
        case "globe":
            return "🌐"
        case "numbers":
            return "123"
        case "letters":
            return "ABC"
        case "symbols":
            return "#+="
        default:
            if keyboardLayout == .letters && (isShiftEnabled || isCapsLockEnabled) {
                return key.uppercased()
            }
            return key
        }
    }
    
    private func getFont(for key: String) -> UIFont {
        switch key {
        case "space", "return", "numbers", "letters", "symbols":
            return UIFont.systemFont(ofSize: 14, weight: .medium)
        case "delete", "shift", "globe":
            return UIFont.systemFont(ofSize: 18, weight: .medium)
        default:
            return UIFont.systemFont(ofSize: 20, weight: .medium)
        }
    }
    
    private func updateButtonAppearance(_ button: UIButton, for key: String) {
        let isDarkMode = appearance == .dark
        
        // Set colors based on key type and appearance
        switch key {
        case "shift", "delete", "return", "numbers", "letters", "symbols", "globe":
            // Special keys
            button.backgroundColor = isDarkMode ? UIColor.systemGray2 : UIColor.systemGray5
            button.setTitleColor(isDarkMode ? UIColor.white : UIColor.black, for: .normal)
        case "space":
            // Space bar
            button.backgroundColor = isDarkMode ? UIColor.systemGray3 : UIColor.systemGray6
            button.setTitleColor(isDarkMode ? UIColor.lightGray : UIColor.darkGray, for: .normal)
        default:
            // Regular keys
            button.backgroundColor = isDarkMode ? UIColor.systemGray4 : UIColor.white
            button.setTitleColor(isDarkMode ? UIColor.white : UIColor.black, for: .normal)
            
            // Add border for light mode
            if !isDarkMode {
                button.layer.borderWidth = 0.5
                button.layer.borderColor = UIColor.systemGray4.cgColor
            } else {
                button.layer.borderWidth = 0
            }
        }
        
        // Highlight shift key when enabled
        if key == "shift" && (isShiftEnabled || isCapsLockEnabled) {
            button.backgroundColor = isDarkMode ? UIColor.systemBlue : UIColor.systemBlue
            button.setTitleColor(UIColor.white, for: .normal)
        }
    }
    
    // MARK: - Actions
    @objc private func keyTapped(_ sender: UIButton) {
        guard let key = keyButtons.first(where: { $0.value == sender })?.key else { return }
        
        // Add visual feedback
        animateKeyPress(sender)
        
        // Handle special key logic
        switch key {
        case "shift":
            handleShiftKey()
        case "numbers":
            showNumbersKeyboard()
        case "letters":
            showLettersKeyboard()
        case "symbols":
            showSymbolsKeyboard()
        default:
            delegate?.keyboardView(self, didTapKey: key)
            
            // Auto-disable shift after typing (except for caps lock)
            if keyboardLayout == .letters && isShiftEnabled && !isCapsLockEnabled {
                isShiftEnabled = false
                updateShiftKey()
            }
        }
    }
    
    @objc private func keyLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began,
              let button = gesture.view as? UIButton,
              let key = keyButtons.first(where: { $0.value == button })?.key else { return }
        
        // Add stronger visual feedback for long press
        animateKeyLongPress(button)
        
        // Handle long press actions
        switch key {
        case "shift":
            // Toggle caps lock
            isCapsLockEnabled.toggle()
            isShiftEnabled = isCapsLockEnabled
            updateShiftKey()
        default:
            delegate?.keyboardView(self, didLongPressKey: key)
        }
    }
    
    // MARK: - Keyboard Layout Management
    func showLettersKeyboard() {
        keyboardLayout = .letters
        buildKeyboard()
    }
    
    func showNumbersKeyboard() {
        keyboardLayout = .numbers
        buildKeyboard()
    }
    
    func showSymbolsKeyboard() {
        keyboardLayout = .symbols
        buildKeyboard()
    }
    
    func toggleShift() {
        guard keyboardLayout == .letters else { return }
        isShiftEnabled.toggle()
        updateShiftKey()
        updateLetterKeys()
    }
    
    private func handleShiftKey() {
        guard keyboardLayout == .letters else { return }
        
        if isCapsLockEnabled {
            // Disable caps lock
            isCapsLockEnabled = false
            isShiftEnabled = false
        } else {
            // Toggle shift
            isShiftEnabled.toggle()
        }
        
        updateShiftKey()
        updateLetterKeys()
    }
    
    private func updateShiftKey() {
        guard let shiftButton = keyButtons["shift"] else { return }
        shiftButton.setTitle(getDisplayText(for: "shift"), for: .normal)
        updateButtonAppearance(shiftButton, for: "shift")
    }
    
    private func updateLetterKeys() {
        for (key, button) in keyButtons {
            if key.count == 1 && key.rangeOfCharacter(from: .letters) != nil {
                button.setTitle(getDisplayText(for: key), for: .normal)
            }
        }
    }
    
    // MARK: - Appearance
    func updateAppearance(_ appearance: UIKeyboardAppearance) {
        self.appearance = appearance
        
        let isDarkMode = appearance == .dark
        backgroundColor = isDarkMode ? UIColor.systemGray6 : UIColor.systemBackground
        
        // Update all button appearances
        for (key, button) in keyButtons {
            updateButtonAppearance(button, for: key)
        }
    }
    
    // MARK: - Animations
    private func animateKeyPress(_ button: UIButton) {
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
    
    private func animateKeyLongPress(_ button: UIButton) {
        UIView.animate(withDuration: 0.2, animations: {
            button.transform = CGAffineTransform(scaleX: 0.9, y: 0.9)
            button.alpha = 0.5
        }) { _ in
            UIView.animate(withDuration: 0.3) {
                button.transform = .identity
                button.alpha = 1.0
            }
        }
    }
}

// MARK: - Supporting Types
enum KeyboardLayout {
    case letters
    case numbers
    case symbols
}

