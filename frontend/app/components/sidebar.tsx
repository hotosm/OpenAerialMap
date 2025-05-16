import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
  SimpleGrid
} from '@chakra-ui/react';
import React from 'react';
import type { StacCollection } from 'stac-ts';
import SlSelect from '@shoelace-style/shoelace/dist/react/select/index.js';
import SlOption from '@shoelace-style/shoelace/dist/react/option/index.js';
import type { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/select/index.js';
import type SlSelectElement from '@shoelace-style/shoelace/dist/components/select/select.js';
import { StacFeatureCollection } from '../types/stac';

interface CollectionDropdownProps {
  collections: StacCollection[];
  onSelect: (id: string) => void;
}

function CollectionDropdown({
  collections,
  onSelect
}: CollectionDropdownProps) {
  const handleChange = (event: SlChangeEvent) => {
    const select = event.target as SlSelectElement;
    if (select && select.value) {
      const value = Array.isArray(select.value)
        ? select.value[0]
        : select.value;
      onSelect(value);
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
        {collections.map((collection) => (
          <SlOption key={`collection-${collection.id}`} value={collection.id}>
            {collection.description}
          </SlOption>
        ))}
      </SlSelect>
    </div>
  );
}

interface SidebarProps {
  selectedCollection?: string;
  availableCollections?: StacCollection[];
  handleSelectCollection: (id: string) => void;
  isStacCollectionLoading: boolean;
  isStacCollectionsError: Error | null;
  stacItems: StacFeatureCollection | undefined;
  isStacItemsLoading: boolean;
  isStacItemsError: Error | null;
}

export default function Sidebar({
  selectedCollection,
  availableCollections,
  handleSelectCollection,
  isStacCollectionLoading,
  isStacCollectionsError,
  isStacItemsLoading,
  isStacItemsError,
  stacItems
}: SidebarProps) {
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
              <CollectionDropdown
                collections={availableCollections}
                onSelect={handleSelectCollection}
              />
            </Box>
          </Box>
        </VStack>
      )}

      {selectedCollection && (
        <VStack align='stretch'>
          <Box>
            <VStack align='stretch' marginTop='2' />
          </Box>
        </VStack>
      )}

      {isStacItemsLoading && <Spinner />}

      {isStacItemsError && <span>Failed to load STAC items</span>}

      {stacItems && stacItems.features && stacItems.features.length > 0 && (
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
                >
                  <Box padding='3'>
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
      )}
    </Flex>
  );
}
