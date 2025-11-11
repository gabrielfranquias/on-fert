import React from 'react';
import { SavedAnalysis } from '../types';

interface Props {
  savedAnalyses: SavedAnalysis[];
}

const CompanyReport: React.FC<Props> = ({ savedAnalyses }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Relatório da Empresa</h2>
      <p className="text-gray-600 mb-8">Um registro de todas as análises de solo e cultura salvas.</p>

      {savedAnalyses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma análise salva</h3>
          <p className="mt-1 text-sm text-gray-500">Conclua uma nova análise e salve-a para vê-la aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultura</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dados do Solo (pH/N/P/K)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recomendação</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resumo do Raciocínio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {savedAnalyses.map((analysis) => (
                <tr key={analysis.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(analysis.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{analysis.soilData.crop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {analysis.soilData.ph} / {analysis.soilData.nitrogen} / {analysis.soilData.phosphorus} / {analysis.soilData.potassium}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {analysis.result.productRecommendation}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <p className="text-sm text-gray-500 truncate">{analysis.result.reasoning}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyReport;