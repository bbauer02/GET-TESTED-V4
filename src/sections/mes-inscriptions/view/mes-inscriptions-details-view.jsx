'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fDate, fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMyEnrollment } from 'src/actions/mes-inscriptions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MesInscriptionsDocumentDialog } from '../mes-inscriptions-document-dialog';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  LOCKED: 'warning',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  LOCKED: 'Verrouillée',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
};

const ENROLLMENT_EXAM_STATUS_COLORS = {
  REGISTERED: 'info',
  PASSED: 'success',
  FAILED: 'error',
};

const ENROLLMENT_EXAM_STATUS_LABELS = {
  REGISTERED: 'Inscrit',
  PASSED: 'Réussi',
  FAILED: 'Échoué',
};

// ----------------------------------------------------------------------

export function MesInscriptionsDetailsView() {
  const { enrollmentId } = useParams();
  const { enrollment, enrollmentLoading } = useGetMyEnrollment(enrollmentId);

  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);

  const handleOpenDocument = useCallback((docType) => {
    setSelectedDocType(docType);
    setDocDialogOpen(true);
  }, []);

  if (enrollmentLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (!enrollment) {
    return (
      <DashboardContent>
        <EmptyContent title="Inscription introuvable" />
      </DashboardContent>
    );
  }

  const session = enrollment.session || {};
  const status = session.status || 'DRAFT';
  const enrollmentExams = enrollment.enrollmentExams || [];
  const invoices = enrollment.invoices || [];
  const documentPublications = session.documentPublications || [];

  // Payment info
  const enrollmentInvoice = invoices.find((inv) => inv.businessType !== 'PLATFORM_COMMISSION');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Détail de l'inscription"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Mes inscriptions', href: paths.dashboard.mesInscriptions.root },
          { name: session.assessment?.label || 'Inscription' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* ---- Session info ---- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Session"
                action={
                  <Label color={STATUS_COLORS[status]} variant="filled">
                    {STATUS_LABELS[status] || status}
                  </Label>
                }
              />

              <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', typography: 'body2' }}>
                <InfoRow icon="solar:book-bold" label="Assessment" value={session.assessment?.label} />
                <InfoRow icon="solar:medal-ribbons-star-bold" label="Niveau" value={session.level?.label} />
                <InfoRow icon="solar:buildings-2-bold" label="Institut" value={session.institute?.label} />
                <InfoRow icon="solar:calendar-bold" label="Début" value={fDateTime(session.start)} />
                <InfoRow icon="solar:calendar-bold" label="Fin" value={fDateTime(session.end)} />
                <InfoRow
                  icon="solar:calendar-date-bold"
                  label="Date d'inscription"
                  value={enrollment.registrationDate ? fDate(enrollment.registrationDate) : '—'}
                />

                {enrollmentInvoice && (
                  <InfoRow
                    icon={enrollmentInvoice.status === 'PAID' ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'}
                    label="Paiement"
                    value={enrollmentInvoice.status === 'PAID' ? 'Payé' : 'En attente'}
                  />
                )}
              </Box>
            </Card>

            {/* ---- Documents publiés ---- */}
            {documentPublications.length > 0 && (
              <Card>
                <CardHeader
                  title="Mes documents"
                  subheader={`${documentPublications.length} document(s) disponible(s)`}
                />

                <List disablePadding>
                  {documentPublications.map((pub) => {
                    const docType = pub.documentType || {};
                    return (
                      <ListItemButton
                        key={pub.id || pub['@id']}
                        onClick={() => handleOpenDocument(docType)}
                        sx={{ px: 3 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Iconify icon="solar:document-bold" width={22} sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={docType.label || docType.code || 'Document'}
                          secondary={docType.code}
                          slotProps={{
                            primary: { variant: 'subtitle2' },
                            secondary: { variant: 'caption' },
                          }}
                        />
                        <Iconify icon="solar:eye-bold" width={20} sx={{ color: 'text.secondary' }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* ---- Épreuves ---- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title="Mes épreuves"
              subheader={`${enrollmentExams.length} épreuve(s)`}
            />

            {enrollmentExams.length > 0 ? (
              <TableContainer sx={{ px: 1, pb: 2 }}>
                <Scrollbar>
                  <Table size="small" sx={{ minWidth: 400 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Épreuve</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="center">Statut</TableCell>
                        <TableCell align="center">Score</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {enrollmentExams.map((ee) => {
                        const scheduledExam = ee.scheduledExam || {};
                        const exam = scheduledExam.exam || ee.exam || {};

                        return (
                          <TableRow key={ee.id || ee['@id']}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {exam.label || '—'}
                              </Typography>
                              {exam.duration && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {exam.duration} min
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              {scheduledExam.startDate ? fDateTime(scheduledExam.startDate) : '—'}
                            </TableCell>

                            <TableCell align="center">
                              <Label
                                color={ENROLLMENT_EXAM_STATUS_COLORS[ee.status] || 'default'}
                                variant="soft"
                              >
                                {ENROLLMENT_EXAM_STATUS_LABELS[ee.status] || ee.status || '—'}
                              </Label>
                            </TableCell>

                            <TableCell align="center">
                              {ee.finalScore != null ? (
                                <Typography variant="subtitle2">
                                  {ee.finalScore}
                                  {exam.nbrQuestions ? `/${exam.nbrQuestions}` : ''}
                                </Typography>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3 }}>
                <EmptyContent title="Aucune épreuve" />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ---- Document preview dialog ---- */}
      <MesInscriptionsDocumentDialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        enrollment={enrollment}
        documentType={selectedDocType}
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'flex-start', lineHeight: '24px' }}>
      <Iconify width={24} icon={icon} sx={{ color: 'text.secondary', mt: 0.25 }} />
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="subtitle2">{value || '—'}</Typography>
      </Box>
    </Box>
  );
}
