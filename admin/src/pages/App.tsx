import { Route, Routes } from "react-router-dom";
import { Page } from "@strapi/strapi/admin";

// Utils
import styled from 'styled-components';
import { pluginId } from '../pluginId';
import { DesignSystemProvider, lightTheme, darkTheme } from "@strapi/design-system";

// Pages
import  { HomePage }  from './HomePage';
import  Designer  from './Designer';
import  HowToPage  from './HowToPage';

const App = () => {
  const PluginViewWrapper = styled.div`
    min-height: 100vh;
  `;

  return (
    <DesignSystemProvider theme={darkTheme}>
      <PluginViewWrapper>
        <Routes>
          <Route index element={<HomePage />} />
        <Route path="design/:templateId" element={<Designer />} />
        <Route path="how-to" element={<HowToPage />} />
        <Route path="*" element={<Page.Error />} />
        </Routes>
      </PluginViewWrapper>
    </DesignSystemProvider>
  );
};

export { App };
