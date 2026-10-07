'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { MEMBER_ROLES, inviteMember, isAlreadyMemberError } from 'src/actions/institute-team';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const DEFAULT_VALUES = { email: '', firstname: '', lastname: '', role: 'STAFF' };

export function InstituteMemberInviteDialog({ open, onClose, instituteId }) {
  const { t } = useTranslate('institute_space');

  const InviteSchema = useMemo(
    () =>
      z.object({
        email: schemaUtils.email({
          error: { required: t('invite_email_required'), invalid: t('invite_email_invalid') },
        }),
        firstname: z.string().min(1, { message: t('invite_firstname_required') }),
        lastname: z.string().min(1, { message: t('invite_lastname_required') }),
        role: z.enum(MEMBER_ROLES),
      }),
    [t]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(InviteSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await inviteMember({ instituteId, ...data });
      toast.success(t('invite_success', { email: data.email }));
      onClose();
    } catch (error) {
      console.error(error);
      if (isAlreadyMemberError(error)) {
        toast.error(t('invite_already_member'));
      } else {
        toast.error(error?.message || t('invite_error'));
      }
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t('invite_title')}</DialogTitle>

        <DialogContent>
          <Box
            sx={{
              pt: 1,
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Text name="email" label={t('invite_email')} sx={{ gridColumn: '1 / -1' }} />
            <Field.Text name="firstname" label={t('invite_firstname')} />
            <Field.Text name="lastname" label={t('invite_lastname')} />

            <Field.Select name="role" label={t('invite_role')} sx={{ gridColumn: '1 / -1' }}>
              {MEMBER_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {t(`role_${role.toLowerCase()}`)}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel')}
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('invite_send')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
