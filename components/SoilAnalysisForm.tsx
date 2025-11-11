import React, { useState, useRef } from 'react';
import { SoilData } from '../types';
import { Spinner } from './icons';

interface Props {
  onAnalyze: (soilData: SoilData, imageFile: File) => void;
  isLoading: boolean;
}

const SoilAnalysisForm: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [soilData, setSoilData] = useState<SoilData>({
    crop: 'Soja',
    soilType: 'Argiloso',
    ph: 6.5,
    nitrogen: 20,
    phosphorus: 15,
    potassium: 30,
    history: 'Cultura anterior de milho, sistema de plantio direto.',
    climate: 'Temperado, com chuvas médias.',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSoilData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('O tamanho da imagem deve ser inferior a 4MB.');
        return;
      }
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Por favor, envie uma imagem da cultura ou do solo.');
      return;
    }
    setError(null);
    onAnalyze(soilData, imageFile);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Análise de Solo e Cultura</h2>
      <p className="text-gray-600 mb-8">Insira os dados do solo e envie uma foto para análise e recomendação com tecnologia de IA.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form Inputs */}
          <div className="space-y-6">
            <div>
              <label htmlFor="crop" className="block text-sm font-medium text-gray-700 mb-1">Cultura / Plantação</label>
              <input type="text" name="crop" id="crop" value={soilData.crop} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
            </div>
            <div>
              <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solo</label>
              <input type="text" name="soilType" id="soilType" value={soilData.soilType} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-1">Nível de pH</label>
                <input type="number" name="ph" id="ph" step="0.1" value={soilData.ph} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div>
                <label htmlFor="nitrogen" className="block text-sm font-medium text-gray-700 mb-1">Nitrogênio (ppm)</label>
                <input type="number" name="nitrogen" id="nitrogen" value={soilData.nitrogen} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div>
                <label htmlFor="phosphorus" className="block text-sm font-medium text-gray-700 mb-1">Fósforo (ppm)</label>
                <input type="number" name="phosphorus" id="phosphorus" value={soilData.phosphorus} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div>
                <label htmlFor="potassium" className="block text-sm font-medium text-gray-700 mb-1">Potássio (ppm)</label>
                <input type="number" name="potassium" id="potassium" value={soilData.potassium} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
              </div>
            </div>
            <div>
              <label htmlFor="history" className="block text-sm font-medium text-gray-700 mb-1">Histórico de Produtividade</label>
              <textarea name="history" id="history" rows={3} value={soilData.history} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"></textarea>
            </div>
             <div>
              <label htmlFor="climate" className="block text-sm font-medium text-gray-700 mb-1">Condições Climáticas</label>
              <textarea name="climate" id="climate" rows={3} value={soilData.climate} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"></textarea>
            </div>
          </div>

          {/* Right Column: Image Upload */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto da Cultura/Solo</label>
            <div 
              className="flex-grow w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Amostra da cultura" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm">Clique para enviar uma imagem</p>
                  <p className="text-xs">PNG, JPG até 4MB</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        
        <div className="mt-8 text-center">
            <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center px-12 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                {isLoading ? <><Spinner className="h-5 w-5 mr-3" /> Analisando...</> : 'Executar Análise'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SoilAnalysisForm;