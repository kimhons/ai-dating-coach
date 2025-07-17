package com.aidatingcoach.keyboard;

import android.content.Context;
import android.content.SharedPreferences;
import android.inputmethodservice.InputMethodService;
import android.inputmethodservice.Keyboard;
import android.inputmethodservice.KeyboardView;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.widget.Toast;

import com.aidatingcoach.R;
import com.aidatingcoach.services.TierService;
import com.aidatingcoach.services.AnalyticsService;
import com.aidatingcoach.services.SyncService;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AIKeyboardService extends InputMethodService implements KeyboardView.OnKeyboardActionListener {
    
    // Constants
    private static final int KEYCODE_DELETE = -5;
    private static final int KEYCODE_SHIFT = -1;
    private static final int KEYCODE_MODE_CHANGE = -2;
    private static final int KEYCODE_ENTER = -4;
    private static final int KEYCODE_SPACE = 32;
    private static final int KEYCODE_DONE = -3;
    
    private static final int SUGGESTION_THROTTLE_MS = 1000;
    private static final int MIN_TEXT_LENGTH_FOR_SUGGESTIONS = 3;
    private static final int MAX_SUGGESTIONS = 3;
    
    // UI Components
    private KeyboardView keyboardView;
    private SuggestionBarView suggestionBar;
    private Keyboard currentKeyboard;
    private Keyboard qwertyKeyboard;
    private Keyboard symbolsKeyboard;
    private Keyboard numbersKeyboard;
    
    // State
    private boolean isShiftPressed = false;
    private boolean isCapsLockEnabled = false;
    private boolean isSymbolsMode = false;
    private boolean isNumbersMode = false;
    private StringBuilder currentText = new StringBuilder();
    private long lastSuggestionTime = 0;
    private boolean isGeneratingSuggestions = false;
    
    // Services
    private TierService tierService;
    private AnalyticsService analyticsService;
    private SyncService syncService;
    private AIKeyboardSuggestionService suggestionService;
    
    // Threading
    private ExecutorService executorService;
    private Handler mainHandler;
    
    // Preferences
    private SharedPreferences preferences;
    private boolean isHapticEnabled = true;
    private boolean isDarkMode = false;
    private int suggestionCount = 3;
    
    @Override
    public void onCreate() {
        super.onCreate();
        initializeServices();
        initializeKeyboards();
        loadPreferences();
        setupThreading();
    }
    
    @Override
    public View onCreateInputView() {
        View inputView = getLayoutInflater().inflate(R.layout.keyboard_layout, null);
        
        keyboardView = inputView.findViewById(R.id.keyboard_view);
        suggestionBar = inputView.findViewById(R.id.suggestion_bar);
        
        setupKeyboardView();
        setupSuggestionBar();
        
        return inputView;
    }
    
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        
        // Reset state
        currentText.setLength(0);
        isShiftPressed = false;
        isCapsLockEnabled = false;
        
        // Set appropriate keyboard based on input type
        setKeyboardBasedOnInputType(info);
        
        // Check tier access
        checkTierAccess();
        
        // Track keyboard session start
        analyticsService.trackEvent("keyboard_session_start", null);
    }
    
    @Override
    public void onFinishInputView(boolean finishingInput) {
        super.onFinishInputView(finishingInput);
        
        // Save typing session
        saveTypingSession();
        
        // Clear suggestions
        suggestionBar.clearSuggestions();
        
        // Track keyboard session end
        analyticsService.trackEvent("keyboard_session_end", null);
    }
    
    // MARK: - Initialization
    private void initializeServices() {
        tierService = TierService.getInstance(this);
        analyticsService = AnalyticsService.getInstance(this);
        syncService = SyncService.getInstance(this);
        suggestionService = new AIKeyboardSuggestionService(this);
    }
    
    private void initializeKeyboards() {
        qwertyKeyboard = new Keyboard(this, R.xml.keyboard_qwerty);
        symbolsKeyboard = new Keyboard(this, R.xml.keyboard_symbols);
        numbersKeyboard = new Keyboard(this, R.xml.keyboard_numbers);
        currentKeyboard = qwertyKeyboard;
    }
    
    private void loadPreferences() {
        preferences = getSharedPreferences("keyboard_preferences", Context.MODE_PRIVATE);
        isHapticEnabled = preferences.getBoolean("haptic_enabled", true);
        isDarkMode = preferences.getBoolean("dark_mode", false);
        suggestionCount = preferences.getInt("suggestion_count", 3);
    }
    
    private void setupThreading() {
        executorService = Executors.newCachedThreadPool();
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    private void setupKeyboardView() {
        keyboardView.setOnKeyboardActionListener(this);
        keyboardView.setKeyboard(currentKeyboard);
        keyboardView.setPreviewEnabled(false);
        updateKeyboardAppearance();
    }
    
    private void setupSuggestionBar() {
        suggestionBar.setOnSuggestionClickListener(new SuggestionBarView.OnSuggestionClickListener() {
            @Override
            public void onSuggestionClick(String suggestion) {
                handleSuggestionSelection(suggestion);
            }
            
            @Override
            public void onUpgradeClick() {
                handleUpgradeRequest();
            }
        });
        
        suggestionBar.updateAppearance(isDarkMode);
    }
    
    // MARK: - Keyboard Management
    private void setKeyboardBasedOnInputType(EditorInfo info) {
        int inputType = info.inputType & EditorInfo.TYPE_MASK_CLASS;
        
        switch (inputType) {
            case EditorInfo.TYPE_CLASS_NUMBER:
                setKeyboard(numbersKeyboard);
                isNumbersMode = true;
                isSymbolsMode = false;
                break;
            case EditorInfo.TYPE_CLASS_PHONE:
                setKeyboard(numbersKeyboard);
                isNumbersMode = true;
                isSymbolsMode = false;
                break;
            default:
                setKeyboard(qwertyKeyboard);
                isNumbersMode = false;
                isSymbolsMode = false;
                break;
        }
    }
    
    private void setKeyboard(Keyboard keyboard) {
        currentKeyboard = keyboard;
        if (keyboardView != null) {
            keyboardView.setKeyboard(keyboard);
            updateKeyboardAppearance();
        }
    }
    
    private void updateKeyboardAppearance() {
        if (keyboardView != null) {
            // Update keyboard appearance based on dark mode
            if (isDarkMode) {
                keyboardView.setBackgroundResource(R.drawable.keyboard_background_dark);
            } else {
                keyboardView.setBackgroundResource(R.drawable.keyboard_background_light);
            }
        }
    }
    
    // MARK: - KeyboardView.OnKeyboardActionListener Implementation
    @Override
    public void onKey(int primaryCode, int[] keyCodes) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        // Perform haptic feedback
        if (isHapticEnabled) {
            keyboardView.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);
        }
        
        switch (primaryCode) {
            case KEYCODE_DELETE:
                handleDeleteKey(ic);
                break;
            case KEYCODE_SHIFT:
                handleShiftKey();
                break;
            case KEYCODE_MODE_CHANGE:
                handleModeChangeKey();
                break;
            case KEYCODE_ENTER:
                handleEnterKey(ic);
                break;
            case KEYCODE_SPACE:
                handleSpaceKey(ic);
                break;
            case KEYCODE_DONE:
                handleDoneKey();
                break;
            default:
                handleCharacterKey(ic, primaryCode);
                break;
        }
        
        // Track key press
        analyticsService.trackEvent("keyboard_key_pressed", 
            createKeyPressParams(primaryCode));
        
        // Update suggestions if needed
        updateSuggestionsIfNeeded();
    }
    
    @Override
    public void onPress(int primaryCode) {
        // Visual feedback handled by KeyboardView
    }
    
    @Override
    public void onRelease(int primaryCode) {
        // No action needed
    }
    
    @Override
    public void onText(CharSequence text) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.commitText(text, 1);
            updateCurrentText(text.toString());
        }
    }
    
    @Override
    public void swipeDown() {
        // Hide keyboard
        requestHideSelf(0);
    }
    
    @Override
    public void swipeLeft() {
        // Delete word
        handleDeleteWord();
    }
    
    @Override
    public void swipeRight() {
        // Switch to next keyboard
        handleModeChangeKey();
    }
    
    @Override
    public void swipeUp() {
        // Show suggestions
        generateSuggestions();
    }
    
    // MARK: - Key Handling Methods
    private void handleDeleteKey(InputConnection ic) {
        CharSequence selectedText = ic.getSelectedText(0);
        if (TextUtils.isEmpty(selectedText)) {
            ic.deleteSurroundingText(1, 0);
            if (currentText.length() > 0) {
                currentText.deleteCharAt(currentText.length() - 1);
            }
        } else {
            ic.commitText("", 1);
            // Update current text by removing selected portion
            updateCurrentTextFromInput(ic);
        }
    }
    
    private void handleDeleteWord() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        CharSequence beforeCursor = ic.getTextBeforeCursor(100, 0);
        if (beforeCursor != null) {
            String text = beforeCursor.toString();
            int lastSpace = text.lastIndexOf(' ');
            int deleteCount = text.length() - lastSpace - 1;
            if (deleteCount > 0) {
                ic.deleteSurroundingText(deleteCount, 0);
                // Update current text
                if (currentText.length() >= deleteCount) {
                    currentText.delete(currentText.length() - deleteCount, currentText.length());
                }
            }
        }
    }
    
    private void handleShiftKey() {
        if (currentKeyboard == qwertyKeyboard) {
            isShiftPressed = !isShiftPressed;
            currentKeyboard.setShifted(isShiftPressed);
            keyboardView.invalidateAllKeys();
        }
    }
    
    private void handleModeChangeKey() {
        if (currentKeyboard == qwertyKeyboard) {
            setKeyboard(symbolsKeyboard);
            isSymbolsMode = true;
        } else if (currentKeyboard == symbolsKeyboard) {
            setKeyboard(numbersKeyboard);
            isSymbolsMode = false;
            isNumbersMode = true;
        } else {
            setKeyboard(qwertyKeyboard);
            isSymbolsMode = false;
            isNumbersMode = false;
        }
    }
    
    private void handleEnterKey(InputConnection ic) {
        ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER));
        ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER));
        currentText.append("\\n");
    }
    
    private void handleSpaceKey(InputConnection ic) {
        ic.commitText(" ", 1);
        currentText.append(" ");
        
        // Auto-disable shift after space
        if (isShiftPressed && !isCapsLockEnabled) {
            isShiftPressed = false;
            currentKeyboard.setShifted(false);
            keyboardView.invalidateAllKeys();
        }
    }
    
    private void handleDoneKey() {
        requestHideSelf(0);
    }
    
    private void handleCharacterKey(InputConnection ic, int primaryCode) {
        char code = (char) primaryCode;
        
        if (Character.isLetter(code) && isShiftPressed) {
            code = Character.toUpperCase(code);
        }
        
        ic.commitText(String.valueOf(code), 1);
        currentText.append(code);
        
        // Auto-disable shift after typing (except for caps lock)
        if (isShiftPressed && !isCapsLockEnabled && currentKeyboard == qwertyKeyboard) {
            isShiftPressed = false;
            currentKeyboard.setShifted(false);
            keyboardView.invalidateAllKeys();
        }
    }
    
    // MARK: - Suggestion Management
    private void updateSuggestionsIfNeeded() {
        if (currentText.length() >= MIN_TEXT_LENGTH_FOR_SUGGESTIONS) {
            long now = System.currentTimeMillis();
            if (now - lastSuggestionTime >= SUGGESTION_THROTTLE_MS) {
                generateSuggestions();
            }
        } else {
            suggestionBar.clearSuggestions();
        }
    }
    
    private void generateSuggestions() {
        if (isGeneratingSuggestions) return;
        
        lastSuggestionTime = System.currentTimeMillis();
        
        executorService.execute(() -> {
            try {
                // Check tier access
                boolean hasAccess = tierService.checkFeatureAccess(TierService.Feature.KEYBOARD_SUGGESTIONS);
                if (!hasAccess) {
                    mainHandler.post(() -> suggestionBar.showUpgradePrompt("Upgrade for AI suggestions"));
                    return;
                }
                
                isGeneratingSuggestions = true;
                mainHandler.post(() -> suggestionBar.showLoading());
                
                // Track usage
                tierService.trackUsage(TierService.Feature.KEYBOARD_SUGGESTIONS);
                
                // Get conversation context
                ConversationContext context = getConversationContext();
                
                // Generate AI suggestions
                List<AISuggestion> suggestions = suggestionService.generateSuggestions(
                    currentText.toString(), context, suggestionCount);
                
                // Update UI on main thread
                mainHandler.post(() -> {
                    suggestionBar.setSuggestions(suggestions);
                    isGeneratingSuggestions = false;
                });
                
                // Track analytics
                analyticsService.trackEvent("keyboard_suggestions_generated", 
                    createSuggestionParams(suggestions.size()));
                
            } catch (Exception e) {
                mainHandler.post(() -> {
                    suggestionBar.showError("Unable to generate suggestions");
                    isGeneratingSuggestions = false;
                });
                
                analyticsService.trackEvent("keyboard_suggestion_error", 
                    createErrorParams(e.getMessage()));
            }
        });
    }
    
    private void handleSuggestionSelection(String suggestion) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        // Replace current word with suggestion
        replaceCurrentWordWith(ic, suggestion);
        
        // Track usage
        analyticsService.trackEvent("keyboard_suggestion_used", 
            createSuggestionUsageParams(suggestion));
        
        // Update tier usage
        executorService.execute(() -> {
            try {
                tierService.trackUsage(TierService.Feature.KEYBOARD_SUGGESTIONS);
            } catch (Exception e) {
                // Log error but don't interrupt user experience
            }
        });
        
        // Clear suggestions
        suggestionBar.clearSuggestions();
    }
    
    private void replaceCurrentWordWith(InputConnection ic, String suggestion) {
        // Get text before cursor
        CharSequence beforeCursor = ic.getTextBeforeCursor(100, 0);
        if (beforeCursor != null) {
            String text = beforeCursor.toString();
            
            // Find last word
            int lastSpace = text.lastIndexOf(' ');
            String lastWord = text.substring(lastSpace + 1);
            
            if (!lastWord.isEmpty()) {
                // Delete the last word
                ic.deleteSurroundingText(lastWord.length(), 0);
                
                // Update current text
                if (currentText.length() >= lastWord.length()) {
                    currentText.delete(currentText.length() - lastWord.length(), currentText.length());
                }
            }
        }
        
        // Insert suggestion
        ic.commitText(suggestion + " ", 1);
        currentText.append(suggestion).append(" ");
    }
    
    // MARK: - Context Detection
    private ConversationContext getConversationContext() {
        // Get current app package name
        String packageName = getCurrentInputEditorInfo().packageName;
        DatingPlatform platform = detectDatingPlatform(packageName);
        
        return new ConversationContext(
            platform,
            packageName,
            ConversationType.MESSAGE,
            extractPreviousMessages()
        );
    }
    
    private DatingPlatform detectDatingPlatform(String packageName) {
        if (packageName == null) return DatingPlatform.UNKNOWN;
        
        String lowerPackage = packageName.toLowerCase();
        if (lowerPackage.contains("tinder")) return DatingPlatform.TINDER;
        if (lowerPackage.contains("bumble")) return DatingPlatform.BUMBLE;
        if (lowerPackage.contains("hinge")) return DatingPlatform.HINGE;
        if (lowerPackage.contains("match")) return DatingPlatform.MATCH;
        
        return DatingPlatform.UNKNOWN;
    }
    
    private List<String> extractPreviousMessages() {
        // This would require more complex text analysis
        // For now, return empty list
        return new ArrayList<>();
    }
    
    // MARK: - Tier Management
    private void checkTierAccess() {
        executorService.execute(() -> {
            try {
                boolean hasAccess = tierService.checkFeatureAccess(TierService.Feature.KEYBOARD_SUGGESTIONS);
                mainHandler.post(() -> {
                    suggestionBar.setTierAccess(hasAccess);
                    if (!hasAccess) {
                        suggestionBar.showUpgradePrompt("Upgrade to Premium for unlimited AI suggestions");
                    }
                });
            } catch (Exception e) {
                // Log error but don't interrupt user experience
            }
        });
    }
    
    private void handleUpgradeRequest() {
        // Open main app to upgrade screen
        try {
            Intent intent = new Intent();
            intent.setAction("com.aidatingcoach.UPGRADE");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            
            analyticsService.trackEvent("keyboard_upgrade_requested", null);
        } catch (Exception e) {
            Toast.makeText(this, "Please open AI Dating Coach app to upgrade", Toast.LENGTH_SHORT).show();
        }
    }
    
    // MARK: - Utility Methods
    private void updateCurrentText(String text) {
        currentText.append(text);
    }
    
    private void updateCurrentTextFromInput(InputConnection ic) {
        CharSequence beforeCursor = ic.getTextBeforeCursor(1000, 0);
        if (beforeCursor != null) {
            currentText.setLength(0);
            currentText.append(beforeCursor);
        }
    }
    
    private void saveTypingSession() {
        TypingSession session = new TypingSession(
            System.currentTimeMillis(),
            currentText.length(),
            suggestionBar.getSuggestionsUsedCount(),
            getConversationContext().getPlatform().name()
        );
        
        analyticsService.trackTypingSession(session);
    }
    
    // MARK: - Analytics Helper Methods
    private Bundle createKeyPressParams(int keyCode) {
        Bundle params = new Bundle();
        params.putInt("key_code", keyCode);
        params.putString("keyboard_mode", getCurrentKeyboardMode());
        return params;
    }
    
    private Bundle createSuggestionParams(int count) {
        Bundle params = new Bundle();
        params.putInt("suggestion_count", count);
        params.putInt("text_length", currentText.length());
        return params;
    }
    
    private Bundle createSuggestionUsageParams(String suggestion) {
        Bundle params = new Bundle();
        params.putString("suggestion", suggestion);
        params.putString("original_text", currentText.toString());
        return params;
    }
    
    private Bundle createErrorParams(String error) {
        Bundle params = new Bundle();
        params.putString("error", error);
        return params;
    }
    
    private String getCurrentKeyboardMode() {
        if (isNumbersMode) return "numbers";
        if (isSymbolsMode) return "symbols";
        return "letters";
    }
    
    // MARK: - Cleanup
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (executorService != null) {
            executorService.shutdown();
        }
    }
}

