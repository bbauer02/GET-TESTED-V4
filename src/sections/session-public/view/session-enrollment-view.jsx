'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/lib/axios';
import { useGetPublicSession } from 'src/actions/session-public';

import { useAuthContext } from 'src/auth/hooks';

import { EnrollmentStepExams } from '../enrollment-step-exams';
import { EnrollmentStepRecap } from '../enrollment-step-recap';
import { EnrollmentStepPayment } from '../enrollment-step-payment';
import { EnrollmentStepRegister } from '../enrollment-step-register';
import { EnrollmentSteps, ENROLLMENT_STEPS_AUTH, ENROLLMENT_STEPS_GUEST } from '../enrollment-steps';

// ----------------------------------------------------------------------

export function SessionEnrollmentView({ sessionId, paymentResult }) {
  const { session, sessionLoading, sessionError } = useGetPublicSession(sessionId);
  const { user, authenticated } = useAuthContext();

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
  useEffect(() => {
    if (paymentResult === 'success') {
      setActiveStep(paymentStepIndex);
      setPaymentStatus('processing');

      const token = sessionStorage.getItem('stripe_return_token');
      const invoiceId = sessionStorage.getItem('stripe_return_invoiceId');
      sessionStorage.removeItem('stripe_return_token');
      sessionStorage.removeItem('stripe_return_invoiceId');

      if (token && invoiceId) {
        axiosInstance
          .post(
            endpoints.invoice.verifyPayment(invoiceId),
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .then((res) => {
            if (res.data.status === 'paid' || res.data.status === 'already_paid') {
              setPaymentStatus('success');
              toast.success('Paiement confirmé !');
            } else {
              setPaymentStatus('success');
              toast.success('Paiement enregistré, vérification en cours.');
            }
          })
          .catch(() => {
            setPaymentStatus('success');
            toast.success('Paiement enregistré !');
          });
      } else {
        setPaymentStatus('success');
        toast.success('Paiement confirmé !');
      }
    } else if (paymentResult === 'cancel') {
      setActiveStep(paymentStepIndex);
      setPaymentStatus('error');
      toast.error('Paiement annulé. Vous pouvez réessayer depuis votre espace.');
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

        try {
          await axiosInstance.post(endpoints.auth.signUp, registerPayload);
        } catch (registerError) {
          console.warn('Register endpoint error (may be mailer):', registerError.message);
        }

        const loginRes = await axiosInstance.post(endpoints.auth.signIn, {
          email: registrationData.email,
          password: registrationData.password,
        });

        token = loginRes.data?.token || loginRes.data?.access_token || loginRes.data?.accessToken;

        // Update profile with address/phone
        const authHeaders = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json' } };
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

        await axiosInstance.patch(endpoints.user.update, profilePayload, authHeaders);
      }

      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

      // Enroll in session
      const enrollRes = await axiosInstance.post(
        endpoints.session.enroll(sessionId),
        { scheduledExamIds: getEnrollmentExamIds() },
        authHeaders,
      );

      // If pay now → create Stripe checkout session
      if (payNow) {
        try {
          const invoices = enrollRes.data?.invoices || [];
          const invoice = invoices[0];
          const invoiceId = invoice?.id || invoice?.['@id']?.split('/').pop();

          if (!invoiceId) {
            throw new Error('Aucune facture trouvée pour cette inscription.');
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
          toast.error('Inscription enregistrée, mais le paiement a échoué. Vous pouvez réessayer plus tard.');
        }
      } else {
        setPaymentStatus('pending_payment');
        toast.success('Inscription enregistrée. Paiement en attente.');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      setPaymentStatus('error');
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuth, registrationData, sessionId, getEnrollmentExamIds, getReturnUrl, paymentStepIndex]);

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

  const placesAvailable = session?.placesAvailable;
  const enrollmentsCount = (session?.enrollments || []).length;
  const isFull = placesAvailable != null && enrollmentsCount >= placesAvailable;
  const isOpen = session?.status === 'OPEN';
  const limitDate = session?.limitDateSubscribe ? new Date(session.limitDateSubscribe) : null;
  const isExpired = limitDate && new Date() > limitDate;
  const canEnroll = isOpen && !isFull && !isExpired;

  // Check if the current user is already enrolled
  const isAlreadyEnrolled = isAuth && (session?.enrollments || []).some((e) => {
    const enrolledUserId = e.user?.id || e.user?.['@id'];
    const currentUserId = user?.id || user?.['@id'];
    return enrolledUserId === currentUserId
      || (enrolledUserId && currentUserId && String(enrolledUserId) === String(currentUserId));
  });

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
          Votre paiement a été confirmé. Votre inscription est validée !
        </Alert>
      )}
      {paymentResult === 'cancel' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Le paiement a été annulé. Votre inscription est enregistrée mais reste en attente de paiement.
        </Alert>
      )}
      {isAlreadyEnrolled && !paymentResult && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous êtes déjà inscrit à cette session.
        </Alert>
      )}
      {isFull && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Cette session est complète. Il n&apos;y a plus de places disponibles.
        </Alert>
      )}
      {isExpired && !isFull && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          La date limite d&apos;inscription est dépassée.
        </Alert>
      )}
      {!isOpen && !paymentResult && !isAlreadyEnrolled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Cette session n&apos;est pas ouverte aux inscriptions.
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
