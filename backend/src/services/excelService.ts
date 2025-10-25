import * as xlsx from 'xlsx';

// cSpell:ignore ASSY
export interface ExcelItem {
    no: number;
    boxNo: string;
    partNo: string;
    partName: string;
    quantity: number;
    remark: string;
}

export interface ExcelData {
    shippingMark: string;
    orderNo: string;
    caseNo: string;
    destination: string;
    model: string;
    productionMonth: string;
    caseSize: string;
    grossWeight: number;
    netWeight: number;
    // rackNo can be single or multiple when merging sheets
    rackNo: string | string[];
    items: ExcelItem[];
}

export interface ExcelParseResult {
    success: boolean;
    // always return single merged case (if at least one sheet parsed)
    data?: ExcelData;
    errors?: string[];
    warnings?: string[];
}

export class ExcelService {
    static extractValue(rowString: string): string | undefined {
        // Try to extract a value after ":" or "-" or after the label text
        const colonMatch = rowString.match(/[:\-]\s*(.+)$/);
        if (colonMatch && colonMatch[1]) return colonMatch[1].trim();
        // fallback: take last token sequence that is not the label itself
        const parts = rowString.split(/\s{2,}| - |:|-/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) return parts[parts.length - 1];
        return undefined;
    }

    static parseNumber(value: any): number | undefined {
        if (value === null || value === undefined || value === '') return undefined;
        if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
        const s = String(value).replace(/[, ]+/g, '').match(/-?\d+(\.\d+)?/);
        if (!s) return undefined;
        const n = parseFloat(s[0]);
        return Number.isFinite(n) ? n : undefined;
    }

