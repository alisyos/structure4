import React from 'react';

interface SentenceAnalyzerProps {
  sentence: string;
  setSentence: (sentence: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const SentenceAnalyzer: React.FC<SentenceAnalyzerProps> = ({
  sentence,
  setSentence,
  onAnalyze,
  isLoading,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSentence(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="sentence"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            영어 문장 입력
          </label>
          <textarea
            id="sentence"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={sentence}
            onChange={handleInputChange}
            placeholder="분석할 영어 문장을 입력하세요. (예: The student who studied hard passed the exam.)"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? '분석 중...' : '문장 분석하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SentenceAnalyzer; 