import { useState, useEffect } from 'react';
import SlSelect from '@shoelace-style/shoelace/dist/react/select/index.js';
import SlOption from '@shoelace-style/shoelace/dist/react/option/index.js';
import type { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/select/index.js';
import type SlSelectElement from '@shoelace-style/shoelace/dist/components/select/select.js';
import { useStac } from '../context/StacContext';
import { StacFeatureCollection } from '../types/stac';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import SlInput from '@shoelace-style/shoelace/dist/react/input/index.js';
import SlSpinner from '@shoelace-style/shoelace/dist/react/spinner/index.js';
import { SlIcon } from '@shoelace-style/shoelace/dist/react';

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
  onSelectionChange: (selectedId: string) => void;
  isDetailPaneShown: boolean;
  setShowDetailPane: (isShown: boolean) => void;
}

function SelectableItems({
  stacItems,
  onSelectionChange,
  isDetailPaneShown,
  setShowDetailPane
}: SelectableItemsProps) {
  const [selectedItem, setSelectedItem] = useState<string>();

  // Update parent when local selection changes
  useEffect(() => {
    if (selectedItem) {
      onSelectionChange(selectedItem);
    }
  }, [selectedItem, onSelectionChange]);

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const renderThumbnail = (url: string, altText: string) => {
    if (!url) return null;

    return (
      <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
        <img
          src={url}
          alt={altText}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3
        style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}
      >
        Latest uploads
      </h3>

      <SlButton
        variant='primary'
        onClick={() => setShowDetailPane(isDetailPaneShown ? false : true)}
      >
        {isDetailPaneShown ? 'Hide' : 'Show'} selected item details
      </SlButton>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
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
            <div
              key={`STAC-item-${stacItem.id}`}
              style={{
                border: '1px solid',
                borderRadius: '0.375rem',
                overflow: 'hidden',
                backgroundColor: '#f7fafc',
                borderColor:
                  selectedItem === stacItem.id ? '#e53e3e' : '#e2e8f0'
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleItemClick(stacItem.id)}
              >
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {title}
                  </span>
                  <div style={{ fontSize: '0.875rem' }}>
                    {startDate} / {resolution}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#3182ce' }}>
                    {producerName}
                  </span>
                </div>
                <SlIcon
                  name='info-square'
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setShowDetailPane(isDetailPaneShown ? false : true);
                  }}
                />
              </div>

              {renderThumbnail(thumbnailUrl, title)}
            </div>
          );
        })}
      </div>
    </div>
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
      {/* <SlButton variant='primary'>Filter</SlButton> */}
    </div>
  );
}

interface SidebarProps {
  isDetailPaneShown: boolean;
  setShowDetailPane: (isShown: boolean) => void;
}

export default function Sidebar({
  isDetailPaneShown,
  setShowDetailPane
}: SidebarProps) {
  const {
    selectedCollection,
    availableCollections,
    isStacCollectionLoading,
    isStacCollectionsError,
    isStacItemsLoading,
    isStacItemsError,
    stacItems,
    setSelectedItem
  } = useStac();

  return (
    <div
      style={{
        width: '450px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        overflow: 'auto',
        borderRight: '1px solid #e2e8f0'
      }}
    >
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}
      >
        OpenAerialMap STAC Catalog
      </h2>

      {isStacCollectionLoading && <SlSpinner />}

      {isStacCollectionsError && <span>Failed to load STAC catalog</span>}

      {availableCollections && availableCollections.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <div>
            <span style={{ fontWeight: 'bold' }}>Collections:</span>
            <div style={{ marginTop: '0.5rem' }}>
              <CollectionDropdown />
            </div>
          </div>
        </div>
      )}

      {selectedCollection && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <div>
            <span style={{ fontWeight: 'bold' }}>Filter:</span>
            <div style={{ marginTop: '0.5rem' }}>
              <FilterComponent />
            </div>
          </div>
        </div>
      )}

      {isStacItemsLoading && <SlSpinner />}

      {isStacItemsError && <span>Failed to load STAC items</span>}

      {stacItems && stacItems.features && stacItems.features.length > 0 && (
        <SelectableItems
          stacItems={stacItems}
          onSelectionChange={setSelectedItem}
          isDetailPaneShown={isDetailPaneShown}
          setShowDetailPane={setShowDetailPane}
        />
      )}
    </div>
  );
}
