/**
 * Feature flags configuration
 * 
 * This file contains boolean flags to enable/disable application features.
 * These flags allow for easy testing and feature rollouts.
 */

export const FEATURES = {
  // Registration feature flag
  // Set to true to enable user registration (sign up forms, links, etc.)
  // Set to false to disable registration and show guest-only experience
  ENABLE_USER_REGISTRATION: true, // TODO: Set to true when ready to enable registration

  // Add other feature flags here as needed
  // ENABLE_PREMIUM_FEATURES: false,
  // ENABLE_BETA_FEATURES: false,
} as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature];
};

// Export specific feature checks for convenience
export const isRegistrationEnabled = () => isFeatureEnabled('ENABLE_USER_REGISTRATION');