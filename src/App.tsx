import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage, FileConverterPage, ImageScalerPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tools/file-converter" element={<FileConverterPage />} />
          <Route path="tools/image-scaler" element={<ImageScalerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
