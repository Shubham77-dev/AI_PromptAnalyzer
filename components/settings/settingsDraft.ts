export type DefaultSort = "recent" | "score" | "title";

export type DigestFrequency = "off" | "daily" | "weekly";

export type SettingsDraft = {
  profile: {
    displayName: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  billing: {
    planLabel: string;
    promptsUsedPct: number;
    librarySlotsUsedPct: number;
    cardLast4: string;
  };
  preferences: {
    autoSave: boolean;
    scoreBreakdown: boolean;
    showImprovedPrompt: boolean;
    defaultSort: DefaultSort;
    compactView: boolean;
    monospacePreview: boolean;
  };
  notifications: {
    emailProduct: boolean;
    emailDigest: boolean;
    emailSecurity: boolean;
    digestFrequency: DigestFrequency;
  };
  api: {
    rawKey: string;
    webhookUrl: string;
    webhookEnabled: boolean;
    apiUsagePct: number;
    rateLimitLabel: string;
  };
};
