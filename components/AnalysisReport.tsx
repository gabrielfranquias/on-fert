import React from 'react';
import { SavedAnalysis } from '../types';

interface Props {
  analysis: SavedAnalysis;
  onSave: (analysis: SavedAnalysis) => void;
  onBack: () => void;
}

const DataRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 text-right">{value}</dd>
  </div>
);

const AnalysisReport: React.FC<Props> = ({ analysis, onSave, onBack }) => {
  const { soilData, imagePreview, result } = analysis;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-5xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Relatório de Análise</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Result and Reasoning */}
        <div className="lg:col-span-3">
          <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl">
            <p className="text-sm font-semibold text-green-700">Produto Recomendado</p>
            <h3 className="text-4xl font-bold text-green-800 my-2">{result.productRecommendation}</h3>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Confiança:</span>
              <div className="w-full bg-green-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${result.confidence * 100}%` }}></div>
              </div>
              <span className="text-sm font-bold text-green-700 ml-2">{Math.round(result.confidence * 100)}%</span>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">Raciocínio do Agrônomo IA</h4>
            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">{result.reasoning}</p>
          </div>
        </div>

        {/* Right Side: Submitted Data */}
        <div className="lg:col-span-2">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">Dados Enviados</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
                <img src={imagePreview} alt="Cultura enviada" className="w-full h-40 object-cover rounded-lg mb-4"/>
                <dl>
                    <DataRow label="Cultura" value={soilData.crop} />
                    <DataRow label="Tipo de Solo" value={soilData.soilType} />
                    <DataRow label="Nível de pH" value={soilData.ph} />
                    <DataRow label="Nitrogênio" value={`${soilData.nitrogen} ppm`} />
                    <DataRow label="Fósforo" value={`${soilData.phosphorus} ppm`} />
                    <DataRow label="Potássio" value={`${soilData.potassium} ppm`} />
                </dl>
            </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onBack} className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Nova Análise
        </button>
        <button onClick={() => onSave(analysis)} className="w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Salvar no Relatório da Empresa
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;