// Mock node-geocoder before importing LocationUtils
const mockGeocode = jest.fn();
const mockReverse = jest.fn();

jest.mock('node-geocoder', () => {
  return jest.fn().mockImplementation(() => ({
    geocode: (...args: any[]) => mockGeocode(...args),
    reverse: (...args: any[]) => mockReverse(...args),
  }));
});

import { LocationUtils } from '../../src/utils/location.util';

describe('LocationUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const lat1 = 40.7128;
      const lon1 = -74.0060;
      const lat2 = 34.0522;
      const lon2 = -118.2437;

      const distance = LocationUtils.calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(3000);
      expect(typeof distance).toBe('number');
    });

    it('should return 0 for same coordinates', () => {
      const lat = 40.7128;
      const lon = -74.0060;

      const distance = LocationUtils.calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = LocationUtils.calculateDistance(-40.7128, -74.0060, -34.0522, -118.2437);

      expect(distance).toBeGreaterThan(0);
    });

    it('should round to 2 decimal places', () => {
      const distance = LocationUtils.calculateDistance(40.7128, -74.0060, 40.7130, -74.0062);

      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('toRadians', () => {
    it('should convert degrees to radians', () => {
      const degrees = 180;
      const radians = LocationUtils.toRadians(degrees);

      expect(radians).toBeCloseTo(Math.PI, 5);
    });

    it('should convert 0 degrees to 0 radians', () => {
      const radians = LocationUtils.toRadians(0);
      expect(radians).toBe(0);
    });

    it('should convert 90 degrees to π/2 radians', () => {
      const radians = LocationUtils.toRadians(90);
      expect(radians).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode address successfully', async () => {
      const mockResult = {
        latitude: 40.7128,
        longitude: -74.0060,
        formattedAddress: 'New York, NY, USA',
        city: 'New York',
        state: 'NY',
        country: 'USA',
      };

      mockGeocode.mockResolvedValue([mockResult]);

      const result = await LocationUtils.geocodeAddress('New York, NY');

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
        city: 'New York',
        state: 'NY',
        country: 'USA',
      });
      expect(mockGeocode).toHaveBeenCalledWith('New York, NY');
    });

    it('should return null for empty address', async () => {
      const result = await LocationUtils.geocodeAddress('');

      expect(result).toBeNull();
      expect(mockGeocode).not.toHaveBeenCalled();
    });

    it('should return null for whitespace-only address', async () => {
      const result = await LocationUtils.geocodeAddress('   ');

      expect(result).toBeNull();
    });

    it('should return null when no results found', async () => {
      mockGeocode.mockResolvedValue([]);

      const result = await LocationUtils.geocodeAddress('Invalid Address 12345');

      expect(result).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      const mockResult = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      mockGeocode.mockResolvedValue([mockResult]);

      const result = await LocationUtils.geocodeAddress('Some Address');

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Some Address',
        city: undefined,
        state: undefined,
        country: undefined,
      });
    });

    it('should handle geocoding errors', async () => {
      mockGeocode.mockRejectedValue(new Error('Geocoding failed'));

      const result = await LocationUtils.geocodeAddress('New York');

      expect(result).toBeNull();
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates successfully', async () => {
      const mockResult = {
        formattedAddress: 'New York, NY, USA',
        city: 'New York',
        state: 'NY',
        country: 'USA',
      };

      mockReverse.mockResolvedValue([mockResult]);

      const result = await LocationUtils.reverseGeocode(40.7128, -74.0060);

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
        city: 'New York',
        state: 'NY',
        country: 'USA',
      });
      expect(mockReverse).toHaveBeenCalledWith({
        lat: 40.7128,
        lon: -74.0060,
      });
    });

    it('should return null when no results found', async () => {
      mockReverse.mockResolvedValue([]);

      const result = await LocationUtils.reverseGeocode(0, 0);

      expect(result).toBeNull();
    });

    it('should use coordinates as address when formattedAddress is missing', async () => {
      const mockResult = {};

      mockReverse.mockResolvedValue([mockResult]);

      const result = await LocationUtils.reverseGeocode(40.7128, -74.0060);

      expect(result?.address).toContain('40.7128');
      expect(result?.address).toContain('-74.006');
    });

    it('should handle reverse geocoding errors', async () => {
      mockReverse.mockRejectedValue(new Error('Reverse geocoding failed'));

      const result = await LocationUtils.reverseGeocode(40.7128, -74.0060);

      expect(result).toBeNull();
    });
  });

  describe('parseLocationString', () => {
    it('should detect remote location', () => {
      const result = LocationUtils.parseLocationString('Remote');
      expect(result.isRemote).toBe(true);
    });

    it('should detect work from home', () => {
      const result = LocationUtils.parseLocationString('Work from home');
      expect(result.isRemote).toBe(true);
    });

    it('should detect WFH', () => {
      const result = LocationUtils.parseLocationString('WFH');
      expect(result.isRemote).toBe(true);
    });

    it('should detect virtual', () => {
      const result = LocationUtils.parseLocationString('Virtual position');
      expect(result.isRemote).toBe(true);
    });

    it('should parse city, state, country', () => {
      const result = LocationUtils.parseLocationString('Vancouver, BC, Canada');

      expect(result.isRemote).toBe(false);
      expect(result.city).toBe('Vancouver');
      expect(result.state).toBe('BC');
      expect(result.country).toBe('Canada');
    });

    it('should parse city and state', () => {
      const result = LocationUtils.parseLocationString('New York, NY');

      expect(result.isRemote).toBe(false);
      expect(result.city).toBe('New York');
      expect(result.state).toBe('NY');
      expect(result.country).toBeUndefined();
    });

    it('should parse city only', () => {
      const result = LocationUtils.parseLocationString('Seattle');

      expect(result.isRemote).toBe(false);
      expect(result.city).toBe('Seattle');
      expect(result.state).toBeUndefined();
      expect(result.country).toBeUndefined();
    });

    it('should handle case insensitive remote detection', () => {
      const result = LocationUtils.parseLocationString('REMOTE');
      expect(result.isRemote).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = LocationUtils.parseLocationString('  Vancouver  ,  BC  ,  Canada  ');

      expect(result.city).toBe('Vancouver');
      expect(result.state).toBe('BC');
      expect(result.country).toBe('Canada');
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for remote jobs', async () => {
      const result = await LocationUtils.isWithinRadius(
        'Remote',
        { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        50
      );

      expect(result.withinRadius).toBe(true);
      expect(result.isRemote).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('should return false when geocoding fails', async () => {
      mockGeocode.mockResolvedValue([]);

      const result = await LocationUtils.isWithinRadius(
        'Invalid Location',
        { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        50
      );

      expect(result.withinRadius).toBe(false);
      expect(result.isRemote).toBe(false);
      expect(result.distance).toBe(Infinity);
    });

    it('should return true when within radius', async () => {
      const mockResult = {
        latitude: 40.7130,
        longitude: -74.0062,
        formattedAddress: 'Nearby Location',
      };

      mockGeocode.mockResolvedValue([mockResult]);

      const result = await LocationUtils.isWithinRadius(
        'Nearby Location',
        { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        50
      );

      expect(result.withinRadius).toBe(true);
      expect(result.isRemote).toBe(false);
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    it('should return false when outside radius', async () => {
      const mockResult = {
        latitude: 34.0522,
        longitude: -118.2437,
        formattedAddress: 'Los Angeles, CA',
      };

      mockGeocode.mockResolvedValue([mockResult]);

      const result = await LocationUtils.isWithinRadius(
        'Los Angeles, CA',
        { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        50
      );

      expect(result.withinRadius).toBe(false);
      expect(result.isRemote).toBe(false);
      expect(result.distance).toBeGreaterThan(50);
    });

    it('should handle errors gracefully', async () => {
      mockGeocode.mockRejectedValue(new Error('Geocoding error'));

      const result = await LocationUtils.isWithinRadius(
        'Some Location',
        { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        50
      );

      expect(result.withinRadius).toBe(false);
      expect(result.distance).toBe(Infinity);
    });
  });

  describe('formatLocation', () => {
    it('should format location with all fields', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
        city: 'New York',
        state: 'NY',
        country: 'USA',
      };

      const result = LocationUtils.formatLocation(location);

      expect(result).toBe('New York, NY, USA');
    });

    it('should format location with city and state', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York',
        city: 'New York',
        state: 'NY',
      };

      const result = LocationUtils.formatLocation(location);

      expect(result).toBe('New York, NY');
    });

    it('should use address when no city/state/country', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Some Address',
      };

      const result = LocationUtils.formatLocation(location);

      expect(result).toBe('Some Address');
    });

    it('should handle empty parts', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Fallback Address',
        city: '',
        state: undefined,
        country: null as any,
      };

      const result = LocationUtils.formatLocation(location);

      expect(result).toBe('Fallback Address');
    });
  });

  describe('extractCoordinates', () => {
    it('should extract coordinates from string', () => {
      const result = LocationUtils.extractCoordinates('40.7128, -74.0060');

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    });

    it('should extract coordinates without space', () => {
      const result = LocationUtils.extractCoordinates('40.7128,-74.0060');

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    });

    it('should return null for invalid coordinates', () => {
      const result = LocationUtils.extractCoordinates('Invalid string');

      expect(result).toBeNull();
    });

    it('should return null for out of range latitude', () => {
      const result = LocationUtils.extractCoordinates('100, -74.0060');

      expect(result).toBeNull();
    });

    it('should return null for out of range longitude', () => {
      const result = LocationUtils.extractCoordinates('40.7128, -200');

      expect(result).toBeNull();
    });

    it('should handle negative coordinates', () => {
      const result = LocationUtils.extractCoordinates('-40.7128, -74.0060');

      expect(result).toEqual({
        latitude: -40.7128,
        longitude: -74.0060,
      });
    });

    it('should handle extraction errors', () => {
      const result = LocationUtils.extractCoordinates(null as any);

      expect(result).toBeNull();
    });
  });

  describe('normalizeLocation', () => {
    it('should normalize location string', () => {
      const result = LocationUtils.normalizeLocation('  New York, NY  ');

      expect(result).toBe('new york, ny');
    });

    it('should replace multiple spaces with single space', () => {
      const result = LocationUtils.normalizeLocation('New    York');

      expect(result).toBe('new york');
    });

    it('should remove special characters', () => {
      const result = LocationUtils.normalizeLocation('New York!@#$%');

      expect(result).toBe('new york');
    });

    it('should preserve commas and hyphens', () => {
      const result = LocationUtils.normalizeLocation('New York, NY - USA');

      expect(result).toBe('new york, ny - usa');
    });

    it('should convert to lowercase', () => {
      const result = LocationUtils.normalizeLocation('VANCOUVER');

      expect(result).toBe('vancouver');
    });
  });
});
