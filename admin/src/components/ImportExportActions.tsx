import { Button, Dialog, Flex } from "@strapi/design-system";
import { CloudUpload, Download, Trash } from "@strapi/icons";
import { useNotification } from "@strapi/strapi/admin";
import dayjs from "dayjs";
import { destr } from "destr";
import { isEmpty, uniqBy } from "lodash";
import React, { useRef, useState } from "react";
import { useIntl } from "react-intl";
import { createTemplate, DATE_FORMAT } from "../services";
import { PDFTemplate } from "../types";
import { getTrad } from "../utils/getTrad";
import GlobalLoader from "./GlobalLoader";

/**
 * Props needed for the ImportExportActions component
 */
type ImportExportActionsProps = {
  /**
   * The array of email templates
   *
   * @default []
   */
  data: PDFTemplate[];
  /**
   * The function that handles the export of templates
   */
  handleTemplatesExport: Function;
  /**
   * The function that reloads the data
   */
  reload: Function;
};

/**
 * Component responsible for displaying the import and export actions
 */
const ImportExportActions = ({ data = [], reload, handleTemplatesExport }: ImportExportActionsProps) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  // Ref for the file input
  const pdfTemplatesFileSelect = useRef<HTMLInputElement>(null);

  const [importConfirmationModal, setImportConfirmationModal] = useState(false);
  const [importedTemplates, setImportedTemplates] = useState<PDFTemplate[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Check if the event is empty
    if (!event) return;
    // Get the files from the event
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    // Check if the file is empty
    if (!file) return;

    const fr = new FileReader();
    fr.onload = async () => {
      const content = destr<Array<any>>(fr.result);
      // Set the imported templates
      setImportedTemplates(content);
      // Show the confirmation modal
      setImportConfirmationModal(true);
    };
    // Read the file as text
    fr.readAsText(file);
  };

  const handleTemplatesImport = async () => {
    try {
      // Show the loader
      setImportLoading(true);
      // Local state for the imported templates
      let _importedTemplates = [];
      // Loop through the imported templates
      for (const template of importedTemplates) {
        // Create the template
        const response = await createTemplate(template.id, {
          ...template,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
          import: true,
        });
        // If the response is not empty, push it to the local state
        if (!isEmpty(response)) _importedTemplates.push(response);
      }
      // reload data in parent
      await reload();
      // notify user of success
      toggleNotification({
        type: "success",
        title: formatMessage({ id: getTrad("success") }),
        message: formatMessage({ id: getTrad("success.importingTemplates") }),
      });
    } catch (error) {
      console.error("💬 :: handleTemplatesImport :: Error", error);
      toggleNotification({
        type: "danger",
        title: formatMessage({ id: getTrad("error") }),
        message: formatMessage({ id: getTrad("error.importingTemplates") }),
      });
    } finally {
      // Reset the state
      setImportConfirmationModal(false);
      setImportLoading(false);
      setImportedTemplates([]);
    }
  };
  return (
    <>
      <GlobalLoader loading={importLoading} />
      <Dialog.Root
        open={importConfirmationModal}
        onOpenChange={() => {
          setImportConfirmationModal((s: boolean) => !s);
          // Reset the file input
          if (pdfTemplatesFileSelect.current) {
            pdfTemplatesFileSelect.current.value = "";
          }
        }}
      >
        <Dialog.Content>
          <Dialog.Header>{formatMessage({ id: getTrad("confirm.title") })}</Dialog.Header>
          <Dialog.Body icon={<CloudUpload width={50} height={50} />}>
            {formatMessage({ id: getTrad("confirm.import.message") })}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button disabled={importLoading} fullWidth variant="tertiary">
                Cancel
              </Button>
            </Dialog.Cancel>
            <Button
              loading={importLoading}
              disabled={importLoading}
              onClick={() => handleTemplatesImport()}
              fullWidth
              variant="success-light"
            >
              Yes, import
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
      <Flex style={{ padding: "30px 0px 10px" }} gap="14px" justifyContent="end">
        {data?.length > 0 && (
          <Button onClick={() => handleTemplatesExport()} color="success" startIcon={<Download />}>
            {formatMessage({ id: getTrad("designer.exportTemplates") })}
          </Button>
        )}

        <Button
          onClick={() => {
            pdfTemplatesFileSelect?.current?.click();
          }}
          startIcon={<CloudUpload />}
        >
          {formatMessage({ id: getTrad("designer.importTemplates") })}
        </Button>
      </Flex>
      {/* Accept only json files */}
      <input accept=".json" hidden type="file" ref={pdfTemplatesFileSelect} onChange={handleFileChange} />
    </>
  );
};

export default ImportExportActions;
