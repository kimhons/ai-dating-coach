/**
 * AI Dating Coach - Privacy Manager
 * Handles GDPR compliance, data protection, and user privacy controls
 */

import { randomBytes } from 'crypto'

export interface PrivacyConfig {
  enableGDPRCompliance: boolean
  dataRetentionDays: number
  anonymizationDelay: number
  enableDataMinimization: boolean
  enableConsentManagement: boolean
  enableRightToBeForget: boolean
  enableDataPortability: boolean
}

export interface UserConsent {
  userId: string
  consentId: string
  consentType: ConsentType
  granted: boolean
  timestamp: number
  ipAddress: string
  userAgent: string
  version: string
  expiresAt?: number
}

export interface DataProcessingRecord {
  id: string
  userId: string
  dataType: DataType
  processingPurpose: ProcessingPurpose
  legalBasis: LegalBasis
  timestamp: number
  retentionPeriod: number
  anonymized: boolean
  deleted: boolean
}

export interface PrivacyRequest {
  id: string
  userId: string
  requestType: PrivacyRequestType
  status: RequestStatus
  submittedAt: number
  processedAt?: number
  completedAt?: number
  metadata: Record<string, any>
}

export enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  AI_PROCESSING = 'ai_processing',
  DATA_SHARING = 'data_sharing'
}

export enum DataType {
  PROFILE_DATA = 'profile_data',
  PHOTO_DATA = 'photo_data',
  CONVERSATION_DATA = 'conversation_data',
  USAGE_DATA = 'usage_data',
  ANALYTICS_DATA = 'analytics_data',
  PAYMENT_DATA = 'payment_data',
  DEVICE_DATA = 'device_data',
  LOCATION_DATA = 'location_data'
}

export enum ProcessingPurpose {
  SERVICE_PROVISION = 'service_provision',
  AI_ANALYSIS = 'ai_analysis',
  PERSONALIZATION = 'personalization',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  SECURITY = 'security',
  LEGAL_COMPLIANCE = 'legal_compliance'
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export enum PrivacyRequestType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  RESTRICTION = 'restriction',
  PORTABILITY = 'portability',
  OBJECTION = 'objection'
}

