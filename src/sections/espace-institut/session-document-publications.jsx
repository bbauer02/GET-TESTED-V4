'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import axios, { fetcher, endpoints, extractMembers } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function SessionDocumentPublications({ session, onMutate }) {
  // Fetch all document types
  const { data: docTypesData } = useSWR(endpoints.documentType.list, fetcher, swrOptions);
  const documentTypes = extractMembers(docTypesData);

  // Fetch publications for this session
  const pubUrl = session?.id ? endpoints.session.documentPublications(session.id) : '';
  const { data: pubData, mutate: pubMutate } = useSWR(pubUrl, fetcher, swrOptions);
  const publications = extractMembers(pubData);

  // Build a map: documentType IRI/id → publication
  const publicationMap = new Map();
  publications.forEach((pub) => {
    const dtId = pub.documentType?.id || pub.documentType?.['@id'];
    if (dtId) publicationMap.set(dtId, pub);
    // Also map by IRI
    const dtIri = pub.documentType?.['@id'];
    if (dtIri) publicationMap.set(dtIri, pub);
  });

  const handleToggle = useCallback(
    async (documentType, isPublished, publication) => {
      try {
        if (isPublished && publication) {
          // Unpublish
          const pubId = publication.id || publication['@id']?.split('/').pop();
          await axios.delete(`/api/session-document-publications/${pubId}`);
          toast.success('Document dépublié');
        } else {
          // Publish
          const dtIri = documentType['@id'] || `/api/document-types/${documentType.id}`;
          await axios.post(endpoints.session.documentPublications(session.id), {
            documentType: dtIri,
          });
          toast.success('Document publié');
        }
        pubMutate();
        onMutate?.();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [session?.id, pubMutate, onMutate]
  );

  if (!documentTypes.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Documents publiés"
        subheader="Documents accessibles aux candidats inscrits"
      />

      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          {documentTypes.map((dt) => {
            const dtId = dt.id || dt['@id'];
            const pub = publicationMap.get(dtId) || publicationMap.get(dt['@id']);
            const isPublished = !!pub;
            const isAuto = pub?.isAutoPublished || pub?.autoPublished;

            return (
              <Stack
                key={dtId}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: isPublished ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Iconify
                  icon="solar:document-bold"
                  width={22}
                  sx={{ color: isPublished ? 'primary.main' : 'text.disabled' }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {dt.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dt.code}
                  </Typography>
                </Box>

                {isAuto && (
                  <Label color="info" variant="soft" sx={{ fontSize: 11 }}>
                    Auto
                  </Label>
                )}

                <Switch
                  checked={isPublished}
                  onChange={() => handleToggle(dt, isPublished, pub)}
                  size="small"
                />
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Card>
  );
}
