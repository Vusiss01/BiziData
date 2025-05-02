import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Restaurant, WorkingHours, addRestaurant } from '@/services/restaurantService';
import { getRestaurantOwners } from '@/services/userService';
import WorkingHoursSelector from './WorkingHoursSelector';
import useErrorHandler from '@/hooks/useErrorHandler';
import { ErrorCategory } from '@/utils/errorHandler';
import FileUpload from '@/components/common/FileUpload';
import * as storageService from '@/services/storageService';

interface AddRestaurantFormProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const cuisineOptions = [
  'American', 'Italian', 'Chinese', 'Japanese', 'Mexican',
  'Indian', 'Thai', 'Mediterranean', 'French', 'Greek',
  'Spanish', 'Korean', 'Vietnamese', 'Middle Eastern', 'Vegetarian',
  'Vegan', 'Seafood', 'Steakhouse', 'Pizza', 'Burger',
  'Dessert', 'Bakery', 'Cafe', 'Fast Food', 'Other'
];

const AddRestaurantForm: React.FC<AddRestaurantFormProps> = ({ onSuccess, onClose }) => {
  const { toast } = useToast();
  const { handleAsync, clearError } = useErrorHandler({
    component: 'AddRestaurantForm',
    showToast: true
  });

  // Form state
  const [formData, setFormData] = useState<Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    cuisine: [],
    priceRange: 2,
    status: 'active',
    owner_id: '',
    working_hours: [],
  });

  // Image state
  const [displayPicture, setDisplayPicture] = useState<File | null>(null);
  const [backgroundPicture, setBackgroundPicture] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    display: number;
    background: number;
  }>({ display: 0, background: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');

  // Fetch restaurant owners
  const { data: ownersData, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['restaurantOwners'],
    queryFn: async () => {
      const result = await getRestaurantOwners();
      return result.data || [];
    },
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle price range change
  const handlePriceRangeChange = (value: string) => {
    setFormData({
      ...formData,
      priceRange: parseInt(value),
    });
  };

  // Handle cuisine selection
  const handleCuisineChange = (value: string) => {
    setSelectedCuisine(value);
  };

  // Add cuisine to the list
  const handleAddCuisine = () => {
    if (selectedCuisine && !formData.cuisine?.includes(selectedCuisine)) {
      setFormData({
        ...formData,
        cuisine: [...(formData.cuisine || []), selectedCuisine],
      });
      setSelectedCuisine('');
    }
  };

  // Remove cuisine from the list
  const handleRemoveCuisine = (cuisine: string) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine?.filter(c => c !== cuisine),
    });
  };

  // Handle working hours change
  const handleWorkingHoursChange = (workingHours: WorkingHours[]) => {
    setFormData({
      ...formData,
      working_hours: workingHours,
    });
  };

  // Upload images to Firebase Storage
  const uploadImages = async (restaurantId: string) => {
    const imageUrls: { display_picture?: string; background_picture?: string } = {};

    // Upload display picture if provided
    if (displayPicture) {
      const displayResult = await storageService.uploadFile(displayPicture, {
        folderPath: `restaurants/${restaurantId}`,
        fileName: `display.${displayPicture.name.split('.').pop()}`,
        onProgress: (progress) => {
          setUploadProgress(prev => ({ ...prev, display: progress }));
        }
      });

      if (displayResult.error) {
        throw new Error(`Failed to upload display picture: ${displayResult.error.message}`);
      }

      if (displayResult.url) {
        imageUrls.display_picture = displayResult.url;
      }
    }

    // Upload background picture if provided
    if (backgroundPicture) {
      const backgroundResult = await storageService.uploadFile(backgroundPicture, {
        folderPath: `restaurants/${restaurantId}`,
        fileName: `background.${backgroundPicture.name.split('.').pop()}`,
        onProgress: (progress) => {
          setUploadProgress(prev => ({ ...prev, background: progress }));
        }
      });

      if (backgroundResult.error) {
        throw new Error(`Failed to upload background picture: ${backgroundResult.error.message}`);
      }

      if (backgroundResult.url) {
        imageUrls.background_picture = backgroundResult.url;
      }
    }

    return imageUrls;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Basic validation
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Restaurant name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.owner_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a restaurant owner',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        console.log('Creating restaurant with data:', formData);

        // Add restaurant to Firestore
        const restaurantId = await addRestaurant(formData);

        if (!restaurantId) {
          throw new Error('Failed to create restaurant');
        }

        console.log('Restaurant created successfully with ID:', restaurantId);

        // Upload images if provided
        if (displayPicture || backgroundPicture) {
          console.log('Uploading restaurant images...');
          const imageUrls = await uploadImages(restaurantId);

          // Update restaurant with image URLs
          if (Object.keys(imageUrls).length > 0) {
            const { updateRestaurant } = await import('@/services/restaurantService');
            await updateRestaurant(restaurantId, imageUrls);
            console.log('Restaurant updated with image URLs:', imageUrls);
          }
        }

        toast({
          title: 'Success',
          description: `Restaurant "${formData.name}" created successfully`,
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Close the form
        onClose();

        return restaurantId;
      },
      {
        action: 'createRestaurant',
        category: ErrorCategory.DATABASE,
        userMessage: 'Failed to create restaurant. Please try again.',
        finallyCallback: () => setIsSubmitting(false),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
      <div className="text-lg font-medium mb-4 pb-2 border-b">Restaurant Images</div>

      {/* Restaurant Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <FileUpload
            label="Display Picture (Logo)"
            description="Upload a logo or display picture for the restaurant (JPG, PNG, max 5MB)"
            accept="image/jpeg,image/png"
            value={displayPicture}
            onChange={setDisplayPicture}
            isUploading={isSubmitting && displayPicture !== null}
            className="w-full"
          />
          {isSubmitting && displayPicture && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress.display}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <FileUpload
            label="Background Picture (Cover)"
            description="Upload a background or cover image for the restaurant (JPG, PNG, max 5MB)"
            accept="image/jpeg,image/png"
            value={backgroundPicture}
            onChange={setBackgroundPicture}
            isUploading={isSubmitting && backgroundPicture !== null}
            className="w-full"
          />
          {isSubmitting && backgroundPicture && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress.background}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      <div className="text-lg font-medium mb-4 pb-2 border-b">Basic Information</div>

      {/* Restaurant Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Restaurant Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter restaurant name"
          className="h-10 focus-visible:ring-orange-500"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Enter restaurant description"
          className="min-h-[80px] focus-visible:ring-orange-500"
        />
      </div>

      {/* Restaurant Owner */}
      <div className="space-y-2">
        <Label htmlFor="owner_id" className="text-sm font-medium">Restaurant Owner *</Label>
        <Select
          value={formData.owner_id}
          onValueChange={(value) => handleSelectChange('owner_id', value)}
        >
          <SelectTrigger className="h-10 focus-visible:ring-orange-500">
            <SelectValue placeholder="Select restaurant owner" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingOwners ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading owners...</span>
              </div>
            ) : ownersData && ownersData.length > 0 ? (
              ownersData.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                No restaurant owners found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label htmlFor="priceRange" className="text-sm font-medium">Price Range</Label>
        <Select
          value={formData.priceRange?.toString() || '2'}
          onValueChange={handlePriceRangeChange}
        >
          <SelectTrigger className="h-10 focus-visible:ring-orange-500">
            <SelectValue placeholder="Select price range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">$ (Inexpensive)</SelectItem>
            <SelectItem value="2">$$ (Moderate)</SelectItem>
            <SelectItem value="3">$$$ (Expensive)</SelectItem>
            <SelectItem value="4">$$$$ (Very Expensive)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cuisine */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cuisine Types</Label>
        <div className="flex items-center gap-2">
          <Select value={selectedCuisine} onValueChange={handleCuisineChange}>
            <SelectTrigger className="h-10 focus-visible:ring-orange-500 flex-1">
              <SelectValue placeholder="Select cuisine type" />
            </SelectTrigger>
            <SelectContent>
              {cuisineOptions.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCuisine}
            disabled={!selectedCuisine}
          >
            Add
          </Button>
        </div>

        {/* Selected cuisines */}
        {formData.cuisine && formData.cuisine.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.cuisine.map((cuisine) => (
              <div
                key={cuisine}
                className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-sm flex items-center"
              >
                {cuisine}
                <button
                  type="button"
                  className="ml-1 text-orange-800 hover:text-orange-900"
                  onClick={() => handleRemoveCuisine(cuisine)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Contact Information</div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="contact.phone" className="text-sm font-medium">Phone Number</Label>
        <Input
          id="contact.phone"
          name="contact.phone"
          value={formData.contact?.phone || ''}
          onChange={handleInputChange}
          placeholder="Enter phone number"
          className="h-10 focus-visible:ring-orange-500"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="contact.email" className="text-sm font-medium">Email</Label>
        <Input
          id="contact.email"
          name="contact.email"
          type="email"
          value={formData.contact?.email || ''}
          onChange={handleInputChange}
          placeholder="Enter email address"
          className="h-10 focus-visible:ring-orange-500"
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="contact.website" className="text-sm font-medium">Website</Label>
        <Input
          id="contact.website"
          name="contact.website"
          value={formData.contact?.website || ''}
          onChange={handleInputChange}
          placeholder="Enter website URL"
          className="h-10 focus-visible:ring-orange-500"
        />
      </div>

      <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Address</div>

      {/* Street */}
      <div className="space-y-2">
        <Label htmlFor="address.street" className="text-sm font-medium">Street</Label>
        <Input
          id="address.street"
          name="address.street"
          value={formData.address?.street || ''}
          onChange={handleInputChange}
          placeholder="Enter street address"
          className="h-10 focus-visible:ring-orange-500"
        />
      </div>

      {/* City, State, Zip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address.city" className="text-sm font-medium">City</Label>
          <Input
            id="address.city"
            name="address.city"
            value={formData.address?.city || ''}
            onChange={handleInputChange}
            placeholder="Enter city"
            className="h-10 focus-visible:ring-orange-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address.state" className="text-sm font-medium">State/Province</Label>
          <Input
            id="address.state"
            name="address.state"
            value={formData.address?.state || ''}
            onChange={handleInputChange}
            placeholder="Enter state"
            className="h-10 focus-visible:ring-orange-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address.zipCode" className="text-sm font-medium">ZIP/Postal Code</Label>
          <Input
            id="address.zipCode"
            name="address.zipCode"
            value={formData.address?.zipCode || ''}
            onChange={handleInputChange}
            placeholder="Enter ZIP code"
            className="h-10 focus-visible:ring-orange-500"
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="address.country" className="text-sm font-medium">Country</Label>
        <Input
          id="address.country"
          name="address.country"
          value={formData.address?.country || ''}
          onChange={handleInputChange}
          placeholder="Enter country"
          className="h-10 focus-visible:ring-orange-500"
        />
      </div>

      {/* Working Hours */}
      <WorkingHoursSelector
        workingHours={formData.working_hours || []}
        onChange={handleWorkingHoursChange}
      />

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
        <Select
          value={formData.status || 'active'}
          onValueChange={(value) => handleSelectChange('status', value)}
        >
          <SelectTrigger className="h-10 focus-visible:ring-orange-500">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Restaurant'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddRestaurantForm;
