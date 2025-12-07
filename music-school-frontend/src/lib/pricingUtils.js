// Utility functions for dynamic pricing based on timezone and country

/**
 * Get user's timezone from browser
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    return 'UTC'
  }
}

/**
 * Get user's country code from timezone or browser locale
 */
export function getUserCountry() {
  try {
    // Check for test override (for debugging)
    const testRegion = localStorage.getItem('testRegion')
    if (testRegion) {
      console.log('[Pricing] Using test region:', testRegion)
      return testRegion
    }
    
    // Try to get from timezone
    const timezone = getUserTimezone()
    console.log('[Pricing] Detected timezone:', timezone)
    
    // Common timezone to country mappings (expanded)
    const timezoneToCountry = {
      // US timezones
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Phoenix': 'US',
      'America/Anchorage': 'US',
      'America/Detroit': 'US',
      'America/Indianapolis': 'US',
      'America/Boise': 'US',
      'America/Juneau': 'US',
      'America/Menominee': 'US',
      'America/Metlakatla': 'US',
      'America/Nome': 'US',
      'America/Sitka': 'US',
      'America/Yakutat': 'US',
      'Pacific/Honolulu': 'US',
      // India timezones
      'Asia/Kolkata': 'IN',
      'Asia/Calcutta': 'IN',
      'Asia/Delhi': 'IN',
      'Asia/Mumbai': 'IN',
      'Asia/Colombo': 'IN',
      // Europe
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'EU',
      'Europe/Brussels': 'EU',
      'Europe/Vienna': 'EU',
      // Asia
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Singapore': 'SG',
      'Asia/Hong_Kong': 'ASIA',
      'Asia/Seoul': 'ASIA',
      // Oceania
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Australia/Brisbane': 'AU',
      'Australia/Perth': 'AU',
      'Pacific/Auckland': 'NZ',
      // Canada
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'America/Montreal': 'CA',
      'America/Winnipeg': 'CA',
      'America/Edmonton': 'CA',
      'America/Halifax': 'CA',
    }
    
    // Check if timezone starts with America/ (US timezones)
    if (timezone.startsWith('America/')) {
      // Check if it's a known US timezone
      if (timezoneToCountry[timezone] === 'US') {
        console.log('[Pricing] Detected US timezone:', timezone)
        return 'US'
      }
      // Check if it's Canada
      if (timezoneToCountry[timezone] === 'CA') {
        return 'CA'
      }
      // Default America/ timezones to US
      if (!timezoneToCountry[timezone]) {
        console.log('[Pricing] Unknown America timezone, defaulting to US:', timezone)
        return 'US'
      }
    }
    
    if (timezoneToCountry[timezone]) {
      console.log('[Pricing] Mapped timezone to country:', timezone, '->', timezoneToCountry[timezone])
      return timezoneToCountry[timezone]
    }
    
    // Fallback to browser locale
    const locale = navigator.language || navigator.userLanguage
    const country = locale.split('-')[1]?.toUpperCase()
    console.log('[Pricing] Using browser locale:', locale, '->', country)
    
    return country || 'IN' // Default to India
  } catch (error) {
    console.error('[Pricing] Error detecting country:', error)
    return 'IN' // Default to India
  }
}

/**
 * Get region code from country
 */
export function getRegionFromCountry(country) {
  const countryToRegion = {
    'US': 'US',
    'CA': 'US', // North America
    'IN': 'IN',
    'GB': 'EU',
    'FR': 'EU',
    'DE': 'EU',
    'IT': 'EU',
    'ES': 'EU',
    'JP': 'ASIA',
    'CN': 'ASIA',
    'SG': 'ASIA',
    'AU': 'OCEANIA',
    'NZ': 'OCEANIA',
  }
  
  return countryToRegion[country] || 'IN'
}

/**
 * Get currency symbol for a region
 */
export function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'INR': '₹',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
  }
  
  return symbols[currency] || currency
}

/**
 * Format price with currency
 */
export function formatPrice(price, currency = 'INR') {
  const symbol = getCurrencySymbol(currency)
  const formattedPrice = Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    return `${symbol}${formattedPrice}`
  }
  
  return `${symbol}${formattedPrice}`
}

/**
 * Get pricing for a course based on user's location
 */
export async function getCoursePricing(courseId, baseUrl) {
  try {
    const country = getUserCountry()
    const region = getRegionFromCountry(country)
    
    // Try to get region-specific pricing
    const response = await fetch(`${baseUrl}/api/courses/${courseId}/pricing/${region}`)
    if (response.ok) {
      const pricing = await response.json()
      return pricing
    }
    
    // Fallback to default course price
    return null
  } catch (error) {
    console.error('Error fetching dynamic pricing:', error)
    return null
  }
}

