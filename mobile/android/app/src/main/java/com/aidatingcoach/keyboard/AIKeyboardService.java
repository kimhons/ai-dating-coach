/**
 * AI Dating Coach - Android Keyboard Service
 * Custom keyboard with real-time AI coaching and message suggestions
 */

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
import android.view.LayoutInflater;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.aidatingcoach.R;
import com.aidatingcoach.keyboard.adapters.SuggestionAdapter;
import com.aidatingcoach.keyboard.models.MessageSuggestion;
import com.aidatingcoach.keyboard.models.SuggestionTone;
import com.aidatingcoach.keyboard.services.AICoachingService;
import com.aidatingcoach.keyboard.utils.AppDetector;
import com.aidatingcoach.keyboard.utils.HapticFeedbackHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AIKeyboardService extends InputMethodService implements KeyboardView.OnKeyboardActionListener {
    
    // Constants
    private static final String PREFS_NAME = "AIKeyboardPrefs";
    private static final String PREF_SUGGESTIONS_ENABLED = "suggestions_enabled";
    private static final String PREF_HAPTIC_ENABLED = "haptic_enabled";
    private static final String PREF_AUTO_ANALYSIS = "auto_analysis";
    
    private static final int ANALYSIS_DELAY_MS = 1000; // Delay before analyzing text
    private static final int MIN_WORDS_FOR_ANALYSIS = 3;
    
    // Keyboard components
    private KeyboardView keyboardView;
    private Keyboard qwertyKeyboard;
    private Keyboard numbersKeyboard;
    private Keyboard symbolsKeyboard;
    
    // Suggestion components
    private RecyclerView suggestionRecyclerView;
    private SuggestionAdapter suggestionAdapter;
    private LinearLayout suggestionContainer;
    private View loadingIndicator;
    
    // State management
    private boolean isShiftPressed = false;
    private boolean isCapsLockOn = false;
    private boolean isNumbersMode = false;
    private boolean isSymbolsMode = false;
    private boolean isSuggestionsEnabled = true;
    private boolean isAnalyzing = false;
    
    // Text analysis
    private String currentContext = "";
    private List<MessageSuggestion> currentSuggestions = new ArrayList<>();
    private Handler analysisHandler = new Handler(Looper.getMainLooper());
    private Runnable analysisRunnable;
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    
    // Services
    private AICoachingService aiCoachingService;
    private AppDetector appDetector;
    private HapticFeedbackHelper hapticHelper;
    private SharedPreferences preferences;
    
    @Override
    public void onCreate() {
        super.onCreate();
        initializeServices();
        loadPreferences();
    }
    
    @Override
    public View onCreateInputView() {
        View inputView = LayoutInflater.from(this).inflate(R.layout.keyboard_layout, null);
        setupKeyboardView(inputView);
        setupSuggestionView(inputView);
        return inputView;
    }
    
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        updateKeyboardForInputType(info);
        detectCurrentApp();
        clearSuggestions();
    }
    
    @Override
    public void onFinishInputView(boolean finishingInput) {
        super.onFinishInputView(finishingInput);
        cancelPendingAnalysis();
    }
    
    // MARK: - Initialization
    private void initializeServices() {
        aiCoachingService = new AICoachingService(this);
        appDetector = new AppDetector(this);
        hapticHelper = new HapticFeedbackHelper(this);
        preferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    private void loadPreferences() {
        isSuggestionsEnabled = preferences.getBoolean(PREF_SUGGESTIONS_ENABLED, true);
        hapticHelper.setEnabled(preferences.getBoolean(PREF_HAPTIC_ENABLED, true));
    }
    
    private void setupKeyboardView(View inputView) {
        keyboardView = inputView.findViewById(R.id.keyboard_view);
        keyboardView.setOnKeyboardActionListener(this);
        keyboardView.setPreviewEnabled(false);
        
        // Initialize keyboards
        qwertyKeyboard = new Keyboard(this, R.xml.keyboard_qwerty);
        numbersKeyboard = new Keyboard(this, R.xml.keyboard_numbers);
        symbolsKeyboard = new Keyboard(this, R.xml.keyboard_symbols);
        
        // Set default keyboard
        keyboardView.setKeyboard(qwertyKeyboard);
    }
    
    private void setupSuggestionView(View inputView) {
        suggestionContainer = inputView.findViewById(R.id.suggestion_container);
        suggestionRecyclerView = inputView.findViewById(R.id.suggestion_recycler_view);
        loadingIndicator = inputView.findViewById(R.id.loading_indicator);
        
        // Setup RecyclerView
        suggestionRecyclerView.setLayoutManager(
            new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        );
        
        suggestionAdapter = new SuggestionAdapter(new SuggestionAdapter.OnSuggestionClickListener() {
            @Override
            public void onSuggestionClick(MessageSuggestion suggestion) {
                insertSuggestion(suggestion);
            }
            
            @Override
            public void onMoreSuggestionsClick() {
                requestMoreSuggestions();
            }
        });
        
        suggestionRecyclerView.setAdapter(suggestionAdapter);
        
        // Initially hide suggestions
        updateSuggestionVisibility();
    }
    
    // MARK: - Keyboard Management
    private void updateKeyboardForInputType(EditorInfo info) {
        int inputType = info.inputType & EditorInfo.TYPE_MASK_CLASS;
        
        switch (inputType) {
            case EditorInfo.TYPE_CLASS_NUMBER:
                keyboardView.setKeyboard(numbersKeyboard);
                isNumbersMode = true;
                break;
            case EditorInfo.TYPE_CLASS_PHONE:
                keyboardView.setKeyboard(numbersKeyboard);
                isNumbersMode = true;
                break;
            default:
                keyboardView.setKeyboard(qwertyKeyboard);
                isNumbersMode = false;
                isSymbolsMode = false;
                break;
        }
        
        updateReturnKeyLabel(info);
    }
    
    private void updateReturnKeyLabel(EditorInfo info) {
        // Update return key based on IME action
        int imeAction = info.imeOptions & EditorInfo.IME_MASK_ACTION;
        
        // This would require custom keyboard XML with dynamic key labels
        // For now, we'll handle it in the key press logic
    }
    
    private void switchToQwertyKeyboard() {
        keyboardView.setKeyboard(qwertyKeyboard);
        isNumbersMode = false;
        isSymbolsMode = false;
    }
    
    private void switchToNumbersKeyboard() {
        keyboardView.setKeyboard(numbersKeyboard);
        isNumbersMode = true;
        isSymbolsMode = false;
    }
    
    private void switchToSymbolsKeyboard() {
        keyboardView.setKeyboard(symbolsKeyboard);
        isNumbersMode = false;
        isSymbolsMode = true;
    }
    
    // MARK: - KeyboardView.OnKeyboardActionListener Implementation
    @Override
    public void onKey(int primaryCode, int[] keyCodes) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        hapticHelper.performHapticFeedback();
        
        switch (primaryCode) {
            case Keyboard.KEYCODE_DELETE:
                handleDeleteKey(ic);
                break;
            case Keyboard.KEYCODE_SHIFT:
                handleShiftKey();
                break;
            case Keyboard.KEYCODE_DONE:
                handleDoneKey(ic);
                break;
            case Keyboard.KEYCODE_MODE_CHANGE:
                handleModeChangeKey();
                break;
            case -1: // Custom AI suggestions key
                toggleSuggestions();
                break;
            case -2: // Custom numbers key
                switchToNumbersKeyboard();
                break;
            case -3: // Custom symbols key
                switchToSymbolsKeyboard();
                break;
            case -4: // Custom letters key
                switchToQwertyKeyboard();
                break;
            default:
                handleCharacterKey(ic, primaryCode);
                break;
        }
        
        // Trigger text analysis after key press
        scheduleTextAnalysis();
    }
    
    @Override
    public void onPress(int primaryCode) {
        // Visual feedback for key press
    }
    
    @Override
    public void onRelease(int primaryCode) {
        // Visual feedback for key release
    }
    
    @Override
    public void onText(CharSequence text) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.commitText(text, 1);
        }
    }
    
    @Override
    public void swipeDown() {
        // Handle swipe down gesture
    }
    
    @Override
    public void swipeLeft() {
        // Handle swipe left gesture
    }
    
    @Override
    public void swipeRight() {
        // Handle swipe right gesture
    }
    
    @Override
    public void swipeUp() {
        // Handle swipe up gesture
    }
    
    // MARK: - Key Handling Methods
    private void handleDeleteKey(InputConnection ic) {
        CharSequence selectedText = ic.getSelectedText(0);
        if (TextUtils.isEmpty(selectedText)) {
            ic.deleteSurroundingText(1, 0);
        } else {
            ic.commitText("", 1);
        }
    }
    
    private void handleShiftKey() {
        if (isShiftPressed) {
            // Double tap for caps lock
            isCapsLockOn = !isCapsLockOn;
            isShiftPressed = false;
        } else {
            isShiftPressed = true;
        }
        
        updateKeyboardShiftState();
    }
    
    private void handleDoneKey(InputConnection ic) {
        EditorInfo ei = getCurrentInputEditorInfo();
        if (ei != null) {
            int imeAction = ei.imeOptions & EditorInfo.IME_MASK_ACTION;
            
            switch (imeAction) {
                case EditorInfo.IME_ACTION_SEND:
                    ic.performEditorAction(EditorInfo.IME_ACTION_SEND);
                    break;
                case EditorInfo.IME_ACTION_SEARCH:
                    ic.performEditorAction(EditorInfo.IME_ACTION_SEARCH);
                    break;
                case EditorInfo.IME_ACTION_GO:
                    ic.performEditorAction(EditorInfo.IME_ACTION_GO);
                    break;
                default:
                    ic.commitText("\\n", 1);
                    break;
            }
        } else {
            ic.commitText("\\n", 1);
        }
    }
    
    private void handleModeChangeKey() {
        if (isNumbersMode) {
            switchToQwertyKeyboard();
        } else {
            switchToNumbersKeyboard();
        }
    }
    
    private void handleCharacterKey(InputConnection ic, int primaryCode) {
        char code = (char) primaryCode;
        
        if (Character.isLetter(code)) {
            if (isShiftPressed || isCapsLockOn) {
                code = Character.toUpperCase(code);
            } else {
                code = Character.toLowerCase(code);
            }
            
            // Reset shift after use (unless caps lock is on)
            if (isShiftPressed && !isCapsLockOn) {
                isShiftPressed = false;
                updateKeyboardShiftState();
            }
        }
        
        ic.commitText(String.valueOf(code), 1);
    }
    
    private void updateKeyboardShiftState() {
        // Update keyboard visual state for shift/caps lock
        keyboardView.setShifted(isShiftPressed || isCapsLockOn);
    }
    
    // MARK: - Text Analysis
    private void scheduleTextAnalysis() {
        if (!isSuggestionsEnabled || isAnalyzing) return;
        
        // Cancel previous analysis
        cancelPendingAnalysis();
        
        // Schedule new analysis
        analysisRunnable = new Runnable() {
            @Override
            public void run() {
                performTextAnalysis();
            }
        };
        
        analysisHandler.postDelayed(analysisRunnable, ANALYSIS_DELAY_MS);
    }
    
    private void cancelPendingAnalysis() {
        if (analysisRunnable != null) {
            analysisHandler.removeCallbacks(analysisRunnable);
            analysisRunnable = null;
        }
    }
    
    private void performTextAnalysis() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        // Get current text context
        CharSequence beforeCursor = ic.getTextBeforeCursor(200, 0);
        CharSequence afterCursor = ic.getTextAfterCursor(50, 0);
        
        if (beforeCursor == null) beforeCursor = "";
        if (afterCursor == null) afterCursor = "";
        
        currentContext = beforeCursor.toString();
        
        // Check if we have enough context for analysis
        if (!shouldAnalyzeContext(currentContext)) {
            clearSuggestions();
            return;
        }
        
        // Perform AI analysis
        isAnalyzing = true;
        showLoadingState();
        
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                analyzeConversationContext();
            }
        });
    }
    
    private boolean shouldAnalyzeContext(String context) {
        if (TextUtils.isEmpty(context)) return false;
        
        String[] words = context.trim().split("\\\\s+");
        return words.length >= MIN_WORDS_FOR_ANALYSIS;
    }
    
    private void analyzeConversationContext() {
        String platform = appDetector.getCurrentDatingApp();
        
        aiCoachingService.analyzeConversation(currentContext, platform, new AICoachingService.AnalysisCallback() {
            @Override
            public void onSuccess(List<MessageSuggestion> suggestions) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        handleAnalysisSuccess(suggestions);
                    }
                });
            }
            
            @Override
            public void onError(String error) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        handleAnalysisError(error);
                    }
                });
            }
        });
    }
    
    private void handleAnalysisSuccess(List<MessageSuggestion> suggestions) {
        isAnalyzing = false;
        hideLoadingState();
        
        currentSuggestions = suggestions;
        updateSuggestions(suggestions);
        
        // Provide haptic feedback for new suggestions
        hapticHelper.performSuggestionFeedback();
    }
    
    private void handleAnalysisError(String error) {
        isAnalyzing = false;
        hideLoadingState();
        
        // Show fallback suggestions
        showFallbackSuggestions();
    }
    
    // MARK: - Suggestion Management
    private void updateSuggestions(List<MessageSuggestion> suggestions) {
        suggestionAdapter.updateSuggestions(suggestions);
        updateSuggestionVisibility();
    }
    
    private void clearSuggestions() {
        currentSuggestions.clear();
        suggestionAdapter.clearSuggestions();
        updateSuggestionVisibility();
    }
    
    private void showFallbackSuggestions() {
        List<MessageSuggestion> fallbackSuggestions = new ArrayList<>();
        
        fallbackSuggestions.add(new MessageSuggestion(
            "That sounds interesting! Tell me more.",
            SuggestionTone.CASUAL,
            8.0,
            "Shows interest and encourages continuation"
        ));
        
        fallbackSuggestions.add(new MessageSuggestion(
            "I'd love to hear about that!",
            SuggestionTone.ENTHUSIASTIC,
            7.5,
            "Enthusiastic response that invites sharing"
        ));
        
        fallbackSuggestions.add(new MessageSuggestion(
            "What's your favorite part about it?",
            SuggestionTone.THOUGHTFUL,
            8.5,
            "Thoughtful question that shows genuine interest"
        ));
        
        updateSuggestions(fallbackSuggestions);
    }
    
    private void insertSuggestion(MessageSuggestion suggestion) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        
        // Insert the suggestion text
        ic.commitText(suggestion.getText(), 1);
        
        // Track usage
        aiCoachingService.trackSuggestionUsage(suggestion, appDetector.getCurrentDatingApp());
        
        // Provide haptic feedback
        hapticHelper.performSelectionFeedback();
        
        // Clear suggestions after use
        clearSuggestions();
    }
    
    private void requestMoreSuggestions() {
        if (isAnalyzing) return;
        
        isAnalyzing = true;
        showLoadingState();
        
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                aiCoachingService.generateMoreSuggestions(
                    currentContext,
                    appDetector.getCurrentDatingApp(),
                    currentSuggestions,
                    new AICoachingService.AnalysisCallback() {
                        @Override
                        public void onSuccess(List<MessageSuggestion> suggestions) {
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    handleMoreSuggestionsSuccess(suggestions);
                                }
                            });
                        }
                        
                        @Override
                        public void onError(String error) {
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    handleAnalysisError(error);
                                }
                            });
                        }
                    }
                );
            }
        });
    }
    
    private void handleMoreSuggestionsSuccess(List<MessageSuggestion> newSuggestions) {
        isAnalyzing = false;
        hideLoadingState();
        
        // Add new suggestions to existing ones
        currentSuggestions.addAll(newSuggestions);
        updateSuggestions(currentSuggestions);
    }
    
    private void toggleSuggestions() {
        isSuggestionsEnabled = !isSuggestionsEnabled;
        
        // Save preference
        preferences.edit()
            .putBoolean(PREF_SUGGESTIONS_ENABLED, isSuggestionsEnabled)
            .apply();
        
        updateSuggestionVisibility();
        
        // Show toast feedback
        String message = isSuggestionsEnabled ? "AI suggestions enabled" : "AI suggestions disabled";
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
    
    // MARK: - UI Updates
    private void updateSuggestionVisibility() {
        boolean shouldShow = isSuggestionsEnabled && !currentSuggestions.isEmpty();
        suggestionContainer.setVisibility(shouldShow ? View.VISIBLE : View.GONE);
    }
    
    private void showLoadingState() {
        loadingIndicator.setVisibility(View.VISIBLE);
        suggestionRecyclerView.setVisibility(View.GONE);
    }
    
    private void hideLoadingState() {
        loadingIndicator.setVisibility(View.GONE);
        suggestionRecyclerView.setVisibility(View.VISIBLE);
    }
    
    // MARK: - App Detection
    private void detectCurrentApp() {
        String currentApp = appDetector.getCurrentDatingApp();
        
        // Customize keyboard behavior based on detected app
        customizeForApp(currentApp);
    }
    
    private void customizeForApp(String appIdentifier) {
        // Customize keyboard layout or behavior based on the current dating app
        switch (appIdentifier) {
            case "tinder":
                // Tinder-specific optimizations
                break;
            case "bumble":
                // Bumble-specific optimizations
                break;
            case "hinge":
                // Hinge-specific optimizations
                break;
            default:
                // Default behavior
                break;
        }
    }
    
    // MARK: - Utility Methods
    private void runOnUiThread(Runnable runnable) {
        new Handler(Looper.getMainLooper()).post(runnable);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        
        // Clean up resources
        cancelPendingAnalysis();
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
        }
    }
}

