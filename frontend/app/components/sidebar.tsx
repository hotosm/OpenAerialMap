import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
  SimpleGrid
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import SlSelect from '@shoelace-style/shoelace/dist/react/select/index.js';
import SlOption from '@shoelace-style/shoelace/dist/react/option/index.js';
import type { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/select/index.js';
import type SlSelectElement from '@shoelace-style/shoelace/dist/components/select/select.js';
import { useStac } from '../context/StacContext';
import { StacFeatureCollection } from '../types/stac';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import SlInput from '@shoelace-style/shoelace/dist/react/input/index.js';

function CollectionDropdown() {
  const { availableCollections, handleSelectCollection } = useStac();

  if (!availableCollections) return null;

  const handleChange = (event: SlChangeEvent) => {
    const select = event.target as SlSelectElement;
    if (select && select.value) {
      const value = Array.isArray(select.value)
        ? select.value[0]
        : select.value;
      handleSelectCollection(value);
    }
  };

  return (
    <div>
      <SlSelect
        placeholder='Select a collection'
        size='medium'
        style={{ width: '100%' }}
        onSlChange={handleChange}
      >
        {availableCollections.map((collection) => (
          <SlOption key={`collection-${collection.id}`} value={collection.id}>
            {collection.title}
          </SlOption>
        ))}
      </SlSelect>
    </div>
  );
}
interface SelectableItemsProps {
  stacItems: StacFeatureCollection;
  onSelectionChange: (selectedIds: string[]) => void;
}

function SelectableItems({
  stacItems,
  onSelectionChange
}: SelectableItemsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Update parent when local selection changes
  useEffect(() => {
    onSelectionChange(selectedItems);
  }, [selectedItems, onSelectionChange]);

  const handleItemClick = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const renderThumbnail = (url: string, altText: string) => {
    if (!url) return null;

    return (
      <Box height='200px' width='100%' overflow='hidden'>
        <img
          src={url}
          alt={altText}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </Box>
    );
  };
  return (
    <Box marginTop='6'>
      <Heading size='sm' marginBottom='3'>
        Latest uploads
      </Heading>

      <SimpleGrid columns={2} gap={4}>
        {stacItems.features.map((stacItem) => {
          const startDate = stacItem.properties?.start_datetime
            ? new Date(stacItem.properties.start_datetime)
                .toISOString()
                .split('T')[0]
            : 'No date';

          // Format ground sampling distance (GSD) to include units
          const resolution = stacItem.properties?.gsd
            ? `${Math.round(stacItem.properties.gsd * 100)} cm`
            : 'Unknown';

          const producerName =
            (stacItem.properties?.['oam:producer_name'] as string) ||
            'Unknown producer';

          const title = stacItem.properties?.title || `Item ${stacItem.id}`;

          const thumbnailUrl = stacItem.assets?.thumbnail?.href || '';

          return (
            <Box
              key={`STAC-item-${stacItem.id}`}
              borderWidth='1px'
              borderRadius='md'
              overflow='hidden'
              bg='gray.100'
              borderColor={
                selectedItems.includes(stacItem.id) ? 'blue.500' : 'gray.200'
              }
            >
              <Box
                padding='3'
                onClick={() => handleItemClick(stacItem.id)}
                cursor='pointer'
              >
                <Text fontWeight='semibold' fontSize='sm'>
                  {title}
                </Text>
                <Text fontSize='sm'>
                  {startDate} / {resolution}
                </Text>
                <Text fontSize='sm' color='blue.600'>
                  <span>{producerName}</span>
                </Text>
              </Box>

              {renderThumbnail(thumbnailUrl, title)}
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function FilterComponent() {
  const { filters, handleSetFilter } = useStac();

  return (
    <div>
      <SlInput
        label='Item ID'
        value={filters['itemIdFilter'].itemId || ''}
        placeholder='Item ID...'
        onSlChange={(e) => {
          handleSetFilter({
            ...filters,
            itemIdFilter: { itemId: (e.target as HTMLInputElement).value }
          });
        }}
      />
      <SlInput
        label='Start'
        type='date'
        value={filters['dateFilter'].startDate || undefined}
        placeholder='Start...'
        onSlChange={(e) => {
          handleSetFilter({
            ...filters,
            dateFilter: {
              ...filters['dateFilter'],
              startDate: (e.target as HTMLInputElement).value
            }
          });
        }}
      />
      <SlInput
        label='End'
        type='date'
        value={filters['dateFilter'].endDate || undefined}
        placeholder='End...'
        onSlChange={(e) => {
          handleSetFilter({
            ...filters,
            dateFilter: {
              ...filters['dateFilter'],
              endDate: (e.target as HTMLInputElement).value
            }
          });
        }}
      />
      <SlButton variant='primary'>Filter</SlButton>
    </div>
  );
}

export default function Sidebar() {
  const {
    selectedCollection,
    availableCollections,
    isStacCollectionLoading,
    isStacCollectionsError,
    isStacItemsLoading,
    isStacItemsError,
    stacItems,
    setSelectedItems
  } = useStac();

  return (
    <Flex
      width='480px'
      height='100vh'
      direction='column'
      padding='4'
      overflow='auto'
      borderRight='1px'
      borderColor='gray.200'
    >
      <Heading size='md' marginBottom='4'>
        OpenAerialMap STAC Catalog
      </Heading>

      {isStacCollectionLoading && <Spinner />}

      {isStacCollectionsError && <span>Failed to load STAC catalog</span>}

      {availableCollections && availableCollections.length > 0 && (
        <VStack align='stretch'>
          <Box>
            <Text fontWeight='bold'>Collections:</Text>
            <Box marginTop='2'>
              <CollectionDropdown />
            </Box>
          </Box>
        </VStack>
      )}

      {selectedCollection && (
        <VStack align='stretch'>
          <Box>
            <Text fontWeight='bold'>Filter:</Text>
            <Box marginTop='2'>
              <FilterComponent />
            </Box>
          </Box>
        </VStack>
      )}

      {isStacItemsLoading && <Spinner />}

      {isStacItemsError && <span>Failed to load STAC items</span>}

      {stacItems && stacItems.features && stacItems.features.length > 0 && (
        <SelectableItems
          stacItems={stacItems}
          onSelectionChange={setSelectedItems}
        />
      )}
    </Flex>
  );
}
