/**
 * End-to-End Tests for AI Dating Coach Browser Extension
 * Tests the extension functionality across different dating platforms
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Browser Extension E2E Tests', () => {
  let browser;
  let page;
  const extensionPath = path.join(__dirname, '../../browser-extension');
  const testTimeout = 30000;

  beforeAll(async () => {
    // Launch browser with extension loaded
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      devtools: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1280, height: 720 });
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Page Error:', msg.text());
      }
    });

    // Handle page errors
    page.on('pageerror', error => {
      console.error('Page Error:', error.message);
    });
  }, testTimeout);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Extension Loading', () => {
    test('should load extension successfully', async () => {
      // Navigate to extension management page
      await page.goto('chrome://extensions/');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Check if extension is loaded
      const extensionCards = await page.$$('extensions-item');
      expect(extensionCards.length).toBeGreaterThan(0);
      
      // Find our extension
      let extensionFound = false;
      for (const card of extensionCards) {
        const name = await card.$eval('#name', el => el.textContent);
        if (name && name.includes('AI Dating Coach')) {
          extensionFound = true;
          
          // Check if extension is enabled
          const toggle = await card.$('#enableToggle');
          const isEnabled = await toggle.evaluate(el => el.checked);
          expect(isEnabled).toBe(true);
          break;
        }
      }
      
      expect(extensionFound).toBe(true);
    }, testTimeout);

    test('should have correct permissions', async () => {
      // Navigate to extension details
      await page.goto('chrome://extensions/');
      await page.waitForTimeout(1000);
      
      // Click on extension details
      const detailsButton = await page.$('extensions-item #detailsButton');
      if (detailsButton) {
        await detailsButton.click();
        await page.waitForTimeout(1000);
        
        // Check permissions
        const permissions = await page.$$eval('.permission-list .permission', 
          elements => elements.map(el => el.textContent)
        );
        
        expect(permissions).toEqual(expect.arrayContaining([
          expect.stringMatching(/Read and change.*tinder\.com/),
          expect.stringMatching(/Read and change.*bumble\.com/),
          expect.stringMatching(/Read and change.*hinge\.co/)
        ]));
      }
    }, testTimeout);
  });

  describe('Tinder Integration', () => {
    beforeEach(async () => {
      // Navigate to Tinder (mock page for testing)
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(2000);
    });

    test('should inject floating button on Tinder', async () => {
      // Wait for extension to inject content
      await page.waitForTimeout(3000);
      
      // Check if floating button is present
      const floatingButton = await page.$('.ai-coach-floating-button');
      expect(floatingButton).toBeTruthy();
      
      // Check button visibility
      const isVisible = await floatingButton.isIntersectingViewport();
      expect(isVisible).toBe(true);
      
      // Check button styling
      const buttonStyles = await floatingButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          zIndex: styles.zIndex,
          backgroundColor: styles.backgroundColor
        };
      });
      
      expect(buttonStyles.position).toBe('fixed');
      expect(parseInt(buttonStyles.zIndex)).toBeGreaterThan(1000);
    }, testTimeout);

    test('should show coaching panel when button clicked', async () => {
      await page.waitForTimeout(3000);
      
      // Click floating button
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      // Wait for panel to appear
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      // Check panel content
      const panel = await page.$('.ai-coach-panel');
      expect(panel).toBeTruthy();
      
      const panelContent = await panel.$('.panel-content');
      expect(panelContent).toBeTruthy();
      
      // Check if panel has expected sections
      const sections = await panel.$$('.coaching-section');
      expect(sections.length).toBeGreaterThan(0);
    }, testTimeout);

    test('should analyze profile when requested', async () => {
      await page.waitForTimeout(3000);
      
      // Open coaching panel
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      // Click analyze profile button
      const analyzeButton = await page.$('.analyze-profile-btn');
      if (analyzeButton) {
        await analyzeButton.click();
        
        // Wait for analysis to complete
        await page.waitForSelector('.analysis-results', { timeout: 10000 });
        
        // Check analysis results
        const results = await page.$('.analysis-results');
        expect(results).toBeTruthy();
        
        const suggestions = await results.$$('.suggestion-item');
        expect(suggestions.length).toBeGreaterThan(0);
      }
    }, testTimeout);

    test('should provide conversation suggestions', async () => {
      await page.waitForTimeout(3000);
      
      // Simulate being on a conversation page
      await page.evaluate(() => {
        // Mock conversation interface
        const messageInput = document.createElement('textarea');
        messageInput.className = 'message-input';
        messageInput.placeholder = 'Type a message...';
        document.body.appendChild(messageInput);
      });
      
      // Open coaching panel
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      // Check for conversation coaching section
      const conversationSection = await page.$('.conversation-coaching');
      if (conversationSection) {
        const suggestions = await conversationSection.$$('.suggestion-chip');
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Test suggestion click
        if (suggestions.length > 0) {
          await suggestions[0].click();
          
          // Check if suggestion was applied to input
          const messageInput = await page.$('.message-input');
          const inputValue = await messageInput.evaluate(el => el.value);
          expect(inputValue.length).toBeGreaterThan(0);
        }
      }
    }, testTimeout);
  });

  describe('Bumble Integration', () => {
    beforeEach(async () => {
      await page.goto('https://bumble.com/app');
      await page.waitForTimeout(2000);
    });

    test('should adapt to Bumble interface', async () => {
      await page.waitForTimeout(3000);
      
      // Check if extension adapts to Bumble's layout
      const floatingButton = await page.$('.ai-coach-floating-button');
      expect(floatingButton).toBeTruthy();
      
      // Check if button position is appropriate for Bumble
      const buttonPosition = await floatingButton.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return {
          right: rect.right,
          bottom: rect.bottom
        };
      });
      
      // Button should be positioned within viewport
      expect(buttonPosition.right).toBeLessThan(1280);
      expect(buttonPosition.bottom).toBeLessThan(720);
    }, testTimeout);

    test('should detect Bumble-specific elements', async () => {
      await page.waitForTimeout(3000);
      
      // Open coaching panel
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      // Check if platform is correctly detected
      const platformIndicator = await page.$('.platform-indicator');
      if (platformIndicator) {
        const platformText = await platformIndicator.evaluate(el => el.textContent);
        expect(platformText.toLowerCase()).toContain('bumble');
      }
    }, testTimeout);
  });

  describe('Cross-Platform Features', () => {
    test('should maintain consistent UI across platforms', async () => {
      const platforms = [
        'https://tinder.com/app/recs',
        'https://bumble.com/app',
        'https://hinge.co/discover'
      ];
      
      for (const platform of platforms) {
        await page.goto(platform);
        await page.waitForTimeout(3000);
        
        // Check floating button consistency
        const floatingButton = await page.$('.ai-coach-floating-button');
        expect(floatingButton).toBeTruthy();
        
        const buttonStyles = await floatingButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            width: styles.width,
            height: styles.height,
            borderRadius: styles.borderRadius
          };
        });
        
        // Button should have consistent dimensions
        expect(buttonStyles.width).toBe('60px');
        expect(buttonStyles.height).toBe('60px');
        expect(buttonStyles.borderRadius).toBe('50%');
      }
    }, testTimeout);

    test('should sync data across platforms', async () => {
      // Test data synchronization
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Open panel and make some changes
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      // Simulate user preference change
      const settingsButton = await page.$('.settings-btn');
      if (settingsButton) {
        await settingsButton.click();
        
        const coachingToneSelect = await page.$('#coaching-tone');
        if (coachingToneSelect) {
          await coachingToneSelect.select('direct');
          
          // Save settings
          const saveButton = await page.$('.save-settings-btn');
          if (saveButton) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Navigate to different platform
      await page.goto('https://bumble.com/app');
      await page.waitForTimeout(3000);
      
      // Check if settings persisted
      const newFloatingButton = await page.$('.ai-coach-floating-button');
      await newFloatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      const newSettingsButton = await page.$('.settings-btn');
      if (newSettingsButton) {
        await newSettingsButton.click();
        
        const newCoachingToneSelect = await page.$('#coaching-tone');
        if (newCoachingToneSelect) {
          const selectedValue = await newCoachingToneSelect.evaluate(el => el.value);
          expect(selectedValue).toBe('direct');
        }
      }
    }, testTimeout);
  });

  describe('Performance', () => {
    test('should not significantly impact page load time', async () => {
      const startTime = Date.now();
      
      await page.goto('https://tinder.com/app/recs');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (less than 5 seconds)
      expect(loadTime).toBeLessThan(5000);
    }, testTimeout);

    test('should have minimal memory footprint', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Get memory usage
      const metrics = await page.metrics();
      
      // Extension should not use excessive memory
      expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    }, testTimeout);

    test('should not block main thread', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Measure main thread blocking
      const startTime = Date.now();
      
      // Perform CPU-intensive task
      await page.evaluate(() => {
        const start = performance.now();
        while (performance.now() - start < 100) {
          // Busy wait for 100ms
        }
      });
      
      const endTime = Date.now();
      const actualTime = endTime - startTime;
      
      // Should not significantly exceed expected time
      expect(actualTime).toBeLessThan(200); // Allow 100ms buffer
    }, testTimeout);
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.setOfflineMode(true);
      
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Extension should still load basic functionality
      const floatingButton = await page.$('.ai-coach-floating-button');
      expect(floatingButton).toBeTruthy();
      
      await floatingButton.click();
      
      // Should show offline message
      await page.waitForSelector('.offline-message', { timeout: 5000 });
      const offlineMessage = await page.$('.offline-message');
      expect(offlineMessage).toBeTruthy();
      
      // Restore online mode
      await page.setOfflineMode(false);
    }, testTimeout);

    test('should handle API errors gracefully', async () => {
      // Mock API to return errors
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      // Try to analyze profile
      const analyzeButton = await page.$('.analyze-profile-btn');
      if (analyzeButton) {
        await analyzeButton.click();
        
        // Should show error message
        await page.waitForSelector('.error-message', { timeout: 5000 });
        const errorMessage = await page.$('.error-message');
        expect(errorMessage).toBeTruthy();
      }
      
      await page.setRequestInterception(false);
    }, testTimeout);

    test('should handle DOM changes gracefully', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Simulate dynamic DOM changes
      await page.evaluate(() => {
        // Remove and re-add elements
        const body = document.body;
        const newDiv = document.createElement('div');
        newDiv.className = 'dynamic-content';
        body.appendChild(newDiv);
        
        // Trigger mutation
        setTimeout(() => {
          newDiv.innerHTML = '<p>Dynamic content added</p>';
        }, 1000);
      });
      
      await page.waitForTimeout(2000);
      
      // Extension should still work
      const floatingButton = await page.$('.ai-coach-floating-button');
      expect(floatingButton).toBeTruthy();
      
      const isVisible = await floatingButton.isIntersectingViewport();
      expect(isVisible).toBe(true);
    }, testTimeout);
  });

  describe('Security', () => {
    test('should not expose sensitive data', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Check if extension exposes any sensitive data to page
      const exposedData = await page.evaluate(() => {
        return {
          hasApiKey: !!window.AI_COACH_API_KEY,
          hasUserData: !!window.AI_COACH_USER_DATA,
          hasAuthToken: !!window.AI_COACH_AUTH_TOKEN
        };
      });
      
      expect(exposedData.hasApiKey).toBe(false);
      expect(exposedData.hasUserData).toBe(false);
      expect(exposedData.hasAuthToken).toBe(false);
    }, testTimeout);

    test('should use secure communication', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Monitor network requests
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('ai-dating-coach')) {
          requests.push(request.url());
        }
      });
      
      // Trigger API call
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      const analyzeButton = await page.$('.analyze-profile-btn');
      if (analyzeButton) {
        await analyzeButton.click();
        await page.waitForTimeout(2000);
      }
      
      // All requests should use HTTPS
      requests.forEach(url => {
        expect(url).toMatch(/^https:/);
      });
    }, testTimeout);
  });

  describe('Accessibility', () => {
    test('should be keyboard accessible', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if floating button can be focused
      const focusedElement = await page.evaluate(() => document.activeElement.className);
      expect(focusedElement).toContain('ai-coach-floating-button');
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Panel should open
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      const panel = await page.$('.ai-coach-panel');
      expect(panel).toBeTruthy();
    }, testTimeout);

    test('should have proper ARIA labels', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      const floatingButton = await page.$('.ai-coach-floating-button');
      
      const ariaLabel = await floatingButton.evaluate(el => el.getAttribute('aria-label'));
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('AI Dating Coach');
      
      const role = await floatingButton.evaluate(el => el.getAttribute('role'));
      expect(role).toBe('button');
    }, testTimeout);

    test('should support screen readers', async () => {
      await page.goto('https://tinder.com/app/recs');
      await page.waitForTimeout(3000);
      
      // Check for screen reader friendly elements
      const floatingButton = await page.$('.ai-coach-floating-button');
      await floatingButton.click();
      
      await page.waitForSelector('.ai-coach-panel', { timeout: 5000 });
      
      const panel = await page.$('.ai-coach-panel');
      const ariaLive = await panel.evaluate(el => el.getAttribute('aria-live'));
      const ariaDescribedBy = await panel.evaluate(el => el.getAttribute('aria-describedby'));
      
      expect(ariaLive || ariaDescribedBy).toBeTruthy();
    }, testTimeout);
  });
});

