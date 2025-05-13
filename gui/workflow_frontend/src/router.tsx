import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Grid, GridItem, Box } from '@chakra-ui/react';
import Header from './shared/header/header';
import HomeView from './views/home/homeView';
import FileView from './views/file/fileListView';
import NotFoundView from './views/notFound/notFound';
import BoxUpload from './views/box/uploadView';
import FileListView from './views/file/fileListView';
import CreateFlowPj from './views/file/createView';

function Router() {
  return (
    <BrowserRouter>
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

        <GridItem area="main"  overflowY="auto" pt="0">
          <Box p={4}>
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/file" element={<FileView />} />
              <Route path="/file/open" element={<FileListView />} />
              <Route path="/file/new" element={<CreateFlowPj />} />
              <Route path="/box/upload" element={<BoxUpload />} />
              <Route path="/*" element={<NotFoundView />} />
            </Routes>
          </Box>
        </GridItem>
      </Grid>
    </BrowserRouter>
  );
}

export default Router;
