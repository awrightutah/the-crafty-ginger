import { useState, useEffect, useRef, useCallback } from 'react';

// Load Google Maps API script dynamically
let googleMapsLoaded = false;
let googleMapsLoading = false;
let callbacks = [];

const loadGoogleMapsAPI = (apiKey, callback) => {
  if (googleMapsLoaded) {
    callback();
    return;
  }
  
  callbacks.push(callback);
  
  if (googleMapsLoading) return;
  
  googleMapsLoading = true;
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    googleMapsLoaded = true;
    googleMapsLoading = false;
    callbacks.forEach(cb => cb());
    callbacks = [];
  };
  
  script.onerror = () => {
    googleMapsLoading = false;
    console.error('Failed to load Google Maps API');
    callbacks = [];
  };
  
  document.head.appendChild(script);
};

export default function AddressAutocomplete({ 
  streetAddress, 
  city, 
  state, 
  zipCode,
  onAddressChange,
  disabled = false,
  apiKey
}) {
  const [isManual, setIsManual] = useState(false);
  const [autocompleteValue, setAutocompleteValue] = useState('');
  const [apiLoaded, setApiLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.address_components) {
        const addressComponents = place.address_components;
        
        // Parse address components
        let streetNumber = '';
        let route = '';
        let locality = '';
        let administrativeArea = '';
        let postalCode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality') || types.includes('sublocality')) {
            locality = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            administrativeArea = component.short_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const fullStreetAddress = streetNumber && route 
          ? `${streetNumber} ${route}` 
          : route || streetNumber;

        onAddressChange({
          street_address: fullStreetAddress,
          city: locality,
          state: administrativeArea,
          zip_code: postalCode
        });
        
        setAutocompleteValue('');
      }
    });
    
    autocompleteRef.current = autocomplete;
  }, [onAddressChange]);

  useEffect(() => {
    if (isManual || !apiKey) return;
    
    loadGoogleMapsAPI(apiKey, () => {
      setApiLoaded(true);
    });
  }, [isManual, apiKey]);

  useEffect(() => {
    if (apiLoaded && !isManual) {
      initAutocomplete();
    }
  }, [apiLoaded, isManual, initAutocomplete]);

  const handleManualChange = (field, value) => {
    onAddressChange({
      street_address: field === 'street' ? value : streetAddress,
      city: field === 'city' ? value : city,
      state: field === 'state' ? value : state,
      zip_code: field === 'zip' ? value : zipCode
    });
  };

  if (isManual || !apiKey || !apiLoaded) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          {apiKey && apiLoaded && (
            <button
              type="button"
              onClick={() => setIsManual(false)}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              Use Address Autocomplete
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Street Address"
            value={streetAddress || ''}
            onChange={(e) => handleManualChange('street', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="City"
              value={city || ''}
              onChange={(e) => handleManualChange('city', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              required
            />
            <input
              type="text"
              placeholder="State"
              value={state || ''}
              onChange={(e) => handleManualChange('state', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              required
            />
          </div>
          <input
            type="text"
            placeholder="ZIP Code"
            value={zipCode || ''}
            onChange={(e) => handleManualChange('zip', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
            required
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <button
          type="button"
          onClick={() => setIsManual(true)}
          className="text-sm text-amber-600 hover:text-amber-700"
        >
          Enter Manually
        </button>
      </div>
      
      {/* Autocomplete Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={autocompleteValue}
          onChange={(e) => setAutocompleteValue(e.target.value)}
          placeholder="Start typing your address..."
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
        />
      </div>

      {/* Display selected address */}
      {(streetAddress || city || state || zipCode) && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-700">Selected Address:</p>
          <p className="text-sm text-gray-600">{streetAddress}</p>
          <p className="text-sm text-gray-600">{city}, {state} {zipCode}</p>
        </div>
      )}
    </div>
  );
}