export enum RequestStatus {
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export class PrivacyManager {
  private config: PrivacyConfig
  private userConsents: Map<string, UserConsent[]> = new Map()
  private processingRecords: DataProcessingRecord[] = []
  private privacyRequests: PrivacyRequest[] = []
  
  // Data retention policies by data type
  private readonly RETENTION_POLICIES = {
    [DataType.PROFILE_DATA]: 365 * 24 * 60 * 60 * 1000, // 1 year
    [DataType.PHOTO_DATA]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [DataType.CONVERSATION_DATA]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [DataType.USAGE_DATA]: 180 * 24 * 60 * 60 * 1000, // 6 months
    [DataType.ANALYTICS_DATA]: 730 * 24 * 60 * 60 * 1000, // 2 years
    [DataType.PAYMENT_DATA]: 2555 * 24 * 60 * 60 * 1000, // 7 years (legal requirement)
    [DataType.DEVICE_DATA]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [DataType.LOCATION_DATA]: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
  
  // Consent requirements by processing purpose
  private readonly CONSENT_REQUIREMENTS = {
    [ProcessingPurpose.SERVICE_PROVISION]: [ConsentType.ESSENTIAL],
    [ProcessingPurpose.AI_ANALYSIS]: [ConsentType.AI_PROCESSING],
    [ProcessingPurpose.PERSONALIZATION]: [ConsentType.PERSONALIZATION],
    [ProcessingPurpose.ANALYTICS]: [ConsentType.ANALYTICS],
    [ProcessingPurpose.MARKETING]: [ConsentType.MARKETING],
    [ProcessingPurpose.SECURITY]: [ConsentType.ESSENTIAL],
    [ProcessingPurpose.LEGAL_COMPLIANCE]: [] // No consent required
  }
  
  constructor(config: PrivacyConfig) {
    this.config = config
    this.startCleanupIntervals()
  }
  
  /**
   * Record user consent
   */
  public async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string = '1.0'
  ): Promise<UserConsent> {
    const consent: UserConsent = {
      userId,
      consentId: randomBytes(16).toString('hex'),
      consentType,
      granted,
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      version,
      expiresAt: this.calculateConsentExpiry(consentType)
    }
    
    const userConsentList = this.userConsents.get(userId) || []
    
    // Remove any existing consent of the same type
    const filteredConsents = userConsentList.filter(c => c.consentType !== consentType)
    filteredConsents.push(consent)
    
    this.userConsents.set(userId, filteredConsents)
    
    // Log the consent change
    console.log(`Consent recorded: User ${userId} ${granted ? 'granted' : 'revoked'} ${consentType}`)
    
    return consent
  }
  
  /**
   * Check if user has given consent for specific processing
   */
  public hasValidConsent(userId: string, purpose: ProcessingPurpose): boolean {
    if (!this.config.enableConsentManagement) return true
    
    const requiredConsents = this.CONSENT_REQUIREMENTS[purpose]
    if (!requiredConsents || requiredConsents.length === 0) return true
    
    const userConsentList = this.userConsents.get(userId) || []
    const now = Date.now()
    
    return requiredConsents.every(requiredType => {
      const consent = userConsentList.find(c => c.consentType === requiredType)
      return consent && 
             consent.granted && 
             (!consent.expiresAt || consent.expiresAt > now)
    })
  }
  
  /**
   * Record data processing activity
   */
  public async recordDataProcessing(
    userId: string,
    dataType: DataType,
    purpose: ProcessingPurpose,
    legalBasis: LegalBasis = LegalBasis.CONSENT
  ): Promise<DataProcessingRecord> {
    // Check consent if required
    if (legalBasis === LegalBasis.CONSENT && !this.hasValidConsent(userId, purpose)) {
      throw new Error(`User ${userId} has not consented to ${purpose} processing`)
    }
    
    const record: DataProcessingRecord = {
      id: randomBytes(16).toString('hex'),
      userId,
      dataType,
      processingPurpose: purpose,
      legalBasis,
      timestamp: Date.now(),
      retentionPeriod: this.RETENTION_POLICIES[dataType],
      anonymized: false,
      deleted: false
    }
    
    this.processingRecords.push(record)
    
    return record
  }
  
  /**
   * Handle privacy request (GDPR Article 15-21)
   */
  public async submitPrivacyRequest(
    userId: string,
    requestType: PrivacyRequestType,
    metadata: Record<string, any> = {}
  ): Promise<PrivacyRequest> {
    const request: PrivacyRequest = {
      id: randomBytes(16).toString('hex'),
      userId,
      requestType,
      status: RequestStatus.SUBMITTED,
      submittedAt: Date.now(),
      metadata
    }
    
    this.privacyRequests.push(request)
    
    // Auto-process certain requests
    if (this.canAutoProcess(requestType)) {
      await this.processPrivacyRequest(request.id)
    }
    
    return request
  }
  
  /**
   * Process privacy request
   */
  public async processPrivacyRequest(requestId: string): Promise<void> {
    const request = this.privacyRequests.find(r => r.id === requestId)
    if (!request) throw new Error('Request not found')
    
    request.status = RequestStatus.PROCESSING
    request.processedAt = Date.now()
    
    try {
      switch (request.requestType) {
        case PrivacyRequestType.ACCESS:
          await this.handleAccessRequest(request)
          break
        case PrivacyRequestType.RECTIFICATION:
          await this.handleRectificationRequest(request)
          break
        case PrivacyRequestType.ERASURE:
          await this.handleErasureRequest(request)
          break
        case PrivacyRequestType.RESTRICTION:
          await this.handleRestrictionRequest(request)
          break
        case PrivacyRequestType.PORTABILITY:
          await this.handlePortabilityRequest(request)
          break
        case PrivacyRequestType.OBJECTION:
          await this.handleObjectionRequest(request)
          break
      }
      
      request.status = RequestStatus.COMPLETED
      request.completedAt = Date.now()
      
    } catch (error) {
      request.status = RequestStatus.REJECTED
      request.metadata.error = error.message
      console.error(`Privacy request ${requestId} failed:`, error)
    }
  }
  
  /**
   * Get user's data for portability (GDPR Article 20)
   */
  public async exportUserData(userId: string): Promise<{
    profile: any
    consents: UserConsent[]
    processingRecords: DataProcessingRecord[]
    exportedAt: number
  }> {
    // Check if user has right to data portability
    if (!this.config.enableDataPortability) {
      throw new Error('Data portability is not enabled')
    }
    
    const userConsents = this.userConsents.get(userId) || []
    const userProcessingRecords = this.processingRecords.filter(r => r.userId === userId)
    
    // In production, you would fetch actual user data from your database
    const userData = {
      profile: await this.getUserProfile(userId),
      consents: userConsents,
      processingRecords: userProcessingRecords,
      exportedAt: Date.now()
    }
    
    // Record the data export
    await this.recordDataProcessing(
      userId,
      DataType.PROFILE_DATA,
      ProcessingPurpose.LEGAL_COMPLIANCE,
      LegalBasis.LEGAL_OBLIGATION
    )
    
    return userData
  }
  
  /**
   * Anonymize user data
   */
  public async anonymizeUserData(userId: string): Promise<void> {
    // Mark processing records as anonymized
    const userRecords = this.processingRecords.filter(r => r.userId === userId)
    userRecords.forEach(record => {
      record.anonymized = true
      record.userId = this.generateAnonymousId()
    })
    
    // Remove consents
    this.userConsents.delete(userId)
    
    // In production, you would anonymize actual user data in your database
    console.log(`User data anonymized for user: ${userId}`)
  }
  
  /**
   * Delete user data (Right to be forgotten - GDPR Article 17)
   */
  public async deleteUserData(userId: string): Promise<void> {
    if (!this.config.enableRightToBeForget) {
      throw new Error('Right to be forgotten is not enabled')
    }
    
    // Mark processing records as deleted
    const userRecords = this.processingRecords.filter(r => r.userId === userId)
    userRecords.forEach(record => {
      record.deleted = true
    })
    
    // Remove consents
    this.userConsents.delete(userId)
    
    // In production, you would delete actual user data from your database
    console.log(`User data deleted for user: ${userId}`)
  }
  
  /**
   * Get privacy dashboard data for user
   */
  public async getPrivacyDashboard(userId: string): Promise<{
    consents: UserConsent[]
    processingActivities: DataProcessingRecord[]
    pendingRequests: PrivacyRequest[]
    dataRetentionInfo: Array<{ dataType: DataType; retentionDays: number }>
  }> {
    const userConsents = this.userConsents.get(userId) || []
    const userProcessingRecords = this.processingRecords.filter(r => r.userId === userId && !r.deleted)
    const userRequests = this.privacyRequests.filter(r => r.userId === userId)
    
    const dataRetentionInfo = Object.entries(this.RETENTION_POLICIES).map(([dataType, retention]) => ({
      dataType: dataType as DataType,
      retentionDays: Math.floor(retention / (24 * 60 * 60 * 1000))
    }))
    
    return {
      consents: userConsents,
      processingActivities: userProcessingRecords,
      pendingRequests: userRequests.filter(r => r.status !== RequestStatus.COMPLETED),
      dataRetentionInfo
    }
  }
  
  /**
   * Get privacy compliance report
   */
  public getComplianceReport(): {
    totalUsers: number
    consentRates: Record<ConsentType, number>
    processingActivities: Record<ProcessingPurpose, number>
    pendingRequests: Record<PrivacyRequestType, number>
    dataRetentionCompliance: number
  } {
    const totalUsers = this.userConsents.size
    
    // Calculate consent rates
    const consentRates: Record<ConsentType, number> = {} as any
    Object.values(ConsentType).forEach(type => {
      const grantedCount = Array.from(this.userConsents.values())
        .flat()
        .filter(c => c.consentType === type && c.granted).length
      consentRates[type] = totalUsers > 0 ? grantedCount / totalUsers : 0
    })
    
    // Calculate processing activities
    const processingActivities: Record<ProcessingPurpose, number> = {} as any
    Object.values(ProcessingPurpose).forEach(purpose => {
      processingActivities[purpose] = this.processingRecords
        .filter(r => r.processingPurpose === purpose && !r.deleted).length
    })
    
    // Calculate pending requests
    const pendingRequests: Record<PrivacyRequestType, number> = {} as any
    Object.values(PrivacyRequestType).forEach(type => {
      pendingRequests[type] = this.privacyRequests
        .filter(r => r.requestType === type && r.status !== RequestStatus.COMPLETED).length
    })
    
    // Calculate data retention compliance
    const now = Date.now()
    const expiredRecords = this.processingRecords.filter(r => 
      !r.deleted && !r.anonymized && (r.timestamp + r.retentionPeriod) < now
    ).length
    const dataRetentionCompliance = this.processingRecords.length > 0 ? 
      1 - (expiredRecords / this.processingRecords.length) : 1
    
    return {
      totalUsers,
      consentRates,
      processingActivities,
      pendingRequests,
      dataRetentionCompliance
    }
  }
  
  // Private helper methods
  
  private calculateConsentExpiry(consentType: ConsentType): number | undefined {
    // Some consents expire after a certain period
    switch (consentType) {
      case ConsentType.MARKETING:
        return Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
      case ConsentType.ANALYTICS:
        return Date.now() + (730 * 24 * 60 * 60 * 1000) // 2 years
      default:
        return undefined // No expiry
    }
  }
  
  private canAutoProcess(requestType: PrivacyRequestType): boolean {
    // Some requests can be processed automatically
    return [
      PrivacyRequestType.ACCESS,
      PrivacyRequestType.PORTABILITY
    ].includes(requestType)
  }
  
  private async handleAccessRequest(request: PrivacyRequest): Promise<void> {
    const userData = await this.exportUserData(request.userId)
    request.metadata.exportData = userData
  }
  
  private async handleRectificationRequest(request: PrivacyRequest): Promise<void> {
    // In production, you would update the user's data based on the request
    console.log(`Rectification request processed for user: ${request.userId}`)
  }
  
  private async handleErasureRequest(request: PrivacyRequest): Promise<void> {
    await this.deleteUserData(request.userId)
  }
  
  private async handleRestrictionRequest(request: PrivacyRequest): Promise<void> {
    // In production, you would restrict processing of the user's data
    console.log(`Restriction request processed for user: ${request.userId}`)
  }
  
  private async handlePortabilityRequest(request: PrivacyRequest): Promise<void> {
    const userData = await this.exportUserData(request.userId)
    request.metadata.exportData = userData
  }
  
  private async handleObjectionRequest(request: PrivacyRequest): Promise<void> {
    // In production, you would stop processing based on the objection
    console.log(`Objection request processed for user: ${request.userId}`)
  }
  
  private async getUserProfile(userId: string): Promise<any> {
    // In production, this would fetch from your database
    return {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    }
  }
  
  private generateAnonymousId(): string {
    return 'anon_' + randomBytes(8).toString('hex')
  }
  
  private startCleanupIntervals(): void {
    // Clean up expired data daily
    setInterval(() => {
      this.cleanupExpiredData()
    }, 24 * 60 * 60 * 1000)
    
    // Clean up expired consents daily
    setInterval(() => {
      this.cleanupExpiredConsents()
    }, 24 * 60 * 60 * 1000)
  }
  
  private cleanupExpiredData(): void {
    const now = Date.now()
    
    // Find records that should be anonymized or deleted
    const expiredRecords = this.processingRecords.filter(record => 
      !record.deleted && 
      !record.anonymized && 
      (record.timestamp + record.retentionPeriod) < now
    )
    
    expiredRecords.forEach(record => {
      if (this.config.enableDataMinimization) {
        record.anonymized = true
        record.userId = this.generateAnonymousId()
        console.log(`Data anonymized for expired record: ${record.id}`)
      }
    })
  }
  
  private cleanupExpiredConsents(): void {
    const now = Date.now()
    
    for (const [userId, consents] of this.userConsents.entries()) {
      const validConsents = consents.filter(consent => 
        !consent.expiresAt || consent.expiresAt > now
      )
      
      if (validConsents.length !== consents.length) {
        this.userConsents.set(userId, validConsents)
        console.log(`Expired consents cleaned up for user: ${userId}`)
      }
    }
  }
}

// Export default instance
export const defaultPrivacyManager = new PrivacyManager({
  enableGDPRCompliance: true,
  dataRetentionDays: 90,
  anonymizationDelay: 30 * 24 * 60 * 60 * 1000, // 30 days
  enableDataMinimization: true,
  enableConsentManagement: true,
  enableRightToBeForget: true,
  enableDataPortability: true
})

