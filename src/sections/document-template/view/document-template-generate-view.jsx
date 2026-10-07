'use client';

import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDocumentTemplate } from 'src/actions/document-template';
import { useGetSession, useGetInstituteSessions } from 'src/actions/espace-institut';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { DocumentTemplatePreview } from '../document-template-preview';
import { buildMergeContext, replaceMergeFields } from '../utils/merge-engine';

// ----------------------------------------------------------------------

export function DocumentTemplateGenerateView() {
  const { id } = useParams();
  const institute = useCurrentInstitute();
  const { template, templateLoading } = useGetDocumentTemplate(id);
  const { sessions, sessionsLoading } = useGetInstituteSessions(institute?.id);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [currentEnrollmentIndex, setCurrentEnrollmentIndex] = useState(0);

  const { session } = useGetSession(selectedSessionId);

  const enrollments = useMemo(
    () => session?.enrollments || [],
    [session]
  );

  const currentEnrollment = enrollments[currentEnrollmentIndex] || null;

  const mergedHtml = useMemo(() => {
    if (!template?.content || !currentEnrollment) return '';

    const context = buildMergeContext({
      enrollment: currentEnrollment,
      session,
      institute: session?.institute || institute,
    });

    return replaceMergeFields(template.content, context);
  }, [template, currentEnrollment, session, institute]);

  const handlePrev = useCallback(() => {
    setCurrentEnrollmentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentEnrollmentIndex((prev) => Math.min(enrollments.length - 1, prev + 1));
  }, [enrollments.length]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (templateLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading="Générer un document"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Documents', href: paths.dashboard.espaceInstitut.documents },
          { name: template?.label || 'Générer' },
        ]}
      />

      <Card sx={{ p: 3, mb: 3 }} className="no-print">
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Session</InputLabel>
            <Select
              value={selectedSessionId}
              label="Session"
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setCurrentEnrollmentIndex(0);
              }}
            >
              {sessionsLoading && <MenuItem disabled>Chargement...</MenuItem>}
              {sessions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.assessment?.label || 'Session'} — {s.level?.label || ''} ({s.enrollmentsCount ?? s.enrollments?.length ?? 0} inscrits)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSessionId && enrollments.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={handlePrev} disabled={currentEnrollmentIndex === 0}>
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>

              <Typography variant="body2">
                Inscrit {currentEnrollmentIndex + 1} / {enrollments.length}
                {currentEnrollment && (
                  <>
                    {' — '}
                    {currentEnrollment.candidate?.firstname || currentEnrollment.user?.firstname}{' '}
                    {currentEnrollment.candidate?.lastname || currentEnrollment.user?.lastname}
                  </>
                )}
              </Typography>

              <IconButton
                onClick={handleNext}
                disabled={currentEnrollmentIndex >= enrollments.length - 1}
              >
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>

              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:printer-bold" />}
                onClick={handlePrint}
                sx={{ ml: 'auto' }}
              >
                Télécharger PDF
              </Button>
            </Stack>
          )}

          {selectedSessionId && enrollments.length === 0 && !sessionsLoading && (
            <EmptyContent title="Aucun inscrit pour cette session" />
          )}
        </Stack>
      </Card>

      {mergedHtml && <DocumentTemplatePreview htmlContent={mergedHtml} />}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print, header, nav, aside, footer,
          [class*="nav-"], [class*="header-"], [class*="sidebar-"],
          [class*="breadcrumb"] {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .document-preview {
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </DashboardContent>
  );
}
