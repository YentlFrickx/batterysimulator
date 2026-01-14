import { describe, it, expect } from 'vitest';
import { parseFluviusCsv } from './parser';

const sampleCsv = `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;0,065;kWh;Uitgelezen;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,000;kWh;Uitgelezen;
02-09-2025;00:15:00;02-09-2025;00:30:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;0,120;kWh;Uitgelezen;
02-09-2025;00:15:00;02-09-2025;00:30:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,050;kWh;Uitgelezen;`;

describe('parseFluviusCsv', () => {
  it('parses intervals from CSV', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result).toHaveLength(2);
  });

  it('extracts correct timestamps', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].startTime).toEqual(new Date(2025, 8, 2, 0, 0, 0));
    expect(result[0].endTime).toEqual(new Date(2025, 8, 2, 0, 15, 0));
  });

  it('extracts consumption values', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].consumptionKwh).toBeCloseTo(0.065, 3);
    expect(result[1].consumptionKwh).toBeCloseTo(0.120, 3);
  });

  it('extracts injection values', () => {
    const result = parseFluviusCsv(sampleCsv);
    expect(result[0].injectionKwh).toBeCloseTo(0.0, 3);
    expect(result[1].injectionKwh).toBeCloseTo(0.050, 3);
  });

  it('handles comma decimal separator', () => {
    const csv = `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;1,234;kWh;Uitgelezen;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,567;kWh;Uitgelezen;`;
    const result = parseFluviusCsv(csv);
    expect(result[0].consumptionKwh).toBeCloseTo(1.234, 3);
    expect(result[0].injectionKwh).toBeCloseTo(0.567, 3);
  });

  it('handles BOM character at start of file', () => {
    const csvWithBom = `\ufeffVan (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;0,100;kWh;Uitgelezen;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;0,000;kWh;Uitgelezen;`;
    const result = parseFluviusCsv(csvWithBom);
    expect(result).toHaveLength(1);
    expect(result[0].consumptionKwh).toBeCloseTo(0.100, 3);
  });

  it('handles empty volume values as zero', () => {
    const csv = `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Afname Nacht;;kWh;Geen verbruik;
02-09-2025;00:00:00;02-09-2025;00:15:00;="541448820050357909";1SAG3200193141;Digitale meter;Injectie Nacht;;kWh;Geen verbruik;`;
    const result = parseFluviusCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].consumptionKwh).toBe(0);
    expect(result[0].injectionKwh).toBe(0);
  });
});
