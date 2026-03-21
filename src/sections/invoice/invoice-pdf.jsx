'use client';

import { useMemo } from 'react';
import {
  Page,
  Text,
  View,
  Font,
  Image,
  Document,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function InvoicePDFDownload({ invoice }) {
  const renderButton = (loading) => (
    <Tooltip title="Télécharger PDF">
      <IconButton>
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <Iconify icon="eva:cloud-download-fill" />
        )}
      </IconButton>
    </Tooltip>
  );

  return (
    <PDFDownloadLink
      document={<InvoicePdfDocument invoice={invoice} />}
      fileName={`${invoice?.invoiceNumber || 'facture'}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => renderButton(loading)}
    </PDFDownloadLink>
  );
}

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf' }],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        page: {
          fontSize: 9,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '40px 24px 120px 24px',
        },
        footer: {
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          margin: 'auto',
          borderTopWidth: 1,
          borderStyle: 'solid',
          position: 'absolute',
          borderColor: '#e9ecef',
        },
        container: { flexDirection: 'row', justifyContent: 'space-between' },
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb40: { marginBottom: 40 },
        h3: { fontSize: 16, fontWeight: 700, lineHeight: 1.2 },
        h4: { fontSize: 12, fontWeight: 700 },
        text1: { fontSize: 10 },
        text2: { fontSize: 9 },
        text1Bold: { fontSize: 10, fontWeight: 700 },
        text2Bold: { fontSize: 9, fontWeight: 700 },
        table: { display: 'flex', width: '100%' },
        row: {
          padding: '10px 0 8px 0',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#e9ecef',
        },
        cell_1: { width: '5%' },
        cell_2: { width: '35%' },
        cell_3: { width: '10%', paddingLeft: 8 },
        cell_4: { width: '15%', paddingLeft: 8 },
        cell_5: { width: '10%', paddingLeft: 8 },
        cell_6: { width: '12.5%', textAlign: 'right' },
        cell_7: { width: '12.5%', textAlign: 'right' },
        noBorder: { paddingTop: '10px', paddingBottom: 0, borderBottomWidth: 0 },
      }),
    []
  );

const STATUS_MAP = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

function InvoicePdfDocument({ invoice }) {
  const styles = useStyles();

  if (!invoice) return null;

  const { seller, buyer, lines, invoiceNumber, invoiceDate, paymentDueDate, status } =
    invoice;

  const sellerLogo = seller?.logoUrl || '/logo/logo-single.png';

  const renderHeader = () => (
    <View style={[styles.container, styles.mb40]}>
      <Image source={sellerLogo} style={{ width: 48, height: 48, objectFit: 'contain' }} />

      <View style={{ alignItems: 'flex-end', flexDirection: 'column' }}>
        <Text style={[styles.h3, styles.mb8]}>{STATUS_MAP[status] || status}</Text>
        <Text style={[styles.text2]}>{invoiceNumber || 'Brouillon'}</Text>
      </View>
    </View>
  );

  const renderCounterparty = (label, party) => (
    <View style={{ width: '50%' }}>
      <Text style={[styles.text1Bold, styles.mb4]}>{label}</Text>
      <Text style={[styles.text2]}>{party?.name}</Text>
      {party?.address && <Text style={[styles.text2]}>{party.address}</Text>}
      {(party?.zipcode || party?.city) && (
        <Text style={[styles.text2]}>
          {party.zipcode} {party.city}
        </Text>
      )}
      {party?.vatNumber && <Text style={[styles.text2]}>TVA : {party.vatNumber}</Text>}
      {party?.siren && (
        <Text style={[styles.text2]}>
          SIREN : {party.siren}
          {party.siret ? ` — SIRET : ${party.siret}` : ''}
        </Text>
      )}
      {party?.legalForm && (
        <Text style={[styles.text2]}>
          {party.legalForm}
          {party.shareCapital ? ` au capital de ${party.shareCapital} €` : ''}
          {party.rcsCity ? ` — RCS ${party.rcsCity}` : ''}
        </Text>
      )}
    </View>
  );

  const renderBillingInfo = () => (
    <View style={[styles.container, styles.mb40]}>
      {renderCounterparty('Émetteur', seller)}
      {renderCounterparty('Destinataire', buyer)}
    </View>
  );

  const renderDates = () => (
    <View style={[styles.container, styles.mb40]}>
      <View style={{ width: '50%' }}>
        <Text style={[styles.text1Bold, styles.mb4]}>Date d&apos;émission</Text>
        <Text style={[styles.text2]}>{fDate(invoiceDate) || '-'}</Text>
      </View>
      <View style={{ width: '50%' }}>
        <Text style={[styles.text1Bold, styles.mb4]}>Date d&apos;échéance</Text>
        <Text style={[styles.text2]}>{fDate(paymentDueDate) || '-'}</Text>
      </View>
    </View>
  );

  const renderTable = () => (
    <>
      <Text style={[styles.text1Bold]}>Détail de la facture</Text>

      <View style={styles.table}>
        <View style={styles.row}>
          <View style={styles.cell_1}>
            <Text style={[styles.text2Bold]}>#</Text>
          </View>
          <View style={styles.cell_2}>
            <Text style={[styles.text2Bold]}>Description</Text>
          </View>
          <View style={styles.cell_3}>
            <Text style={[styles.text2Bold]}>Qté</Text>
          </View>
          <View style={styles.cell_4}>
            <Text style={[styles.text2Bold]}>Prix unit. HT</Text>
          </View>
          <View style={styles.cell_5}>
            <Text style={[styles.text2Bold]}>TVA</Text>
          </View>
          <View style={styles.cell_6}>
            <Text style={[styles.text2Bold]}>Total HT</Text>
          </View>
          <View style={styles.cell_7}>
            <Text style={[styles.text2Bold]}>Total TTC</Text>
          </View>
        </View>

        {(lines || []).map((line, index) => (
          <View key={line.id || index} style={styles.row}>
            <View style={styles.cell_1}>
              <Text>{index + 1}</Text>
            </View>
            <View style={styles.cell_2}>
              <Text style={[styles.text2Bold]}>{line.label}</Text>
              {line.description && <Text style={[styles.text2]}>{line.description}</Text>}
            </View>
            <View style={styles.cell_3}>
              <Text style={[styles.text2]}>{line.quantity}</Text>
            </View>
            <View style={styles.cell_4}>
              <Text style={[styles.text2]}>{fCurrency(line.unitPriceHT)}</Text>
            </View>
            <View style={styles.cell_5}>
              <Text style={[styles.text2]}>{line.tvaRate} %</Text>
            </View>
            <View style={styles.cell_6}>
              <Text style={[styles.text2]}>{fCurrency(line.totalHT)}</Text>
            </View>
            <View style={styles.cell_7}>
              <Text style={[styles.text2]}>{fCurrency(line.totalTTC)}</Text>
            </View>
          </View>
        ))}

        {/* Totaux */}
        {[
          { name: 'Total HT', value: invoice.totalHT },
          { name: 'TVA', value: invoice.totalTVA },
          { name: 'Total TTC', value: invoice.totalTTC, styles: styles.h4 },
        ].map((item) => (
          <View key={item.name} style={[styles.row, styles.noBorder]}>
            <View style={styles.cell_1} />
            <View style={styles.cell_2} />
            <View style={styles.cell_3} />
            <View style={styles.cell_4} />
            <View style={styles.cell_5} />
            <View style={styles.cell_6}>
              <Text style={[item.styles ?? styles.text2]}>{item.name}</Text>
            </View>
            <View style={styles.cell_7}>
              <Text style={[item.styles ?? styles.text2]}>{fCurrency(item.value)}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={[styles.container, styles.footer]} fixed>
      <View style={{ width: '75%' }}>
        <Text style={[styles.text2Bold, styles.mb4]}>MENTIONS LÉGALES</Text>
        {invoice.earlyPaymentDiscount && (
          <Text style={[styles.text2]}>
            Escompte pour paiement anticipé : {invoice.earlyPaymentDiscount}
          </Text>
        )}
        {invoice.latePaymentPenaltyRate && (
          <Text style={[styles.text2]}>
            Pénalités de retard : {invoice.latePaymentPenaltyRate} %
          </Text>
        )}
        {invoice.fixedRecoveryIndemnity && (
          <Text style={[styles.text2]}>
            Indemnité forfaitaire de recouvrement : {fCurrency(invoice.fixedRecoveryIndemnity)}
          </Text>
        )}
      </View>
      <View style={{ width: '25%', textAlign: 'right' }}>
        <Text style={[styles.text2Bold, styles.mb4]}>Une question ?</Text>
        <Text style={[styles.text2]}>support@gettested.fr</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader()}
        {renderBillingInfo()}
        {renderDates()}
        {renderTable()}
        {renderFooter()}
      </Page>
    </Document>
  );
}
