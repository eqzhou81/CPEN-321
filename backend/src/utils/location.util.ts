import geocoder from 'node-geocoder';
import { ILocation } from '../types/jobs.types';
import logger from './logger.util';

// Initialize geocoder with OpenStreetMap provider (free)
const geocoderInstance = geocoder({
  provider: 'openstreetmap',
  formatter: null,
});

export class LocationUtils {
  /**
   * Calculate the distance between two coordinates using the Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in miles
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param degrees Degrees to convert
   * @returns Radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Geocode an address string to get coordinates
   * @param address Address string to geocode
   * @returns Location object with coordinates and formatted address
   */
  static async geocodeAddress(address: string): Promise<ILocation | null> {
    try {
      if (!address || address.trim() === '') {
        return null;
      }

      const results = await geocoderInstance.geocode(address);

      if (results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude ?? 0,
          longitude: result.longitude ?? 0,
          address: result.formattedAddress ?? address,
          city: result.city,
          state: result.state,
          country: result.country,
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @returns Location object with address information
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ILocation | null> {
    try {
      const results = await geocoderInstance.reverse({ lat: latitude, lon: longitude });
      
      if (results && results.length > 0) {
        const result = results[0];
        return {
          latitude,
          longitude,
          address: result.formattedAddress ?? `${latitude}, ${longitude}`,
          city: result.city,
          state: result.state,
          country: result.country,
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error reverse geocoding coordinates:', error);
      return null;
    }
  }

  /**
   * Parse location string to extract city, state, country
   * @param locationString Location string to parse
   * @returns Parsed location components
   */
  static parseLocationString(locationString: string): {
    city?: string;
    state?: string;
    country?: string;
    isRemote: boolean;
  } {
    const location = locationString.toLowerCase().trim();
    
    // Check if it's a remote position
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'virtual', 'telecommute'];
    const isRemote = remoteKeywords.some(keyword => location.includes(keyword));
    
    if (isRemote) {
      return { isRemote: true };
    }

    // Parse location components
    const parts = locationString.split(',').map(part => part.trim());
    
    let city: string | undefined;
    let state: string | undefined;
    let country: string | undefined;

    if (parts.length >= 1) {
      city = parts[0];
    }
    if (parts.length >= 2) {
      state = parts[1];
    }
    if (parts.length >= 3) {
      country = parts[2];
    }

    return { city, state, country, isRemote: false };
  }

  /**
   * Check if a job location is within the specified radius of a reference location
   * @param jobLocation Job location string
   * @param referenceLocation Reference location object
   * @param radiusMiles Radius in miles
   * @returns Object with distance and whether it's within radius
   */
  static async isWithinRadius(
    jobLocation: string,
    referenceLocation: ILocation,
    radiusMiles: number
  ): Promise<{ distance: number; withinRadius: boolean; isRemote: boolean }> {
    try {
      // Check if job is remote
      const parsedLocation = this.parseLocationString(jobLocation);
      if (parsedLocation.isRemote) {
        return { distance: 0, withinRadius: true, isRemote: true };
      }

      // Geocode the job location
      const jobCoords = await this.geocodeAddress(jobLocation);
      if (!jobCoords) {
        return { distance: Infinity, withinRadius: false, isRemote: false };
      }

      // Calculate distance
      const distance = this.calculateDistance(
        referenceLocation.latitude,
        referenceLocation.longitude,
        jobCoords.latitude,
        jobCoords.longitude
      );

      return {
        distance,
        withinRadius: distance <= radiusMiles,
        isRemote: false,
      };
    } catch (error) {
      logger.error('Error checking radius:', error);
      return { distance: Infinity, withinRadius: false, isRemote: false };
    }
  }

  /**
   * Format location string for display
   * @param location Location object
   * @returns Formatted location string
   */
  static formatLocation(location: ILocation): string {
    const parts = [];
    
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : location.address;
  }

  /**
   * Extract coordinates from various location string formats
   * @param locationString Location string that might contain coordinates
   * @returns Coordinates if found, null otherwise
   */
  static extractCoordinates(locationString: string): { latitude: number; longitude: number } | null {
    try {
      // Pattern for coordinates like "40.7128, -74.0060" or "40.7128,-74.0060"
      const coordPattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
      const match = locationString.match(coordPattern);
      
      if (match) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        
        // Validate coordinate ranges
        if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
          return { latitude, longitude };
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error extracting coordinates:', error);
      return null;
    }
  }

  /**
   * Normalize location string for consistent searching
   * @param locationString Location string to normalize
   * @returns Normalized location string
   */
  static normalizeLocation(locationString: string): string {
    return locationString
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s,-]/g, ''); // Remove special characters except commas and hyphens
  }
}
