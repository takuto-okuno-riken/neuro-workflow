import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Grid, GridItem } from '@chakra-ui/react';
import Header from './shared/header/header';
import LoginView from './views/login/loginView';
import ProtectedRoute from './protectedRoute';
import { AuthProvider } from './auth/authContext';
import TabManager from './components/tabs/TabManager';

function Router() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ログインページ（認証不要） */}
          <Route path="/login" element={<LoginView />} />
          
          {/* 認証が必要なページ */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Grid
                  templateAreas={`
                    "header"
                    "main"
                  `}
                  gridTemplateRows={'64px 1fr'}
                  gridTemplateColumns={'1fr'}
                  h="100vh"
                >
                  <GridItem area="header" zIndex="100">
                    <Header />
                  </GridItem>

                  <GridItem area="main" overflowY="hidden" pt="0">
                    <TabManager />
                  </GridItem>
                </Grid>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default Router;
