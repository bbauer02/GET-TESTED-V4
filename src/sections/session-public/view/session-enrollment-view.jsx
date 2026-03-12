'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'sonner';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { useGetPublicSession } from 'src/actions/session-public';

import { EnrollmentSteps, ENROLLMENT_STEPS } from '../enrollment-steps';
import { EnrollmentStepExams } from '../enrollment-step-exams';
import { EnrollmentStepRegister } from '../enrollment-step-register';
import { EnrollmentStepRecap } from '../enrollment-step-recap';
import { EnrollmentStepPayment } from '../enrollment-step-payment';

// ----------------------------------------------------------------------

export function SessionEnrollmentView({ sessionId }) {
  const { session, sessionLoading, sessionError } = useGetPublicSession(sessionId);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [registrationData, setRegistrationData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'processing' | 'success' | 'pending_payment' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Step 1: Toggle optional exam ---
  const handleToggleExam = useCallback((examId) => {
    setSelectedExamIds((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId]
    );
  }, []);

  // --- Step navigation ---
  const handleNextExams = useCallback(() => {
    setActiveStep(1);
  }, []);

  const handleNextRegister = useCallback((data) => {
    setRegistrationData(data);
    setActiveStep(2);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  // --- Build the list of scheduledExam IDs to enroll ---
  const getEnrollmentExamIds = useCallback(() => {
    const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];
    return scheduledExams
      .filter((se) => {
        if (!se.exam?.isOption) return true; // mandatory
        return selectedExamIds.includes(se.id || se['@id']);
      })
      .map((se) => se.id || se['@id']);
  }, [session, selectedExamIds]);

  // --- Submit: register user + enroll ---
  const handleSubmitEnrollment = useCallback(async (payNow) => {
    setIsSubmitting(true);
    setPaymentStatus('processing');
    setActiveStep(3);

    try {
      // 1. Register user (only fields in user:write:register group)
      const registerPayload = {
        email: registrationData.email,
        password: registrationData.password,
        civility: registrationData.civility,
        firstname: registrationData.firstname,
        lastname: registrationData.lastname,
      };

      try {
        await axiosInstance.post(endpoints.auth.signUp, registerPayload);
      } catch (registerError) {
        // The API may throw a mailer error even though the user was created successfully.
        // Try to login anyway — if the user doesn't exist, login will fail and we'll catch that.
        console.warn('Register endpoint error (may be mailer):', registerError.message);
      }

      // 2. Login to get token
      const loginRes = await axiosInstance.post(endpoints.auth.signIn, {
        email: registrationData.email,
        password: registrationData.password,
      });

      const token = loginRes.data?.token || loginRes.data?.access_token || loginRes.data?.accessToken;
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

      // 3. Update profile with address, phone, gender (user:write:self group)
      const profilePayload = {
        address: {
          address1: registrationData.address1,
          address2: registrationData.address2 || '',
          zipcode: registrationData.zipcode,
          city: registrationData.city,
          countryCode: registrationData.countryCode,
        },
      };
      if (registrationData.phone) {
        profilePayload.phone = registrationData.phone;
      }
      if (registrationData.gender) {
        profilePayload.gender = registrationData.gender;
      }

      await axiosInstance.patch(endpoints.user.update, profilePayload, {
        ...authHeaders,
        headers: { ...authHeaders.headers, 'Content-Type': 'application/merge-patch+json' },
      });

      // 4. Enroll in session
      const enrollRes = await axiosInstance.post(
        endpoints.session.enroll(sessionId),
        {
          scheduledExamIds: getEnrollmentExamIds(),
        },
        authHeaders,
      );

      // 4. If pay now → create Stripe checkout session
      if (payNow) {
        try {
          const enrollmentId = enrollRes.data?.id || enrollRes.data?.['@id']?.split('/').pop();
          // TODO: Call API to create Stripe Checkout Session for this enrollment
          // For now, mark as success since Stripe integration needs backend endpoint
          setPaymentStatus('success');
          toast.success('Inscription confirmee !');
        } catch (stripeError) {
          // Enrollment done, but payment failed
          setPaymentStatus('error');
          toast.error('Inscription enregistree, mais le paiement a echoue.');
        }
      } else {
        // Pay later
        setPaymentStatus('pending_payment');
        toast.success('Inscription enregistree. Paiement en attente.');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      setPaymentStatus('error');
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  }, [registrationData, sessionId, getEnrollmentExamIds]);

  // --- Loading / Error ---
  if (sessionLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (sessionError || !session) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Session introuvable</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Cette session n&apos;existe pas ou n&apos;est plus disponible.
        </Typography>
      </Container>
    );
  }

  // --- Session Header ---
  const assessment = session?.assessment || {};
  const institute = session?.institute || {};

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Session header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                fontWeight: 'bold',
                fontSize: 22,
              }}
            >
              {(institute.label || '?')[0].toUpperCase()}
            </Box>
            <Box>
              <Typography variant="h5">
                {assessment.label || 'Session de test'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {institute.label}
                {session.start && (
                  <> &middot; {new Date(session.start).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}</>
                )}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stepper */}
      <EnrollmentSteps activeStep={activeStep} />

      {/* Step content */}
      {activeStep === 0 && (
        <EnrollmentStepExams
          session={session}
          selectedExamIds={selectedExamIds}
          onToggleExam={handleToggleExam}
          onNext={handleNextExams}
        />
      )}

      {activeStep === 1 && (
        <EnrollmentStepRegister
          registrationData={registrationData}
          onNext={handleNextRegister}
          onBack={handleBack}
        />
      )}

      {activeStep === 2 && (
        <EnrollmentStepRecap
          session={session}
          selectedExamIds={selectedExamIds}
          registrationData={registrationData}
          onBack={handleBack}
          onPayNow={() => handleSubmitEnrollment(true)}
          onPayLater={() => handleSubmitEnrollment(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {activeStep === 3 && (
        <EnrollmentStepPayment status={paymentStatus} />
      )}
    </Container>
  );
}