    // instance method: parse workbook buffer and try every sheet
    parseShipmentExcel(buffer: Buffer): ExcelParseResult {
        try {
            const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true, raw: false });
            if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
                return { success: false, errors: ['Workbook contains no sheets'] };
            }

            // declare warnings early so we can push messages before parsing loop
            const warnings: string[] = [];

            // Skip sheets named "SUM" or "PSE" (case-insensitive)
            const skipPattern = /^(?:SUM|PSE)$/i;
            const allSheetNames = workbook.SheetNames.map(s => String(s));
            const skippedSheetNames = allSheetNames.filter(n => skipPattern.test(n.trim()));
            const sheetNamesToProcess = allSheetNames.filter(n => !skipPattern.test(n.trim()));

            if (skippedSheetNames.length > 0) {
                warnings.push(`Skipped sheets: ${skippedSheetNames.join(', ')}.`);
                console.log(`ExcelService: skipped sheets ${skippedSheetNames.join(', ')}`);
            }

            if (sheetNamesToProcess.length === 0) {
                return {
                    success: false,
                    errors: ['No sheets to parse (all sheets were skipped: SUM / PSE)'],
                    warnings: warnings.length ? warnings : undefined
                };
            }

            const parsedCases: ExcelData[] = [];
            const errors: string[] = [];
            // (warnings already declared above)
            for (const sheetName of sheetNamesToProcess) {
                try {
                    const sheet = workbook.Sheets[sheetName];
                    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: undefined }) as any[][];
                    const res = ExcelService.parseSimpleStructure(data);
                    if (res.success && res.data) {
                        parsedCases.push(res.data);
                        if (res.warnings) warnings.push(...res.warnings.map(w => `${sheetName}: ${w}`));
                    } else {
                        const sheetErr = (res.errors || [`Unknown parse failure for sheet ${sheetName}`]).map(e => `${sheetName}: ${e}`);
                        errors.push(...sheetErr);
                        if (res.warnings) warnings.push(...res.warnings.map(w => `${sheetName}: ${w}`));
                    }
                } catch (sheetError) {
                    errors.push(`${sheetName}: ${(sheetError as Error).message || String(sheetError)}`);
                }
            }

            if (parsedCases.length === 0) {
                return {
                    success: false,
                    errors: errors.length ? errors : ['No sheet could be parsed successfully'],
                    warnings: warnings.length ? warnings : undefined
                };
            }

            // If only one parsed case -> return it
            if (parsedCases.length === 1) {
                return {
                    success: true,
                    data: parsedCases[0],
                    warnings: warnings.length ? warnings : undefined,
                    errors: errors.length ? errors : undefined
                };
            }

            // Merge multiple parsedCases:
            // - concat items keeping each row (do NOT merge/sum identical partNo rows)
            // - collect distinct rackNo values; if >1 produce array
            const mergedItems: ExcelItem[] = [];
            const rackSet = new Set<string>();
            let firstCase: ExcelData | null = null;

            for (const pc of parsedCases) {
                if (!firstCase) firstCase = pc;
                // collect rackNo(s)
                if (pc.rackNo) {
                    if (Array.isArray(pc.rackNo)) {
                        pc.rackNo.forEach(r => r && rackSet.add(String(r).trim()));
                    } else if (String(pc.rackNo).trim() !== '') {
                        rackSet.add(String(pc.rackNo).trim());
                    }
                }

                // Append all items as separate rows (do NOT merge identical rows)
                for (const it of pc.items || []) {
                    mergedItems.push({ ...it }); // push copy
                }
            }

            // Re-index items sequentially
            for (let i = 0; i < mergedItems.length; i++) {
                mergedItems[i].no = i + 1;
            }

            // choose base values from first parsed case where available
            const base = firstCase as ExcelData;
            const rackArr = Array.from(rackSet).filter(Boolean);
            // finalRack: if >1 distinct rack -> keep as array; if exactly 1 -> single string; if none -> base or empty string
            const finalRack = rackArr.length === 0 ? (base.rackNo ?? '') : (rackArr.length === 1 ? rackArr[0] : rackArr);

            const merged: ExcelData = {
                shippingMark: base.shippingMark || parsedCases.map(p => p.shippingMark).find(Boolean) || '',
                orderNo: base.orderNo || parsedCases.map(p => p.orderNo).find(Boolean) || '',
                caseNo: base.caseNo || parsedCases.map(p => p.caseNo).find(Boolean) || '',
                destination: base.destination || parsedCases.map(p => p.destination).find(Boolean) || '',
                model: base.model || parsedCases.map(p => p.model).find(Boolean) || '',
                productionMonth: base.productionMonth || parsedCases.map(p => p.productionMonth).find(Boolean) || '',
                caseSize: base.caseSize || parsedCases.map(p => p.caseSize).find(Boolean) || '',
                grossWeight: base.grossWeight || parsedCases.map(p => p.grossWeight).find(Boolean) || 0,
                netWeight: base.netWeight || parsedCases.map(p => p.netWeight).find(Boolean) || 0,
                rackNo: finalRack,
                items: mergedItems
            };

            // add a warning that sheets were merged (and report if multiple rack numbers)
            if (parsedCases.length > 1) {
                warnings.unshift(`Merged ${parsedCases.length} sheets into single shipment record.`);
                if (rackArr.length > 1) {
                    warnings.push(`Multiple distinct RACK NO found: ${rackArr.join(', ')} — set as multiple rackNo values.`);
                }
            }

            return {
                success: true,
                data: merged,
                warnings: warnings.length ? warnings : undefined,
                errors: errors.length ? errors : undefined
            };
        } catch (err) {
            return {
                success: false,
                errors: ['Failed to read workbook: ' + ((err as Error).message || String(err))]
            };
        }
    }

    static parseSimpleStructure(data: any[][]): ExcelParseResult {
        const warnings: string[] = [];

        const get = (r: number, c: number): string | undefined => {
            const row = data[r - 1];
            if (!row) return undefined;
            const cell = row[c - 1];
            if (cell === undefined || cell === null) return undefined;
            return String(cell).trim();
        };

        const extractAfterColon = (s?: string): string | undefined => {
            if (!s) return undefined;
            const idx = s.indexOf(':');
            if (idx >= 0) {
                const after = s.slice(idx + 1).trim();
                return after || undefined;
            }
            return undefined;
        };

        const parseNumber = (v: any): number | undefined => {
            if (v === null || v === undefined || v === '') return undefined;
            if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
            const s = String(v).replace(/[, ]+/g, '').match(/-?\d+(\.\d+)?/);
            if (!s) return undefined;
            const n = parseFloat(s[0]);
            return Number.isFinite(n) ? n : undefined;
        };

        try {
            // Map fields by coordinates (1-based rows/cols) according to template
            const rawShippingCell = get(1, 1);
            let shippingMark = extractAfterColon(rawShippingCell) || get(2, 1) || rawShippingCell || '';

            const destFromTop = get(3, 1);
            const destination = destFromTop || get(19, 4) || '';

            const orderRaw = get(4, 1) || get(22, 4) || get(22, 1);
            const orderNo = extractAfterColon(orderRaw) || orderRaw || '';

            const caseRaw = get(5, 1) || get(19, 12) || get(15, 4);
            const caseNo = extractAfterColon(caseRaw) || caseRaw || '';

            const model = get(20, 4) || get(21, 4) || '';
            const caseSize = get(20, 12) || get(13, 4) || '';
            const grossWeight = parseNumber(get(21, 12)) ?? parseNumber(get(12, 10)) ?? undefined;
            const netWeight = parseNumber(get(22, 12)) ?? parseNumber(get(12, 9)) ?? undefined;

            const productionMonth = get(23, 4) || undefined;
            const rackNo = get(23, 12) || undefined;

            const items: ExcelItem[] = [];
            for (let r = 26; r <= 200; r++) {
                const noCell = get(r, 1);
                if (!noCell) break;
                const no = parseNumber(noCell);
                if (!no) break;

                const boxNo = get(r, 2) || `BOX_${String(no).padStart(2, '0')}`;
                const partNo = get(r, 4) || '';
                const partName = get(r, 5) || '';
                const quantity = parseNumber(get(r, 9)) ?? parseNumber(get(r, 8)) ?? 0;
                const remark = get(r, 10) || '';

                items.push({
                    no,
                    boxNo,
                    partNo,
                    partName,
                    quantity,
                    remark
                });
            }

            if (items.length === 0) {
                warnings.push('No items found at expected coordinates (rows starting 26).');
            }

            return {
                success: true,
                data: {
                    shippingMark,
                    orderNo,
                    caseNo,
                    destination,
                    model,
                    productionMonth: productionMonth ?? '',
                    caseSize,
                    grossWeight: grossWeight ?? 0,
                    netWeight: netWeight ?? 0,
                    rackNo: rackNo ?? '',
                    items
                },
                warnings: warnings.length ? warnings : undefined
            };

        } catch (error) {
            return {
                success: false,
                errors: ['Error parsing Excel structure: ' + (error as Error).message]
            };
        }
    }
}
