// Calcul des prix d'une épreuve planifiée, aligné sur InvoiceService (API) :
// tarif de l'institut s'il existe, sinon tarif par défaut de l'épreuve ; TVA de 20 % par défaut.

const DEFAULT_TVA_RATE = 20;

const round2 = (value) => Math.round(value * 100) / 100;

export function getExamPricing(scheduledExam) {
  const institutePrice = scheduledExam?.examPricing?.price ?? scheduledExam?.exam_pricing?.price;
  const price = institutePrice?.amount != null ? institutePrice : scheduledExam?.exam?.price;

  const ht = price?.amount ?? 0;
  const tvaRate = price?.tva ?? DEFAULT_TVA_RATE;
  const tva = round2((ht * tvaRate) / 100);

  return { ht, tvaRate, tva, ttc: round2(ht + tva) };
}

export function getExamsTotals(scheduledExams = []) {
  return scheduledExams.reduce(
    (totals, scheduledExam) => {
      const { ht, tva, ttc } = getExamPricing(scheduledExam);
      return {
        ht: round2(totals.ht + ht),
        tva: round2(totals.tva + tva),
        ttc: round2(totals.ttc + ttc),
      };
    },
    { ht: 0, tva: 0, ttc: 0 }
  );
}
