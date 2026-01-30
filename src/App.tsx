import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  HomePage,
  FileConverterPage,
  ImageScalerPage,
  PaystubGeneratorPage,
  OcrEditorPage,
  VideoDownloaderPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tools/file-converter" element={<FileConverterPage />} />
          <Route path="tools/image-scaler" element={<ImageScalerPage />} />
          <Route path="tools/paystub-generator" element={<PaystubGeneratorPage />} />
          <Route path="tools/ocr-editor" element={<OcrEditorPage />} />
          <Route path="tools/video-downloader" element={<VideoDownloaderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
