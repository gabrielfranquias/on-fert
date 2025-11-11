import React, { useState } from 'react';
import { AppView, SoilData, AnalysisResult, SavedAnalysis } from './types';
import SoilAnalysisForm from './components/SoilAnalysisForm';
import AnalysisReport from './components/AnalysisReport';
import CompanyReport from './components/CompanyReport';
import LiveAssistant from './components/LiveAssistant';
import { analyzeSoilAndImage } from './services/geminiService';

const Header = ({ currentView, setView }: { currentView: AppView, setView: (view: AppView) => void }) => {
    const navItems = [
        { view: AppView.ANALYSIS_FORM, label: 'Análise de Solo' },
        { view: AppView.LIVE_ASSISTANT, label: 'Assistente ao Vivo' },
        { view: AppView.COMPANY_REPORT, label: 'Relatório da Empresa' },
    ];

    const isAnalysisView = currentView === AppView.ANALYSIS_FORM || currentView === AppView.ANALYSIS_RESULT;

    return (
        <header className="bg-white shadow-md mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.4,4.2C9,5.9,8.4,7.7,8.4,9.6c0,2.6,0.9,4.9,2.6,6.9s3.9,3.1,6.4,3.1c1.8,0,3.3-0.5,4.6-1.4v1c0,1.2-0.4,2.2-1.2,3c-0.8,0.8-1.8,1.2-3,1.2H8.3c-2.4,0-4.5-0.9-6.3-2.6S-0.1,17.1,0,14.5c0.1-2.9,1.1-5.4,3-7.5s4.2-3.2,6.9-3.2h1.2C10.8,3.8,10.6,4,10.4,4.2z M17.4,8.6c-1.1-1.1-2.5-1.7-4.2-1.7s-3.1,0.6-4.2,1.7s-1.7,2.5-1.7,4.2s0.6,3.1,1.7,4.2s2.5,1.7,4.2,1.7s3.1-0.6,4.2-1.7s1.7-2.5,1.7-4.2S18.5,9.7,17.4,8.6z" fill="currentColor"/></svg>
                    <h1 className="text-2xl font-bold ml-3 text-gray-800">ON FERT <span className="text-green-600">Analista IA</span></h1>
                </div>
                <nav className="hidden md:flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    {navItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                (item.view === AppView.ANALYSIS_FORM && isAnalysisView) || item.view === currentView
                                ? 'bg-white text-green-600 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<AppView>(AppView.ANALYSIS_FORM);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentAnalysis, setCurrentAnalysis] = useState<SavedAnalysis | null>(null);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleAnalyze = async (soilData: SoilData, imageFile: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const result: AnalysisResult = await analyzeSoilAndImage(soilData, imageBase64);
            
            setCurrentAnalysis({
                id: new Date().toISOString(),
                timestamp: new Date().toISOString(),
                soilData,
                imagePreview: URL.createObjectURL(imageFile),
                result,
            });
            setCurrentView(AppView.ANALYSIS_RESULT);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido durante a análise.");
            // Stay on the form view to show the error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAnalysis = (analysis: SavedAnalysis) => {
        setSavedAnalyses(prev => [analysis, ...prev]);
        setCurrentView(AppView.COMPANY_REPORT);
    };

    const renderContent = () => {
        switch (currentView) {
            case AppView.ANALYSIS_FORM:
                return <SoilAnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />;
            case AppView.ANALYSIS_RESULT:
                if (currentAnalysis) {
                    return <AnalysisReport 
                        analysis={currentAnalysis} 
                        onSave={handleSaveAnalysis} 
                        onBack={() => setCurrentView(AppView.ANALYSIS_FORM)} 
                    />;
                }
                return null; // Should not happen
            case AppView.LIVE_ASSISTANT:
                return <LiveAssistant />;
            case AppView.COMPANY_REPORT:
                return <CompanyReport savedAnalyses={savedAnalyses} />;
            default:
                return <SoilAnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentView={currentView} setView={setCurrentView} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 max-w-4xl mx-auto" role="alert">
                        <strong className="font-bold">Erro: </strong>
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                        </span>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;