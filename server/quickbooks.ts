// @ts-ignore
import QuickBooks from 'node-quickbooks';
import { Request, Response } from 'express';
import { storage } from './storage';

// QuickBooks OAuth configuration
const QB_CONFIG = {
  consumerKey: process.env.QUICKBOOKS_CLIENT_ID || '',
  consumerSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
  sandbox: process.env.NODE_ENV !== 'production', // Use sandbox for development
  debug: process.env.NODE_ENV === 'development',
};

// OAuth URLs
const OAUTH_URLS = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com/v3/company/',
  production: 'https://quickbooks.api.intuit.com/v3/company/',
  requestTokenUrl: QB_CONFIG.sandbox 
    ? 'https://oauth.platform.intuit.com/oauth/v1/get_request_token'
    : 'https://oauth.platform.intuit.com/oauth/v1/get_request_token',
  accessTokenUrl: QB_CONFIG.sandbox
    ? 'https://oauth.platform.intuit.com/oauth/v1/get_access_token'
    : 'https://oauth.platform.intuit.com/oauth/v1/get_access_token',
};

export class QuickBooksService {
  private qbo: any;
  
  constructor(accessToken?: string, accessTokenSecret?: string, realmId?: string) {
    if (accessToken && accessTokenSecret && realmId) {
      this.qbo = new QuickBooks(
        QB_CONFIG.consumerKey,
        QB_CONFIG.consumerSecret,
        accessToken,
        accessTokenSecret,
        realmId,
        QB_CONFIG.sandbox,
        QB_CONFIG.debug
      );
    }
  }

