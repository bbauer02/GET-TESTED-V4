import dynamic from 'next/dynamic';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { InvoiceTotalSummary } from './invoice-total-summary';

const InvoicePDFDownload = dynamic(
  () => import('./invoice-pdf').then((mod) => mod.InvoicePDFDownload),
  { ssr: false }
);

// ----------------------------------------------------------------------

const STATUS_MAP = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  ISSUED: { label: 'Émise', color: 'warning' },
  PAID: { label: 'Payée', color: 'success' },
  CANCELLED: { label: 'Annulée', color: 'error' },
};

// ----------------------------------------------------------------------

export function InvoiceDetails({ invoice }) {
  if (!invoice) return null;

  const statusInfo = STATUS_MAP[invoice.status] || { label: invoice.status, color: 'default' };

  const renderFooter = () => (
    <Box
      sx={{
        py: 3,
        gap: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          MENTIONS LÉGALES
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {invoice.earlyPaymentDiscount && `Escompte pour paiement anticipé : ${invoice.earlyPaymentDiscount}`}
          {invoice.latePaymentPenaltyRate && ` — Pénalités de retard : ${invoice.latePaymentPenaltyRate} %`}
          {invoice.fixedRecoveryIndemnity && ` — Indemnité forfaitaire de recouvrement : ${fCurrency(invoice.fixedRecoveryIndemnity)}`}
        </Typography>
      </div>

      <Box sx={{ flexGrow: { md: 1 }, textAlign: { md: 'right' } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Une question ?
        </Typography>
        <Typography variant="body2">support@gettested.fr</Typography>
      </Box>
    </Box>
  );

  const renderCounterparty = (label, party) => (
    <Stack sx={{ typography: 'body2' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {party?.name}
      <br />
      {party?.address && (
        <>
          {party.address}
          <br />
        </>
      )}
      {(party?.zipcode || party?.city) && (
        <>
          {party.zipcode} {party.city}
          <br />
        </>
      )}
      {party?.vatNumber && (
        <>
          TVA : {party.vatNumber}
          <br />
        </>
      )}
      {party?.siren && (
        <>
          SIREN : {party.siren}
          {party.siret && ` — SIRET : ${party.siret}`}
          <br />
        </>
      )}
      {party?.legalForm && (
        <>
          {party.legalForm}
          {party.shareCapital && ` au capital de ${party.shareCapital} €`}
          {party.rcsCity && ` — RCS ${party.rcsCity}`}
        </>
      )}
    </Stack>
  );

  const renderList = () => (
    <Scrollbar sx={{ mt: 5 }}>
      <Table sx={{ minWidth: 960 }}>
        <TableHead>
          <TableRow>
            <TableCell width={40}>#</TableCell>
            <TableCell sx={{ typography: 'subtitle2' }}>Description</TableCell>
            <TableCell>Qté</TableCell>
            <TableCell align="right">Prix unit. HT</TableCell>
            <TableCell align="right">TVA</TableCell>
            <TableCell align="right">Total HT</TableCell>
            <TableCell align="right">Total TTC</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {invoice.lines?.map((line, index) => (
            <TableRow key={line.id || index}>
              <TableCell>{index + 1}</TableCell>

              <TableCell>
                <Box sx={{ maxWidth: 480 }}>
                  <Typography variant="subtitle2">{line.label}</Typography>
                  {line.description && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                      {line.description}
                    </Typography>
                  )}
                </Box>
              </TableCell>

              <TableCell>{line.quantity}</TableCell>
              <TableCell align="right">{fCurrency(line.unitPriceHT)}</TableCell>
              <TableCell align="right">{`${line.tvaRate} %`}</TableCell>
              <TableCell align="right">{fCurrency(line.totalHT)}</TableCell>
              <TableCell align="right">{fCurrency(line.totalTTC)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <Card sx={{ pt: 5, px: 5 }}>
      <Box
        sx={{
          rowGap: 5,
          display: 'grid',
          alignItems: 'center',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Box
          component="img"
          alt="Logo"
          src={invoice.seller?.logoUrl || '/logo/logo-single.svg'}
          sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'contain' }}
        />

        <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Label variant="soft" color={statusInfo.color}>
              {statusInfo.label}
            </Label>
            <InvoicePDFDownload invoice={invoice} />
          </Stack>

          <Typography variant="h6">{invoice.invoiceNumber || 'Brouillon'}</Typography>

          {invoice.businessType === 'PLATFORM_COMMISSION' && (
            <Label variant="soft" color="info">
              Facture commission plateforme
            </Label>
          )}
        </Stack>

        {renderCounterparty('Émetteur', invoice.seller)}
        {renderCounterparty('Destinataire', invoice.buyer)}

        <Stack sx={{ typography: 'body2' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Date d&apos;émission
          </Typography>
          {fDate(invoice.invoiceDate) || '-'}
        </Stack>

        <Stack sx={{ typography: 'body2' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Date d&apos;échéance
          </Typography>
          {fDate(invoice.paymentDueDate) || '-'}
        </Stack>
      </Box>

      {renderList()}

      <Divider sx={{ borderStyle: 'dashed' }} />

      <InvoiceTotalSummary
        totalHT={invoice.totalHT}
        totalTVA={invoice.totalTVA}
        totalTTC={invoice.totalTTC}
      />

      <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />

      {renderFooter()}
    </Card>
  );
}
