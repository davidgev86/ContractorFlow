declare module 'node-quickbooks' {
  interface QuickBooksConstructor {
    new (
      consumerKey: string,
      consumerSecret: string,
      oauth_token: string,
      oauth_token_secret: string,
      realmId: string,
      useSandbox: boolean,
      debug?: boolean
    ): QuickBooksInstance;
  }

  interface QuickBooksInstance {
    realmId: string;
    getCompanyInfo(realmId: string, callback: (err: any, data: any) => void): void;
    createCustomer(customer: any, callback: (err: any, data: any) => void): void;
    createEstimate(estimate: any, callback: (err: any, data: any) => void): void;
    createInvoice(invoice: any, callback: (err: any, data: any) => void): void;
    createItem(item: any, callback: (err: any, data: any) => void): void;
    getCustomers(callback: (err: any, data: any) => void): void;
    getItems(callback: (err: any, data: any) => void): void;
    getEstimates(callback: (err: any, data: any) => void): void;
    getInvoices(callback: (err: any, data: any) => void): void;
  }

  const QuickBooks: QuickBooksConstructor;
  export = QuickBooks;
}