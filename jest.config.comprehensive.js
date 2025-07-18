module.exports = {
  // Test environment configuration
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/tests/setup/global-setup.js'
  ],
  
  // Module paths and aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@mobile/(.*)$': '<rootDir>/mobile/src/$1',
    '^@web/(.*)$': '<rootDir>/web/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/mobile/src/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/web/src/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/backend/**/__tests__/**/*.{js,ts}',
    '<rootDir>/shared/**/__tests__/**/*.{js,ts}'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/mobile/node_modules/',
    '<rootDir>/web/node_modules/',
    '<rootDir>/backend/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-runtime'
      ]
    }],
    '^.+\\.css$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|webp|svg)$': 'jest-transform-stub'
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    'mobile/src/**/*.{js,ts,tsx}',
    'web/src/**/*.{js,ts,tsx}',
    'backend/**/*.{js,ts}',
    'shared/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/*.config.js',
    '!**/*.setup.js',
    '!**/index.js',
    '!**/index.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './shared/sync/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './mobile/src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './backend/functions/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    },
    __DEV__: true,
    __TEST__: true
  },
  
  // Test projects for different environments
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,ts,tsx}',
        '<rootDir>/shared/**/__tests__/**/*.{js,ts}',
        '<rootDir>/mobile/src/**/__tests__/**/*.{js,ts,tsx}',
        '<rootDir>/web/src/**/__tests__/**/*.{js,ts,tsx}'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/unit-setup.js']
    },
    
    // Integration tests
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration-setup.js']
    },
    
    // Mobile-specific tests
    {
      displayName: 'mobile',
      testMatch: [
        '<rootDir>/tests/mobile/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/mobile-setup.js'
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic' }]
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-runtime',
            'react-native-reanimated/plugin'
          ]
        }]
      }
    },
    
    // Web-specific tests
    {
      displayName: 'web',
      testMatch: [
        '<rootDir>/tests/web/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/web-setup.js'
      ]
    },
    
    // Backend tests
    {
      displayName: 'backend',
      testMatch: [
        '<rootDir>/tests/backend/**/*.test.{js,ts}',
        '<rootDir>/backend/**/__tests__/**/*.{js,ts}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/backend-setup.js'
      ]
    },
    
    // Sync tests
    {
      displayName: 'sync',
      testMatch: [
        '<rootDir>/tests/sync/**/*.test.{js,ts}'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/sync-setup.js'
      ]
    }
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'AI Dating Coach Test Report'
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  
  // Performance monitoring
  maxWorkers: '50%',
  
  // Snapshot configuration
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Module resolution
  resolver: '<rootDir>/tests/setup/jest-resolver.js',
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/tests/setup/custom-matchers.js'
  ]
};

