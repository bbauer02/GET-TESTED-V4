'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axiosInstance, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const DocumentTypeSchema = z.object({
  label: z.string().min(1, { error: 'Le nom est requis !' }),
  code: z
    .string()
    .min(1, { error: 'Le code est requis !' })
    .regex(/^[A-Z][A-Z0-9_]*$/, {
      error: 'Le code doit commencer par une majuscule et ne contenir que A-Z, 0-9, _',
    }),
});

// ----------------------------------------------------------------------

export function DocumentTypeCreateEditForm({ currentDocumentType }) {
  const { t } = useTranslate('document_type');
  const router = useRouter();

  const isEdit = !!currentDocumentType;

  const defaultValues = useMemo(
    () => ({
      label: currentDocumentType?.label || '',
      code: currentDocumentType?.code || '',
    }),
    [currentDocumentType]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(DocumentTypeSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await axiosInstance.patch(
          `${endpoints.documentType.details}/${currentDocumentType.id}`,
          data,
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        toast.success(t('edit_success'));
      } else {
        await axiosInstance.post(endpoints.documentType.list, data);
        toast.success(t('create_success'));
      }

      await mutate(endpoints.documentType.list, undefined, { revalidate: true });

      router.push(paths.dashboard.documentType.root);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message || (isEdit ? t('edit_error') : t('create_error'))
      );
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text name="label" label={t('label_name')} />

          <Field.Text
            name="code"
            label={t('label_code')}
            helperText={t('code_helper')}
          />
        </Stack>

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? t('submit_edit') : t('submit_create')}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
