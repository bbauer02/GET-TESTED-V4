'use client';

import { z } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/lib/axios';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { Form, Field } from 'src/components/hook-form';

import { MergeField } from 'src/components/editor/extension/merge-field';
import { MergeFieldBlock } from 'src/components/editor/components/merge-field-block';

import { useGetDocumentTypes } from 'src/actions/document-template';
import { MERGE_FIELD_CATEGORIES } from './utils/merge-fields';

// ----------------------------------------------------------------------

const DocumentTemplateSchema = z.object({
  label: z.string().min(1, { message: 'Le nom est requis' }),
  documentType: z.string().min(1, { message: 'Le type est requis' }),
  content: z.string().min(1, { message: 'Le contenu est requis' }),
});

// ----------------------------------------------------------------------

export function DocumentTemplateCreateEditForm({ currentTemplate, instituteId }) {
  const router = useRouter();
  const { documentTypes } = useGetDocumentTypes();

  const isEdit = !!currentTemplate;

  const defaultValues = useMemo(
    () => ({
      label: currentTemplate?.label || '',
      documentType: currentTemplate?.documentType?.['@id'] || currentTemplate?.documentType?.id
        ? `/api/document-types/${currentTemplate.documentType.id}`
        : '',
      content: currentTemplate?.content || '',
    }),
    [currentTemplate]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(DocumentTemplateSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentTemplate) {
      reset({
        label: currentTemplate.label || '',
        documentType: currentTemplate.documentType?.['@id'] || currentTemplate.documentType?.id
          ? `/api/document-types/${currentTemplate.documentType.id}`
          : '',
        content: currentTemplate.content || '',
      });
    }
  }, [currentTemplate, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await axiosInstance.patch(`${endpoints.documentTemplate.details}/${currentTemplate.id}`, data, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Modele mis a jour !');
      } else {
        await axiosInstance.post(endpoints.documentTemplate.create(instituteId), data);
        toast.success('Modele cree !');
      }
      router.push(paths.dashboard.espaceInstitut.documents);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const renderMergeFieldDropdown = (editor) => (
    <MergeFieldBlock editor={editor} mergeFields={MERGE_FIELD_CATEGORIES} />
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text name="label" label="Nom du modele" />

          <Field.Select name="documentType" label="Type de document">
            {documentTypes.map((dt) => (
              <MenuItem key={dt.id} value={`/api/document-types/${dt.id}`}>
                {dt.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Editor
            name="content"
            fullItem
            extraExtensions={[MergeField]}
            extraToolbarContent={renderMergeFieldDropdown}
            placeholder="Redigez votre modele de document ici..."
          />

          <Stack direction="row" justifyContent="flex-end">
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {isEdit ? 'Enregistrer' : 'Creer le modele'}
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>
    </Form>
  );
}
