import React from 'react';

// Define the possible address types
type AddressType = string | Record<string, any> | null | undefined;

interface AddressDisplayProps {
  address: AddressType;
  className?: string;
}

/**
 * A component that safely renders an address in various formats
 */
const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, className = '' }) => {
  // Function to safely convert an address to a displayable string
  const getAddressString = (addr: AddressType): string => {
    // Handle string addresses
    if (typeof addr === 'string') {
      return addr;
    }
    
    // Handle null/undefined
    if (!addr) {
      return 'No address';
    }
    
    // Handle empty objects
    if (typeof addr === 'object' && Object.keys(addr).length === 0) {
      return 'No address details';
    }
    
    // Handle address objects with standard properties
    if (typeof addr === 'object') {
      try {
        // Try standard address format first
        const standardParts = [
          addr.street,
          addr.city,
          addr.state,
          addr.zipCode,
          addr.country
        ].filter(Boolean);
        
        if (standardParts.length > 0) {
          return standardParts.join(', ');
        }
        
        // Try alternative property names
        const altParts = [
          addr.street_address || addr.streetAddress,
          addr.city,
          addr.state || addr.province,
          addr.zip || addr.zipCode || addr.postal_code || addr.postalCode,
          addr.country
        ].filter(Boolean);
        
        if (altParts.length > 0) {
          return altParts.join(', ');
        }
        
        // Last resort: extract any string values from the object
        const values = Object.values(addr).filter(
          val => val && typeof val !== 'object' && typeof val !== 'function'
        );
        
        if (values.length > 0) {
          return values.join(', ');
        }
      } catch (err) {
        console.error('Error formatting address:', err);
      }
    }
    
    // Default fallback
    return 'Address unavailable';
  };

  return (
    <span className={className}>
      {getAddressString(address)}
    </span>
  );
};

export default AddressDisplay;
