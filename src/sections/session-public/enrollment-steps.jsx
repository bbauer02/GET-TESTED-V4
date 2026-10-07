'use client';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import { styled } from '@mui/material/styles';
import StepLabel, { stepLabelClasses } from '@mui/material/StepLabel';
import MuiStepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function useEnrollmentSteps() {
  const { t } = useTranslate('sessions');

  const ENROLLMENT_STEPS_GUEST = [
    t('step_exams'),
    t('step_register'),
    t('step_recap'),
    t('step_payment'),
  ];

  const ENROLLMENT_STEPS_AUTH = [
    t('step_exams'),
    t('step_recap'),
    t('step_payment'),
  ];

  return { ENROLLMENT_STEPS_GUEST, ENROLLMENT_STEPS_AUTH };
}

// Keep these for backward compatibility (static French)
export const ENROLLMENT_STEPS_GUEST = [
  'Examens',
  'Inscription',
  'Récapitulatif',
  'Paiement',
];

export const ENROLLMENT_STEPS_AUTH = [
  'Examens',
  'Récapitulatif',
  'Paiement',
];

// ----------------------------------------------------------------------

export function EnrollmentSteps({ activeStep, steps, sx, ...other }) {
  const stepLabels = steps || ENROLLMENT_STEPS_GUEST;

  return (
    <Stepper
      alternativeLabel
      activeStep={activeStep}
      connector={<StepConnector />}
      sx={[{ mb: { xs: 3, md: 5 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      {stepLabels.map((label) => (
        <Step key={label}>
          <StepLabel
            slots={{ stepIcon: StepIcon }}
            sx={{ [`& .${stepLabelClasses.label}`]: { fontWeight: 'fontWeightSemiBold' } }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

// ----------------------------------------------------------------------

const StepConnector = styled(MuiStepConnector)(({ theme }) => ({
  top: 10,
  left: 'calc(-50% + 20px)',
  right: 'calc(50% + 20px)',
  [`& .${stepConnectorClasses.line}`]: {
    borderTopWidth: 2,
    borderColor: theme.vars.palette.divider,
  },
  [`&.${stepConnectorClasses.active}, &.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: theme.vars.palette.primary.main },
  },
}));

function StepIcon({ active, completed }) {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        color: 'text.disabled',
        justifyContent: 'center',
        ...(active && { color: 'primary.main' }),
      }}
    >
      {completed ? (
        <Iconify icon="eva:checkmark-fill" sx={{ color: 'primary.main' }} />
      ) : (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
    </Box>
  );
}
