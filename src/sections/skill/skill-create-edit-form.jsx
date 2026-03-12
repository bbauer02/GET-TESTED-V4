'use client';

import { z } from 'zod';
import { useMemo } from 'react';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useGetSkills } from 'src/actions/skill';

// ----------------------------------------------------------------------

const SkillSchema = z.object({
  label: z.string().min(1, { message: 'Le label est requis !' }),
  description: z.string(),
  parent: z.string().nullable(),
});

// ----------------------------------------------------------------------

function getSkillIri(skill) {
  if (!skill) return null;
  if (typeof skill === 'string') return skill;
  return skill['@id'] || `/api/skills/${skill.id}`;
}

// ----------------------------------------------------------------------

export function SkillCreateEditForm({ currentSkill }) {
  const router = useRouter();

  const isEdit = !!currentSkill;

  const { skills } = useGetSkills();

  const parentOptions = useMemo(
    () => skills.filter((s) => s.id !== currentSkill?.id),
    [skills, currentSkill?.id]
  );

  const defaultValues = useMemo(
    () => ({
      label: currentSkill?.label || 'Communication orale',
      description: currentSkill?.description || 'Capacite a communiquer efficacement a l\'oral dans un contexte professionnel.',
      parent: getSkillIri(currentSkill?.parent) || null,
    }),
    [currentSkill]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(SkillSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        label: data.label,
        description: data.description || '',
        parent: data.parent || null,
      };

      if (isEdit) {
        await axios.patch(`${endpoints.skill.details}/${currentSkill.id}`, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Skill modifie avec succes !');
      } else {
        await axios.post(endpoints.skill.list, payload);
        toast.success('Skill cree avec succes !');
      }

      await mutate(endpoints.skill.list, undefined, { revalidate: false });
      if (isEdit) {
        await mutate(`${endpoints.skill.details}/${currentSkill.id}`, undefined, {
          revalidate: false,
        });
      }

      router.push(paths.dashboard.skill.list);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message ||
          `Erreur lors de ${isEdit ? 'la modification' : 'la creation'} du skill`
      );
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Informations du skill
        </Typography>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Text name="label" label="Label" />

          <Field.Autocomplete
            name="parent"
            label="Skill parent (optionnel)"
            options={parentOptions.map((s) => s['@id'] || `/api/skills/${s.id}`)}
            getOptionLabel={(option) => {
              const found = parentOptions.find(
                (s) => (s['@id'] || `/api/skills/${s.id}`) === option
              );
              return found?.label ?? '';
            }}
            isOptionEqualToValue={(option, value) => option === value}
          />

          <Field.Text
            name="description"
            label="Description"
            multiline
            rows={3}
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Modifier le skill' : 'Creer le skill'}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