  // Generate QuickBooks authorization URL
  static getAuthorizationUrl(userId: string): string {
    const baseUrl = QB_CONFIG.sandbox 
      ? 'https://appcenter.intuit.com/connect/oauth_callback'
      : 'https://appcenter.intuit.com/connect/oauth_callback';
    
    const params = new URLSearchParams({
      client_id: QB_CONFIG.consumerKey,
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: `${process.env.REPLIT_DOMAINS}/api/quickbooks/callback`,
      response_type: 'code',
      access_type: 'offline',
      state: userId, // Pass user ID as state parameter
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  // Handle OAuth callback
  static async handleCallback(req: Request, res: Response) {
    try {
      const { code, realmId, state: userId } = req.query;

      if (!code || !realmId || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${QB_CONFIG.consumerKey}:${QB_CONFIG.consumerSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: `${process.env.REPLIT_DOMAINS}/api/quickbooks/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('QuickBooks token exchange error:', tokenData);
        return res.status(400).json({ error: 'Failed to exchange authorization code' });
      }

      // Calculate token expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

      // Update user with QuickBooks credentials
      await storage.updateUserQuickBooks(userId as string, {
        quickbooksConnected: true,
        quickbooksRealmId: realmId as string,
        quickbooksAccessToken: tokenData.access_token,
        quickbooksRefreshToken: tokenData.refresh_token,
        quickbooksTokenExpiry: expiryDate,
      });

      // Redirect to settings page with success message
      res.redirect('/settings?quickbooks=connected');
    } catch (error) {
      console.error('QuickBooks callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Refresh access token
  static async refreshToken(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.quickbooksRefreshToken) {
        return false;
      }

      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${QB_CONFIG.consumerKey}:${QB_CONFIG.consumerSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.quickbooksRefreshToken,
        }),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        console.error('QuickBooks token refresh error:', tokenData);
        return false;
      }

      // Calculate new expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

      // Update tokens
      await storage.updateUserQuickBooks(userId, {
        quickbooksAccessToken: tokenData.access_token,
        quickbooksRefreshToken: tokenData.refresh_token || user.quickbooksRefreshToken,
        quickbooksTokenExpiry: expiryDate,
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Get company information
  async getCompanyInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.qbo.getCompanyInfo(this.qbo.realmId, (err: any, companyInfo: any) => {
        if (err) reject(err);
        else resolve(companyInfo);
      });
    });
  }

  // Sync customer to QuickBooks
  async syncCustomer(client: any): Promise<string | null> {
    try {
      const customer = {
        Name: client.name,
        CompanyName: client.name,
        PrimaryEmailAddr: client.email ? { Address: client.email } : undefined,
        PrimaryPhone: client.phone ? { FreeFormNumber: client.phone } : undefined,
        BillAddr: client.address ? { 
          Line1: client.address,
          City: '',
          State: '',
          PostalCode: '',
          Country: 'US'
        } : undefined,
      };

      return new Promise((resolve, reject) => {
        this.qbo.createCustomer(customer, (err: any, result: any) => {
          if (err) {
            console.error('QuickBooks customer sync error:', err);
            reject(err);
          } else {
            resolve(result.QueryResponse?.Customer?.[0]?.Id || null);
          }
        });
      });
    } catch (error) {
      console.error('Customer sync error:', error);
      return null;
    }
  }

  // Sync project as estimate/invoice to QuickBooks
  async syncProject(project: any, client: any, budgetItems: any[]): Promise<string | null> {
    try {
      // First ensure customer exists in QuickBooks
      let customerId = await this.syncCustomer(client);
      
      if (!customerId) {
        throw new Error('Failed to sync customer to QuickBooks');
      }

      // Create estimate from project and budget items
      const lineItems = budgetItems.map((item, index) => ({
        Id: index + 1,
        LineNum: index + 1,
        Amount: parseFloat(item.cost || '0'),
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: '1', // Use default service item
            name: 'Services'
          },
          Qty: 1,
          UnitPrice: parseFloat(item.cost || '0'),
        },
        Description: item.description || item.category || 'Project Item',
      }));

      const estimate = {
        CustomerRef: {
          value: customerId,
        },
        Line: lineItems,
        TotalAmt: budgetItems.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0),
        DocNumber: `EST-${project.id}`,
        TxnDate: new Date().toISOString().split('T')[0],
        DueDate: project.dueDate || new Date().toISOString().split('T')[0],
      };

      return new Promise((resolve, reject) => {
        this.qbo.createEstimate(estimate, (err: any, result: any) => {
          if (err) {
            console.error('QuickBooks estimate sync error:', err);
            reject(err);
          } else {
            resolve(result.QueryResponse?.Estimate?.[0]?.Id || null);
          }
        });
      });
    } catch (error) {
      console.error('Project sync error:', error);
      return null;
    }
  }

  // Disconnect QuickBooks
  static async disconnect(userId: string): Promise<void> {
    await storage.updateUserQuickBooks(userId, {
      quickbooksConnected: false,
      quickbooksRealmId: null,
      quickbooksAccessToken: null,
      quickbooksRefreshToken: null,
      quickbooksTokenExpiry: null,
    });
  }
}

// Helper function to get authenticated QuickBooks service for a user
export async function getQuickBooksService(userId: string): Promise<QuickBooksService | null> {
  try {
    const user = await storage.getUser(userId);
    
    if (!user?.quickbooksConnected || !user.quickbooksAccessToken || !user.quickbooksRealmId) {
      return null;
    }

    // Check if token needs refresh
    const now = new Date();
    const expiry = user.quickbooksTokenExpiry ? new Date(user.quickbooksTokenExpiry) : null;
    
    if (expiry && now >= expiry) {
      const refreshed = await QuickBooksService.refreshToken(userId);
      if (!refreshed) {
        return null;
      }
      
      // Get updated user data
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser?.quickbooksAccessToken) {
        return null;
      }
      
      return new QuickBooksService(
        updatedUser.quickbooksAccessToken,
        '', // Not needed for OAuth2
        updatedUser.quickbooksRealmId!
      );
    }

    return new QuickBooksService(
      user.quickbooksAccessToken,
      '', // Not needed for OAuth2
      user.quickbooksRealmId
    );
  } catch (error) {
    console.error('Error getting QuickBooks service:', error);
    return null;
  }
}