'use client';

import { toast } from 'sonner';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import axiosInstance, { endpoints } from 'src/lib/axios';
import { waitForInvoicePayment } from 'src/actions/payment';
import { useGetPublicSession } from 'src/actions/session-public';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils';
import { setSession } from 'src/auth/context/jwt';

import { EnrollmentStepExams } from '../enrollment-step-exams';
import { EnrollmentStepRecap } from '../enrollment-step-recap';
import { EnrollmentStepPayment } from '../enrollment-step-payment';
import { EnrollmentStepRegister } from '../enrollment-step-register';
import { EnrollmentSteps, useEnrollmentSteps } from '../enrollment-steps';

// ----------------------------------------------------------------------

export function SessionEnrollmentView({ sessionId, paymentResult }) {
  const { t } = useTranslate('sessions');
  const { session, sessionLoading, sessionError } = useGetPublicSession(sessionId);
  const { user, authenticated } = useAuthContext();
  const { ENROLLMENT_STEPS_AUTH, ENROLLMENT_STEPS_GUEST } = useEnrollmentSteps();

  const isAuth = !!authenticated && !!user;
  const steps = isAuth ? ENROLLMENT_STEPS_AUTH : ENROLLMENT_STEPS_GUEST;

  const [activeStep, setActiveStep] = useState(0);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [registrationData, setRegistrationData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The final step index (payment)
  const paymentStepIndex = steps.length - 1;
  // The recap step index
  const recapStepIndex = paymentStepIndex - 1;

  // --- Payment return handling ---
  const handledPaymentReturn = useRef(false);

  useEffect(() => {
    if (!paymentResult || handledPaymentReturn.current) return;
    handledPaymentReturn.current = true;

    if (paymentResult === 'success') {
      setActiveStep(paymentStepIndex);
      setPaymentStatus('processing');

      const token = sessionStorage.getItem('stripe_return_token');
      const invoiceId = sessionStorage.getItem('stripe_return_invoiceId');
      sessionStorage.removeItem('stripe_return_token');
      sessionStorage.removeItem('stripe_return_invoiceId');

      if (!invoiceId) {
        setPaymentStatus('payment_unconfirmed');
        return;
      }

      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

      // Ne confirmer qu'après validation du paiement par l'API (qui interroge Stripe)
      waitForInvoicePayment(invoiceId, { config }).then((result) => {
        if (result === 'paid') {
          setPaymentStatus('success');
          toast.success(t('payment_confirmed_toast'));
        } else {
          setPaymentStatus('payment_unconfirmed');
        }
      });
    } else if (paymentResult === 'cancel') {
      setActiveStep(paymentStepIndex);
      setPaymentStatus('error');
      toast.error(t('payment_cancelled_toast'));
    }
  }, [paymentResult, paymentStepIndex]);

  // --- Toggle optional exam ---
  const handleToggleExam = useCallback((examId) => {
    setSelectedExamIds((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId]
    );
  }, []);

  // --- Step navigation ---
  const handleNextExams = useCallback(() => {
    if (isAuth) {
      // Skip register step, go directly to recap
      setActiveStep(recapStepIndex);
    } else {
      setActiveStep(1);
    }
  }, [isAuth, recapStepIndex]);

  const handleNextRegister = useCallback((data) => {
    setRegistrationData(data);
    setActiveStep(2); // recap is step 2 for guest
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => {
      // If auth user is on recap (step 1), go back to exams (step 0)
      if (isAuth && prev === recapStepIndex) return 0;
      return prev - 1;
    });
  }, [isAuth, recapStepIndex]);

  // --- Build the list of scheduledExam IDs to enroll ---
  const getEnrollmentExamIds = useCallback(() => {
    const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];
    return scheduledExams
      .filter((se) => {
        if (!se.exam?.isOption) return true;
        return selectedExamIds.includes(se.id || se['@id']);
      })
      .map((se) => se.id || se['@id']);
  }, [session, selectedExamIds]);

  // --- Build return URL (public or dashboard) ---
  const getReturnUrl = useCallback(() => {
    if (isAuth) {
      return `${window.location.origin}/dashboard/sessions/${sessionId}`;
    }
    return `${window.location.origin}/sessions/${sessionId}`;
  }, [isAuth, sessionId]);

  // --- Submit: enroll (and optionally register) ---
  const handleSubmitEnrollment = useCallback(async (payNow) => {
    setIsSubmitting(true);
    setPaymentStatus('processing');
    setActiveStep(paymentStepIndex);

    let enrolled = false;

    try {
      let token;

      if (isAuth) {
        // User is already logged in — get token from sessionStorage
        token = sessionStorage.getItem('jwt_access_token');
      } else {
        // Guest flow: register + login
        const registerPayload = {
          email: registrationData.email,
          password: registrationData.password,
          civility: registrationData.civility,
          firstname: registrationData.firstname,
          lastname: registrationData.lastname,
        };

        let registerError = null;
        try {
          await axiosInstance.post(endpoints.auth.signUp, registerPayload);
        } catch (error) {
          registerError = error;
        }

        let loginRes;
        try {
          loginRes = await axiosInstance.post(endpoints.auth.signIn, {
            email: registrationData.email,
            password: registrationData.password,
          });
        } catch {
          // Compte existant avec un autre mot de passe : inviter à se connecter
          const emailTaken = registerError?.message?.startsWith('email:');
          throw new Error(emailTaken ? t('account_exists_sign_in') : registerError?.message || t('enrollment_error'));
        }

        token = loginRes.data?.token || loginRes.data?.access_token || loginRes.data?.accessToken;

        // Le candidat est désormais connecté (le contexte d'auth sera rechargé à la prochaine navigation)
        await setSession(token, loginRes.data?.refresh_token);

        // Compléter le profil uniquement pour un compte qui vient d'être créé
        if (!registerError) {
          const profileHeaders = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json' } };
          const profilePayload = {
            address: {
              address1: registrationData.address1,
              address2: registrationData.address2 || '',
              zipcode: registrationData.zipcode,
              city: registrationData.city,
              countryCode: registrationData.countryCode,
            },
          };
          if (registrationData.phone) profilePayload.phone = registrationData.phone;
          if (registrationData.gender) profilePayload.gender = registrationData.gender;

          await axiosInstance.patch(endpoints.user.update, profilePayload, profileHeaders);
        }
      }

      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

      // Enroll in session
      const enrollRes = await axiosInstance.post(
        endpoints.session.enroll(sessionId),
        { scheduledExamIds: getEnrollmentExamIds() },
        authHeaders,
      );
      enrolled = true;

      // If pay now → create Stripe checkout session
      if (payNow) {
        try {
          const invoices = enrollRes.data?.invoices || [];
          const invoice = invoices[0];
          const invoiceId = invoice?.id || invoice?.['@id']?.split('/').pop();

          if (!invoiceId) {
            throw new Error(t('no_invoice_found'));
          }

          const returnBase = getReturnUrl();

          const checkoutRes = await axiosInstance.post(
            endpoints.invoice.checkout(invoiceId),
            {
              successUrl: `${returnBase}?payment=success`,
              cancelUrl: `${returnBase}?payment=cancel`,
            },
            authHeaders
          );

          sessionStorage.setItem('stripe_return_token', token);
          sessionStorage.setItem('stripe_return_invoiceId', invoiceId);

          window.location.href = checkoutRes.data.checkoutUrl;
          return;
        } catch (stripeError) {
          console.error('Stripe checkout error:', stripeError);
          setPaymentStatus('error');
          toast.error(t('enrollment_saved_payment_failed'));
        }
      } else {
        setPaymentStatus('pending_payment');
        toast.success(t('enrollment_saved_pending'));
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      if (enrolled) {
        setPaymentStatus('error');
      } else {
        // Rien n'a été enregistré : retour au récapitulatif pour corriger ou se connecter
        setPaymentStatus(null);
        setActiveStep(recapStepIndex);
      }
      toast.error(getErrorMessage(error) || t('enrollment_error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuth, registrationData, sessionId, getEnrollmentExamIds, getReturnUrl, paymentStepIndex, recapStepIndex]);

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
        <Typography variant="h5">{t('session_not_found')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          {t('session_not_found_desc')}
        </Typography>
      </Container>
    );
  }

  // --- Session Header ---
  const assessment = session?.assessment || {};
  const institute = session?.institute || {};

  const placesAvailable = session?.placesAvailable;
  const enrollmentsCount = session?.enrollmentsCount ?? 0;
  const isFull = placesAvailable != null && enrollmentsCount >= placesAvailable;
  const isOpen = session?.status === 'OPEN';
  const limitDate = session?.limitDateSubscribe ? new Date(session.limitDateSubscribe) : null;
  const isExpired = limitDate && new Date() > limitDate;
  const canEnroll = isOpen && !isFull && !isExpired;

  // Calculé par l'API pour l'utilisateur connecté
  const isAlreadyEnrolled = isAuth && !!session?.isEnrolledByMe;

  // Build user data for recap (when authenticated)
  const authUserData = isAuth ? {
    civility: user.civility || '',
    firstname: user.firstname || user.firstName || '',
    lastname: user.lastname || user.lastName || '',
    email: user.email || '',
    phone: user.phone || user.phoneNumber || '',
    address1: user.address?.address1 || '',
    address2: user.address?.address2 || '',
    zipcode: user.address?.zipcode || '',
    city: user.address?.city || '',
    countryCode: user.address?.countryCode || '',
  } : null;

  // Determine the current logical step
  const isRecapStep = activeStep === recapStepIndex;
  const isPaymentStep = activeStep === paymentStepIndex;
  const isRegisterStep = !isAuth && activeStep === 1;
  const isExamsStep = activeStep === 0;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Alerts */}
      {paymentResult === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('payment_confirmed_alert')}
        </Alert>
      )}
      {paymentResult === 'cancel' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('payment_cancelled_alert')}
        </Alert>
      )}
      {isAlreadyEnrolled && !paymentResult && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('already_enrolled')}
        </Alert>
      )}
      {isFull && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('session_full')}
        </Alert>
      )}
      {isExpired && !isFull && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('deadline_passed')}
        </Alert>
      )}
      {!isOpen && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('session_not_open')}
        </Alert>
      )}

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
                {assessment.label || t('test_session')}
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
      {(canEnroll && !isAlreadyEnrolled || isPaymentStep) && (
        <EnrollmentSteps activeStep={activeStep} steps={steps} />
      )}

      {/* Step content */}
      {canEnroll && !isAlreadyEnrolled && isExamsStep && (
        <EnrollmentStepExams
          session={session}
          selectedExamIds={selectedExamIds}
          onToggleExam={handleToggleExam}
          onNext={handleNextExams}
        />
      )}

      {canEnroll && !isAlreadyEnrolled && isRegisterStep && (
        <EnrollmentStepRegister
          registrationData={registrationData}
          onNext={handleNextRegister}
          onBack={handleBack}
        />
      )}

      {canEnroll && !isAlreadyEnrolled && isRecapStep && (
        <EnrollmentStepRecap
          session={session}
          selectedExamIds={selectedExamIds}
          registrationData={isAuth ? authUserData : registrationData}
          onBack={handleBack}
          onPayNow={() => handleSubmitEnrollment(true)}
          onPayLater={() => handleSubmitEnrollment(false)}
          isSubmitting={isSubmitting}
          isAuthenticated={isAuth}
        />
      )}

      {isPaymentStep && (
        <EnrollmentStepPayment status={paymentStatus} />
      )}
    </Container>
  );
}
