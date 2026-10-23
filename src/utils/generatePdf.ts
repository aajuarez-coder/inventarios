import { generateAndDownloadPdf, buildResponsivaPrintHtml, executePrintDialog } from './printHelper';
import { generateInstitutionalInventoryPdf, generateInstitutionalMaintenancePdf, drawPetroilLogo } from './generateInstitutionalPdf';
import { Assignment, HardwareAsset, Employee, Branch } from '../types/inventory';

export { 
  generateAndDownloadPdf, 
  buildResponsivaPrintHtml, 
  executePrintDialog,
  generateInstitutionalInventoryPdf,
  generateInstitutionalMaintenancePdf,
  drawPetroilLogo
};

/**
 * Downloads the PDF directly and triggers the print dialog
 */
export const exportResponsivaToPDF = async (
  elementId: string,
  assignment: Assignment,
  asset?: HardwareAsset,
  employee?: Employee,
  branch?: Branch,
  openPrintDialog: boolean = true
): Promise<boolean> => {
  try {
    // 1. Download pure vector PDF immediately (fast, crisp, 100% reliable)
    generateAndDownloadPdf(assignment, asset, employee, branch);

    // 2. Open print dialog using isolated iframe (bypasses iframe sandbox constraints)
    if (openPrintDialog) {
      const htmlContent = buildResponsivaPrintHtml(assignment, asset, employee, branch);
      executePrintDialog(htmlContent);
    }

    return true;
  } catch (err) {
    console.error('Error during PDF download and print execution:', err);
    // Fallback: Try browser direct print
    if (openPrintDialog) {
      window.print();
    }
    return false;
  }
};
