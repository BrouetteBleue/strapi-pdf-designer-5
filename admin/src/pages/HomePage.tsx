import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
// import { auth, LoadingIndicatorPage } from '@strapi/helper-plugin';
import { faCopy as CopyIcon, faInfoCircle, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeStriked, Pencil, Duplicate, Trash, Plus, ArrowLeft, Stack } from '@strapi/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Flex, Tabs, TextInput, Button, Textarea, TooltipProvider, DesignSystemProvider, IconButton, Field, Dialog, Link, Table, Thead, Tbody, TFooter, Tr, Td, Th  } from '@strapi/design-system';
import { Layouts, Page, useNotification } from "@strapi/admin/strapi-admin";
import { isEmpty, isNil, pick, uniqBy } from 'lodash';
import { getUrl } from "../constants";
import { useIntl } from "react-intl"; 
import type { EmailTemplate } from "../types";
import { useTr } from "../hooks/useTr";
import styled from 'styled-components';
import { getMessage } from '../utils/getMessage';
import { getTrad } from "../utils/getTrad";
import {pluginId } from '../pluginId';
import dayjs from 'dayjs';
import {
    createTemplate,
    getCoreTemplate,
    getFullEditorConfig,
    getTemplateById,
    deleteTemplate,
    getTemplatesData,
    duplicateTemplate,
    updateCoreTemplate,
} from "../services";
import CustomEmailTable from '../components/CustomEmailTable';


const FooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 30px;
  padding: 0 10px;
