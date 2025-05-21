import React from 'react';
import { useStac } from '../context/StacContext';
import { StacItem } from 'stac-ts';
import SlDrawer from '@shoelace-style/shoelace/dist/react/drawer/index.js';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js';
import SlDivider from '@shoelace-style/shoelace/dist/react/divider/index.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/react/button-group/index.js';

interface DetailProps {
  isDetailPaneShown: boolean;
  setShowDetailPane: (isShown: boolean) => void;
}

export default function Detail({
  isDetailPaneShown,
  setShowDetailPane
}: DetailProps) {
  const { selectedItem, stacItems } = useStac();

  const itemData = stacItems?.features.find(
    (item) => item.id === selectedItem
  ) as StacItem | undefined;

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === 'N/A') return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const title = itemData?.id
    ? `${itemData.id} - ${formatDate(itemData.properties?.datetime as string)}`
    : 'Item Details';

  const currentIndex =
    stacItems?.features.findIndex((item) => item.id === selectedItem) ?? -1;

  const totalResults = stacItems?.features.length ?? 0;

  return (
    <SlDrawer
      label={title}
      placement='start'
      open={isDetailPaneShown}
      onSlAfterHide={() => setShowDetailPane(false)}
      style={{ '--size': '420px' } as React.CSSProperties}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          position: 'absolute',
          top: '16px',
          right: '16px'
        }}
      />

      {itemData ? (
        <div style={{ padding: '0 8px' }}>
          <div
            style={{
              backgroundColor: '#f0f2f3',
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '4px'
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <small style={{ color: '#6c757d' }}>UPLOADED BY</small>
              <div>
                {itemData.properties['oam:producer_name']
                  ? (itemData.properties['oam:producer_name'] as string)
                  : 'N/A'}
              </div>
            </div>

            <div
              style={{
                width: '100%',
                height: '210px',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
                backgroundColor: '#e9ecef'
              }}
            >
              {itemData.assets?.thumbnail ? (
                <img
                  src={itemData.assets.thumbnail.href}
                  alt={itemData.id}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div>No image preview available</div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <SlButton size='small' variant='text'>
                <SlIcon slot='prefix' name='eye' />
                Display as
              </SlButton>
              <div>
                <SlButtonGroup>
                  <SlButton size='small' variant='default'>
                    TMS
                  </SlButton>
                  <SlButton size='small' variant='default'>
                    Thumbnail
                  </SlButton>
                </SlButtonGroup>
              </div>
            </div>
          </div>

          {/* Action links */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <SlIcon name='box-arrow-up-right' />
                <span>Open in</span>
              </div>
              <div>
                <a
                  href='#'
                  style={{
                    textDecoration: 'none',
                    color: '#0d6efd',
                    marginRight: '8px'
                  }}
                >
                  iD editor
                </a>
                <a
                  href='#'
                  style={{ textDecoration: 'none', color: '#0d6efd' }}
                >
                  JOSM
                </a>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <SlIcon name='clipboard' />
                <span>Copy image URL</span>
              </div>
              <div>
                <a
                  href='#'
                  style={{
                    textDecoration: 'none',
                    color: '#0d6efd',
                    marginRight: '8px'
                  }}
                >
                  TMS
                </a>
                <a
                  href='#'
                  style={{ textDecoration: 'none', color: '#0d6efd' }}
                >
                  WMTS
                </a>
              </div>
            </div>
          </div>

          <SlDivider style={{ margin: '16px 0' }} />

          {/* Metadata table */}
          <div style={{ margin: '16px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td
                    style={{ padding: '8px 0', color: '#6c757d', width: '30%' }}
                  >
                    DATE
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.properties.created
                      ? formatDate(itemData.properties.created)
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>
                    RESOLUTION
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.properties.gsd ? itemData.properties.gsd : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>
                    PROVIDER
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.properties.providers &&
                    itemData.properties.providers.length
                      ? itemData.properties.providers
                          .map((provider) => provider.name)
                          .join(',')
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>
                    PLATFORM
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.properties.platform
                      ? itemData.properties.platform
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>SENSOR</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.properties.instruments
                      ? itemData.properties.instruments.join(',')
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>
                    IMAGE SIZE
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {itemData.assets.visual
                      ? (itemData.assets.visual['file:size'] as number)
                      : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>TYPE</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    {/* Image + Map Layer */}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6c757d' }}>
                    LICENSE
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <a
                      href='#'
                      style={{ textDecoration: 'none', color: '#0d6efd' }}
                    >
                      {itemData.properties.license
                        ? itemData.properties.license
                        : 'N/A'}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          No item selected or data unavailable
        </div>
      )}

      {/* Footer navigation */}
      <div
        slot='footer'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <SlButton size='small' variant='text' disabled={currentIndex <= 0}>
          <SlIcon slot='prefix' name='chevron-left' />
          Previous
        </SlButton>

        <div>
          {currentIndex + 1} of {totalResults} results
        </div>

        <SlButton
          size='small'
          variant='text'
          disabled={currentIndex >= totalResults - 1}
        >
          Next
          <SlIcon slot='suffix' name='chevron-right' />
        </SlButton>
      </div>
    </SlDrawer>
  );
}
