import React, { useEffect, useRef } from 'react';

interface Component {
  type: string;
  text: string;
  role: string;
}

interface AnalysisData {
  sentence: string;
  components: Component[];
  rawResponse?: string;
}

interface AnalysisResultProps {
  analysis: AnalysisData;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis }) => {
  const visualSentenceRef = useRef<HTMLDivElement>(null);

  // 원시 응답만 있는 경우 (JSON 파싱 실패)
  if (analysis.rawResponse && !analysis.components) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">분석 결과</h2>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">원본 문장:</h3>
          <p className="p-2 bg-gray-100 rounded">{analysis.sentence}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">분석:</h3>
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-sm">
            {analysis.rawResponse}
          </pre>
        </div>
      </div>
    );
  }

  // 문장 성분 유형별로 그룹화
  const groupedComponents: Record<string, Component[]> = {};
  
  analysis.components?.forEach((component) => {
    if (!groupedComponents[component.type]) {
      groupedComponents[component.type] = [];
    }
    groupedComponents[component.type].push(component);
  });

  // 시각적 표현을 위한 함수
  useEffect(() => {
    if (!analysis.components || !visualSentenceRef.current) return;

    const sentence = analysis.sentence;
    const container = visualSentenceRef.current;
    
    // 컨테이너 초기화
    container.innerHTML = '';
    
    // 문장 성분 정보를 저장할 배열
    type ComponentInfo = {
      type: string;
      text: string;
      startIndex: number;
      endIndex: number;
    };
    
    const componentInfos: ComponentInfo[] = [];
    
    // 각 성분의 위치 정보 찾기
    analysis.components.forEach((component) => {
      const componentText = component.text;
      const componentType = component.type;
      
      // 정확한 매칭을 위해 정규식 사용
      const regex = new RegExp(`\\b${componentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = sentence.match(regex);
      
      if (match && match.index !== undefined) {
        componentInfos.push({
          type: componentType,
          text: componentText,
          startIndex: match.index,
          endIndex: match.index + componentText.length
        });
      }
    });
    
    // 위치에 따라 정렬
    componentInfos.sort((a, b) => a.startIndex - b.startIndex);
    
    // 처리된 인덱스를 추적
    const processedIndices = new Set<number>();
    
    // 각 문자를 처리
    let currentIndex = 0;
    
    while (currentIndex < sentence.length) {
      // 현재 인덱스에 해당하는 성분 찾기
      const matchingComponents = componentInfos.filter(
        comp => comp.startIndex <= currentIndex && comp.endIndex > currentIndex
      );
      
      if (matchingComponents.length > 0) {
        // 가장 긴 성분 선택 (중첩된 경우)
        const component = matchingComponents.reduce(
          (longest, current) => 
            (current.endIndex - current.startIndex) > (longest.endIndex - longest.startIndex) 
              ? current 
              : longest, 
          matchingComponents[0]
        );
        
        // 이미 처리된 성분인지 확인
        if (!processedIndices.has(component.startIndex)) {
          const { type, text, startIndex, endIndex } = component;
          
          // 주어, 동사, 목적어, 전치사구 확인
          const isSubject = type.toLowerCase().includes('주어');
          const isVerb = type.toLowerCase().includes('동사');
          const isObject = type.toLowerCase().includes('목적어');
          const isPrepPhrase = type.toLowerCase().includes('전치사구');
          
          const span = document.createElement('span');
          span.className = 'relative inline-block mx-1 group';
          
          const innerSpan = document.createElement('span');
          
          if (isSubject) {
            innerSpan.className = 'text-blue-600 border-b-2 border-blue-600';
            innerSpan.textContent = text;
            
            const label = document.createElement('span');
            label.className = 'absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-bold';
            label.textContent = 'S';
            
            span.appendChild(innerSpan);
            span.appendChild(label);
          } else if (isVerb) {
            innerSpan.className = 'text-red-600 border-b-2 border-red-600';
            innerSpan.textContent = text;
            
            const label = document.createElement('span');
            label.className = 'absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-bold';
            label.textContent = 'V';
            
            span.appendChild(innerSpan);
            span.appendChild(label);
          } else if (isObject) {
            innerSpan.className = 'text-green-600 border-b-2 border-green-600';
            innerSpan.textContent = text;
            
            const label = document.createElement('span');
            label.className = 'absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-green-600 font-bold';
            label.textContent = 'O';
            
            span.appendChild(innerSpan);
            span.appendChild(label);
          } else if (isPrepPhrase) {
            innerSpan.className = 'text-black';
            
            const openBracket = document.createElement('span');
            openBracket.className = 'text-orange-500 font-bold';
            openBracket.textContent = '(';
            
            const closeBracket = document.createElement('span');
            closeBracket.className = 'text-orange-500 font-bold';
            closeBracket.textContent = ')';
            
            innerSpan.appendChild(openBracket);
            innerSpan.appendChild(document.createTextNode(text));
            innerSpan.appendChild(closeBracket);
            
            span.appendChild(innerSpan);
          }
          
          container.appendChild(span);
          
          // 처리된 인덱스 표시
          processedIndices.add(startIndex);
          currentIndex = endIndex;
          continue;
        }
      }
      
      // 처리되지 않은 텍스트 추가
      let endOfPlainText = sentence.length;
      
      // 다음 성분의 시작 위치 찾기
      for (const comp of componentInfos) {
        if (comp.startIndex > currentIndex && comp.startIndex < endOfPlainText) {
          endOfPlainText = comp.startIndex;
        }
      }
      
      if (endOfPlainText > currentIndex) {
        const plainText = sentence.substring(currentIndex, endOfPlainText);
        const textNode = document.createTextNode(plainText);
        container.appendChild(textNode);
        currentIndex = endOfPlainText;
      } else {
        // 안전장치: 무한 루프 방지
        currentIndex++;
      }
    }
  }, [analysis]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">분석 결과</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">원본 문장:</h3>
        <p className="p-3 bg-gray-100 rounded">{analysis.sentence}</p>
      </div>
      
      <div className="mb-8">
        <h3 className="font-semibold mb-2">성분 분석 시각화:</h3>
        <div 
          ref={visualSentenceRef}
          className="p-4 bg-gray-100 rounded min-h-16 flex flex-wrap items-center"
        />
        <div className="mt-10 pt-4 flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-blue-600 mr-2"></span>
            <span>주어 (S)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-red-600 mr-2"></span>
            <span>동사 (V)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-green-600 mr-2"></span>
            <span>목적어 (O)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-orange-400 mr-2"></span>
            <span>전치사구</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {Object.entries(groupedComponents).map(([type, components]) => (
          <div key={type} className="border-b pb-4">
            <h3 className="font-semibold text-lg mb-2 text-blue-700">{type}</h3>
            <ul className="space-y-3">
              {components.map((component, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded">
                  <div className="flex flex-col md:flex-row md:gap-4">
                    <div className="font-medium text-gray-800 md:w-1/3">
                      {component.text}
                    </div>
                    <div className="text-gray-600 md:w-2/3">{component.role}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResult; 