`;

const FooterButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  button {
    margin-right: 0.5rem;
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const HomePage = () => {
  const navigate = useNavigate();
  const translate = useTr();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [duplicateConfirmationModal, setDuplicateConfirmationModal] = useState(false);
  const [importConfirmationModal, setImportConfirmationModal] = useState(false);
  const [importedTemplates, setImportedTemplates] = useState<EmailTemplate[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('customEmailTemplates');
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const [duplicateId, setDuplicateId] = useState();
  const [deleteId, setDeleteId] = useState();

  const emailTemplatesFileSelect = useRef<HTMLInputElement>(null);

  // TODO: handle current locale
  const dateFormat = 'DD/MM/YYYY HH:mm';

  const init = useCallback(async () => {
    const data = await getTemplatesData();
    setEmailTemplates(data);
  }, []);

  useEffect(() => {
    init().catch(() => {
      toggleNotification({
        type: "danger",
        title: translate("error"),
        message: translate("error.loadingTemplates"),
      });
    });
  }, []);

  const handleTemplateDuplication = useCallback(async () => {
    if (!duplicateId) return;
    try {
        const response = await duplicateTemplate(duplicateId);
        toggleNotification({
          type: "success",
          title: formatMessage({ id: getTrad("success") }),
          message: formatMessage({ id: getTrad("success.duplicate") }),
        });
        navigate({ pathname: getUrl(`design/${response.id}`) });
    } catch (error) {
        toggleNotification({
            type: "danger",
            title: formatMessage({ id: getTrad("error") }),
            message: formatMessage({ id: getTrad("error.duplicate") }),
        });
    }
  }, [duplicateConfirmationModal]);

  const handleTemplateDeletion = useCallback(async () => {
    if (!deleteId) return;
    try {
        const { success } = await deleteTemplate(deleteId);

        if (success) {
            setEmailTemplates((state) => state.filter((el) => el.id !== deleteId));
            setDeleteConfirmationModal(false);
            toggleNotification({
                type: "success",
                title: formatMessage({ id: getTrad("success") }),
                message: formatMessage({ id: getTrad("success.delete") }),
              });
          } else {
            toggleNotification({
                type: "danger",
                title: formatMessage({ id: getTrad("error") }),
                message: formatMessage({ id: getTrad("error.delete") }),
            });
          }
    } catch (error) {
        toggleNotification({
            type: "danger",
            title: formatMessage({ id: getTrad("error") }),
            message: formatMessage({ id: getTrad("error.delete") }),
        });
    }
  }, [deleteConfirmationModal]);

  const handleTemplatesExport = async () => {
    const templates = await getTemplatesData();

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(templates))}`;
    let a = document.createElement('a');
    a.href = dataStr;
    a.download = `${pluginId}-templates_${dayjs().unix()}.json`;
    a.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {

    if (!event) return;
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

      const fr = new FileReader();
      fr.onload = async () => {
        const content = JSON.parse(fr?.result?.toString() || '');

        setImportConfirmationModal(true);
        setImportedTemplates(content);
      };

      fr.readAsText(file);
  };

  const handleTemplatesImport = async () => {
    try {
      setImportLoading(true);
      let _importedTemplates: any[] = [];

      for (const template of importedTemplates) {
        console.log('💬 :: forawait :: template', template);
        const response = await createTemplate(template.id, {
            ...template,
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
            import: true,
          }); 
          console.log('💬 :: forawait :: response', response);
          // If the response is not empty, push it to the local state
          if (!isEmpty(response)) _importedTemplates.push(response);   
      }

      let newTemplates = [...emailTemplates, ..._importedTemplates].map((data) => {
        data.enabled = data.enabled?.toString();
        data.createdAt = dayjs(data.createdAt).format(dateFormat);

        return data;
      });

      newTemplates = uniqBy(newTemplates, (_) => _.id);

      setEmailTemplates(newTemplates);
    //   await reload();

    //   emailTemplatesFileSelect.current.value = '';
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
      setImportConfirmationModal(false);
      setImportLoading(false);
      setImportedTemplates([]);
    }
  };

  const emailTemplatesHeaders = [
    { name: getMessage('table.name'), value: 'name' },
    // { name: getMessage('table.templateId'), value: 'id' },
    { name: getMessage('table.templateReferenceId'), value: 'templateReferenceId' },
    { name: getMessage('table.enabled'), value: 'enabled' },
    { name: getMessage('table.createdAt'), value: 'createdAt' },
  ];

  const coreTemplatesHeaders = [{ name: getMessage('table.coreEmailType'), value: 'name' }];
  const coreEmailTypes = [
    {
      coreEmailType: 'user-address-confirmation',
      name: getMessage('user-address-confirmation'),
    },
    {
      coreEmailType: 'reset-password',
      name: getMessage('reset-password'),
    },
  ];

  return (
    <Page.Main>
      {/* {emailTemplates === undefined ? (
        // <LoadingIndicatorPage /> 
        null
      ) : ( */}
        <DesignSystemProvider>
          <Dialog.Root
            
            // isConfirmButtonLoading={importLoading}
            open={importConfirmationModal && importedTemplates.length > 0}
            onOpenChange={() => {
                setImportConfirmationModal((s: boolean) => !s);
                if (emailTemplatesFileSelect.current) {
                    emailTemplatesFileSelect.current.value = '';
                }
              setImportedTemplates([]);
            }}
          >
            <Dialog.Content>
              <Dialog.Body>
                <Stack>
                  <Flex justifyContent="center">
                    <Typography id="confirm-description">{getMessage('notification.importTemplate')}</Typography>
                  </Flex>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                  <Dialog.Cancel>   
                      <Button onClick={() => setImportConfirmationModal(false)} variant="tertiary">
                          Cancel
                      </Button>
                  </Dialog.Cancel>
                  <Button variant="danger-light" startIcon={<Trash />} onClick={() => handleTemplatesImport()}>
                    Confirm
                  </Button>
              </Dialog.Footer>
            </Dialog.Content>
            
          </Dialog.Root>
          <Dialog.Root
            isOpen={!isNil(duplicateConfirmationModal) && duplicateConfirmationModal !== false}
            title={getMessage('pleaseConfirm')}
            onClose={() => setDuplicateConfirmationModal(false)}
          >
            <Dialog.Content>
              <Dialog.Body >
                <Stack >
                  <Flex justifyContent="center">
                    <Typography id="confirm-description">{getMessage('questions.sureToDuplicate')}</Typography>
                  </Flex>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.Cancel>
                  <Button onClick={() => setDuplicateConfirmationModal(false)} variant="tertiary">
                    Cancel
                  </Button>
                </Dialog.Cancel>

                <Dialog.Action>
                  <Button variant="danger-light" startIcon={<Duplicate />} onClick={() => handleTemplateDuplication()}>
                    Confirm
                  </Button>
                </Dialog.Action>

              </Dialog.Footer>
            </Dialog.Content>
            
          </Dialog.Root>

          <Dialog.Root
            open={!isNil(deleteConfirmationModal) && deleteConfirmationModal !== false}
            // title={getMessage('pleaseConfirm')}
            toggleModal={() => setDeleteConfirmationModal(false)}
            onClose={() => setDeleteConfirmationModal(false)}
          >
            <Dialog.Content>
              <Dialog.Body>
                <Stack >
                  <Flex justifyContent="center">
                    <Typography id="confirm-description">{getMessage('questions.sureToDelete')}</Typography>
                  </Flex>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.Cancel>
                <Button onClick={() => setDeleteConfirmationModal(false)} variant="tertiary">
                    Cancel
                  </Button>
                </Dialog.Cancel>

                <Dialog.Action>
                  <Button variant="danger-light" startIcon={<Trash />} onClick={() => handleTemplateDeletion()}>
                    Confirm
                  </Button>
                </Dialog.Action>
              </Dialog.Footer>
            </Dialog.Content>
            
          </Dialog.Root>

          <Layouts.Header
            navigationAction={
              <Link startIcon={<ArrowLeft />} onClick={() => navigate({ pathname: getUrl()})}>
                {getMessage('goBack')}
              </Link>
            }
            primaryAction={
              <Button startIcon={<Plus />} onClick={() => navigate({ pathname: getUrl(`design/new`) })}>
                {getMessage('newTemplate')}
              </Button>
            }
            title={getMessage('plugin.name')}
            subtitle={getMessage('header.description')}
          />

          <Layouts.Content>
            <Tabs.Root
              value={activeTab}
              onValueChange={(selected: string) => {
                setActiveTab(selected)
              }}
            >

              <Tabs.List aria-label="Switch between custom email designs & core email designs">
                <Tabs.Trigger value="customEmailTemplates">
                  {translate("PDFTypes.custom.tab.label")}
                </Tabs.Trigger>
                <Tabs.Trigger value="coreEmailTemplates">{translate("PDFTypes.core.tab.label")}</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content
                style={{ borderBottomRightRadius: "6px", borderBottomLeftRadius: "6px" }}
                value="customEmailTemplates"
              >
                <CustomEmailTable reload={init} data={emailTemplates} />
              </Tabs.Content>
              <Tabs.Content>
                  <Table
                    colCount={emailTemplatesHeaders.length}
                    rowCount={emailTemplates.length}
                    footer={
                      <TFooter icon={<Plus />} onClick={() => navigate({ pathname: getUrl('design/new')})}>
                        Add another field to this collection type
                      </TFooter>
                    }
                  >
                    <Thead>
                      <Tr>
                        {emailTemplatesHeaders.map((header) => (
                          <Th key={header.value}>
                            <Typography variant="sigma">{header.name}</Typography>
                          </Th>
                        ))}
                        <Th>
                          <Typography variant="sigma">{getMessage('table.actions')}</Typography>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {emailTemplates.map((template, index) => (
                        <Tr key={index}>
                          <Td>
                            <Typography textColor="neutral800">{template.name}</Typography>
                          </Td>
                          {/* <Td>
                            <Typography textColor="neutral800">{template.id}</Typography>
                          </Td> */}
                          <Td>
                            <Typography textColor="neutral800">{template.templateReferenceId}</Typography>
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">
                              {/* {template.enabled === true ? <Eye fill="#dedede" /> : <EyeStriked fillColor="#dedede" />} */}
                            </Typography>
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">{template.createdAt}</Typography>
                          </Td>
                          <Td>
                            <Flex>
                              <IconButton
                                label={getMessage('tooltip.edit')}
                                onClick={() => navigate({ pathname: getUrl(`design/${template.id}`) })}
                              >
                                <Pencil />
                              </IconButton>


                              <IconButton
                                label={getMessage('tooltip.duplicate')}
                                onClick={() => setDuplicateConfirmationModal(template.id)}
                              >
                                <Duplicate fill="#000000" />
                              </IconButton>

                              <IconButton
                                label={getMessage('tooltip.copyTemplateId')}
                                // FIXME: use Strapi's icon
                                onClick={() => {
                                  navigator.clipboard.writeText(`${template.id}`).then(
                                    () => {
                                      toggleNotification({
                                        type: 'success',
                                        title: translate("success"),
                                        message: translate("notification.templateIdCopied"),
                                      });
                                      console.log('Template ID copied to clipboard successfully!');
                                    },
                                    (err) => {
                                      console.error('Could not copy text: ', err);
                                    }
                                  );
                                }}
                              >
                                <FontAwesomeIcon icon={CopyIcon} />
                              </IconButton>

                              <Box paddingLeft={1}>
                                <IconButton
                                  label={getMessage('tooltip.delete')}
                                  onClick={() => setDeleteConfirmationModal(template.id)}
                                >
                                  <Trash />
                                </IconButton>
                              </Box>
                            </Flex>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

              </Tabs.Content>
              {/* <Tabs> */}
                {/* <Typography>{getMessage('customEmailTemplates')}</Typography> */}
              {/* </Tabs> */}
            </Tabs.Root>
              

              

            <FooterWrapper>

              {activeTab === 'customEmailTemplates' && (
                <FooterButtonsWrapper>
                  {emailTemplates?.length > 0 && (
                    <IconButton
                      onClick={() => handleTemplatesExport()}
                      color="success"
                      label={getMessage('designer.exportTemplates')}
                    >
                      <FontAwesomeIcon icon={faFileExport} />
                    </IconButton>
                  )} 

                  <IconButton
                    onClick={() => {
                      emailTemplatesFileSelect?.current?.click();
                    }}
                    color="delete"
                    label={getMessage('designer.importTemplates')}
                  >
                    <FontAwesomeIcon icon={faFileImport} />
                  </IconButton>
                  <span style={{ display: 'none' }}>
                    <input type="file" ref={emailTemplatesFileSelect} onChange={handleFileChange} />
                  </span>
                </FooterButtonsWrapper>
              )}
            </FooterWrapper>
          </Layouts.Content>
        </ DesignSystemProvider>
      {/* )} */}
    </Page.Main>
  );
};

export default memo(HomePage);
