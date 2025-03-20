'use client';

import React, { useEffect, useRef } from 'react';

interface ComponentData {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
  role?: string;
}

interface AnalysisResultProps {
  analysis: {
    components?: ComponentData[];
    sentence: string;
    rawResponse?: string;
  };
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
  const groupedComponents: Record<string, ComponentData[]> = {};
  
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
      
      // 이미 처리된 위치는 건너뛰기
      const alreadyProcessed = componentInfos.some(info => 
        info.startIndex === sentence.indexOf(componentText) && 
        info.text === componentText
      );
      
      if (alreadyProcessed) {
        return;
      }

      if (componentType.toLowerCase() === '전치사구' || 
          componentType.toLowerCase().replace(/\s+/g, '') === '목적격보어') {
        // 전치사구와 목적격 보어는 정확한 문자열 매칭 사용
        let index = -1;
        if (componentType.toLowerCase().replace(/\s+/g, '') === '목적격보어') {
          // 목적격 보어는 단어 경계를 사용한 정확한 매칭
          const regex = new RegExp(`\\b${componentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          const match = sentence.match(regex);
          if (match && match.index !== undefined) {
            index = match.index;
          }
        } else {
          // 전치사구는 기존 방식 유지
          index = sentence.indexOf(componentText);
        }
        
        if (index !== -1) {
          componentInfos.push({
            type: componentType,
            text: componentText,
            startIndex: index,
            endIndex: index + componentText.length
          });
        }
      } else {
        // 다른 성분들은 기존 방식대로 단어 경계 매칭 사용
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
      const matchingComponents = componentInfos.filter(comp => {
        // 이미 처리된 인덱스는 건너뛰기
        if (processedIndices.has(comp.startIndex)) {
          return false;
        }
        
        // 목적격 보어나 전치사구의 경우 시작 위치가 정확히 일치할 때만 처리
        if (comp.type.toLowerCase().replace(/\s+/g, '') === '목적격보어' ||
            comp.type.toLowerCase() === '전치사구') {
          return comp.startIndex === currentIndex;
        }
        
        // 다른 성분들은 현재 위치가 범위 내에 있을 때 처리
        return comp.startIndex <= currentIndex && comp.endIndex > currentIndex;
      });
      
      if (matchingComponents.length > 0) {
        // 가장 짧은 텍스트 찾기
        const shortestComponent = matchingComponents.reduce((shortest, current) => {
          const currentLength = current.endIndex - current.startIndex;
          const shortestLength = shortest.endIndex - shortest.startIndex;
          return currentLength < shortestLength ? current : shortest;
        });

        const container = document.createElement('div');
        container.className = 'relative inline-block mx-1';
        
        // 텍스트는 한 번만 표시
        const text = sentence.substring(currentIndex, shortestComponent.endIndex);
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        
        // 각 성분별 스타일과 라벨 추가
        const underlineContainer = document.createElement('div');
        underlineContainer.className = 'absolute w-full';
        
        // 현재 텍스트 범위에 해당하는 모든 성분 처리
        const overlappingComponents = componentInfos.filter(comp => {
          // 이미 처리된 인덱스는 건너뛰기
          if (processedIndices.has(comp.startIndex)) {
            return false;
          }
          
          // 목적격 보어나 전치사구의 경우 정확히 일치하는 경우만 처리
          if (comp.type.toLowerCase().replace(/\s+/g, '') === '목적격보어' ||
              comp.type.toLowerCase() === '전치사구') {
            return comp.startIndex === currentIndex && 
                   comp.endIndex === shortestComponent.endIndex;
          }
          
          // 다른 성분들은 기존 방식대로 처리
          return comp.startIndex <= currentIndex && 
                 comp.endIndex >= shortestComponent.endIndex;
        });
        
        overlappingComponents.forEach((component, index) => {
          const { type } = component;
          
          // 문법 성분 타입 확인
          // 문장 성분 (구구조 분석)
          const isSubject = type.toLowerCase() === '주어';
          const isDummySubject = type.toLowerCase() === '가주어';
          const isRealSubject = type.toLowerCase() === '진주어';
          const isLogicalSubject = type.toLowerCase() === '의미상주어';
          const isVerb = type.toLowerCase() === '동사';
          const isObject = type.toLowerCase() === '목적어';
          const isIndirectObject = type.toLowerCase() === '간접목적어';
          const isDirectObject = type.toLowerCase() === '직접목적어';
          const isSubjectComplement = type.toLowerCase() === '주격보어';
          const isObjectComplement = type.toLowerCase().replace(/\s+/g, '') === '목적격보어';
          
          // 문법요소 분석 (구만 표기)
          // 명사구
          const isNounPhrase = type.toLowerCase() === '명사구';
          const isGerundPhrase = type.toLowerCase() === '동명사구';
          const isInfinitiveNoun = type.toLowerCase() === 'to부정사구(명사적용법)';
          const isWhInfinitive = type.toLowerCase() === '의문사+to부정사구';
          
          // 형용사구
          const isPresentParticiple = type.toLowerCase() === '현재분사구';
          const isPastParticiple = type.toLowerCase() === '과거분사구';
          const isPrepAdjPhrase = type.toLowerCase() === '전치사구(형용사적용법)';
          const isInfinitiveAdj = type.toLowerCase() === 'to부정사구(형용사적용법)';
          
          // 부사구
          const isPrepAdvPhrase = type.toLowerCase() === '전치사구(부사적용법)';
          const isInfinitiveAdv = type.toLowerCase() === 'to부정사구(부사적용법)';
          const isAdverbPhrase = type.toLowerCase() === '부사구';
          
          // 명사절
          const isThatClause = type.toLowerCase() === '접속사that절';
          const isWhClause = type.toLowerCase() === '의문사절';
          const isIfWhetherClause = type.toLowerCase() === 'if/whether절';
          const isWhatClause = type.toLowerCase() === '관계사what절';
          
          // 형용사절
          const isSubjectRelClause = type.toLowerCase() === '주격관계대명사절';
          const isObjectRelClause = type.toLowerCase() === '목적격관계대명사절';
          const isRelAdvClause = type.toLowerCase() === '관계부사절';
          
          // 부사절
          const isAdverbClause = type.toLowerCase() === '부사절';
          
          // 기타 요소
          const isAdverb = type.toLowerCase() === '부사';
          const isConjunction = type.toLowerCase() === '접속사';
          
          // 상단 라벨 생성 함수
          const createTopLabel = (text: string, color: string) => {
            const label = document.createElement('span');
            label.className = `absolute text-xs font-bold ${color}`;
            label.style.top = `${-20 - (index * 20)}px`;
            label.textContent = text;
            return label;
          };
          
          // 하단 라벨 생성 함수
          const createBottomLabel = (text: string, color: string) => {
            const label = document.createElement('span');
            label.className = `absolute left-1/2 transform -translate-x-1/2 text-xs font-bold ${color}`;
            label.style.bottom = `${-20 - (index * 20)}px`;
            label.textContent = text;
            return label;
          };
          
          // 괄호 생성 함수
          const createBrackets = (color: string, isSquare: boolean = false) => {
            const bracketContainer = document.createElement('div');
            bracketContainer.className = 'absolute w-full h-full';
            
            const openBracket = document.createElement('span');
            const closeBracket = document.createElement('span');
            
            openBracket.className = `absolute left-0 transform -translate-x-2 font-bold ${color}`;
            closeBracket.className = `absolute right-0 transform translate-x-2 font-bold ${color}`;
            
            openBracket.textContent = isSquare ? '[' : '(';
            closeBracket.textContent = isSquare ? ']' : ')';
            
            bracketContainer.appendChild(openBracket);
            bracketContainer.appendChild(closeBracket);
            
            return bracketContainer;
          };
          
          // 밑줄 요소 생성
          const underline = document.createElement('div');
          underline.className = 'absolute w-full';
          underline.style.bottom = `${-2 - (index * 3)}px`;
          
          // 문장 성분 스타일 적용
          if (isSubject || isDummySubject || isRealSubject || isLogicalSubject) {
            textSpan.classList.add('text-blue-600');
            underline.className += ' border-b-2 border-blue-600';
            const label = isDummySubject ? '(가)S' :
                         isRealSubject ? '(진)S' :
                         isLogicalSubject ? '(의)S' : 'S';
            container.appendChild(createBottomLabel(label, 'text-blue-600'));
          } else if (isVerb) {
            textSpan.classList.add('text-red-600');
            underline.className += ' border-b-2 border-red-600';
            container.appendChild(createBottomLabel('V', 'text-red-600'));
          } else if (isIndirectObject) {
            textSpan.classList.add('text-green-600');
            underline.className += ' border-b-2 border-green-600';
            container.appendChild(createBottomLabel('IO', 'text-green-600'));
          } else if (isDirectObject) {
            textSpan.classList.add('text-green-600');
            underline.className += ' border-b-2 border-green-600';
            container.appendChild(createBottomLabel('DO', 'text-green-600'));
          } else if (isObject) {
            textSpan.classList.add('text-green-600');
            underline.className += ' border-b-2 border-green-600';
            container.appendChild(createBottomLabel('O', 'text-green-600'));
          } else if (isSubjectComplement) {
            underline.className += ' border-b-2 border-indigo-600';
            container.appendChild(createBottomLabel('SC', 'text-indigo-600'));
          } else if (isObjectComplement) {
            underline.className += ' border-b-2 border-indigo-600';
            container.appendChild(createBottomLabel('OC', 'text-indigo-600'));
          }
          // 명사구 스타일 적용
          else if (isNounPhrase || isGerundPhrase || isInfinitiveNoun || isWhInfinitive) {
            const brackets = createBrackets('text-purple-600');
            container.insertBefore(brackets, container.firstChild);
            
            let labelText = '명사구';
            if (isGerundPhrase) labelText = '동명사';
            else if (isInfinitiveNoun) labelText = 'to부정사(명)';
            
            container.appendChild(createTopLabel(labelText, 'text-purple-600'));
          }
          // 형용사구 스타일 적용
          else if (isPresentParticiple || isPastParticiple || isPrepAdjPhrase || isInfinitiveAdj) {
            const brackets = createBrackets('text-yellow-500');
            container.insertBefore(brackets, container.firstChild);
            
            let labelText = '형용사구';
            if (isPresentParticiple) labelText = '현재분사';
            else if (isPastParticiple) labelText = '과거분사';
            else if (isPrepAdjPhrase) labelText = '전치사구';
            else if (isInfinitiveAdj) labelText = 'to부정사(형)';
            
            container.appendChild(createTopLabel(labelText, 'text-yellow-500'));
          }
          // 부사구 스타일 적용
          else if (isAdverbPhrase || isPrepAdvPhrase || isInfinitiveAdv) {
            const brackets = createBrackets('text-amber-800');
            container.insertBefore(brackets, container.firstChild);
            
            let labelText = '부사구';
            if (isPrepAdvPhrase) labelText = '전치사구(부)';
            else if (isInfinitiveAdv) labelText = 'to부정사(부)';
            
            container.appendChild(createTopLabel(labelText, 'text-amber-800'));
          }
          // 명사절 스타일 적용
          else if (isThatClause || isWhClause || isIfWhetherClause || isWhatClause) {
            const brackets = createBrackets('text-green-600', true);
            container.insertBefore(brackets, container.firstChild);
            
            let labelText = '명사절';
            if (isThatClause) labelText = '접속사that절';
            else if (isWhClause) labelText = '의문사절';
            
            container.appendChild(createTopLabel(labelText, 'text-green-600'));
          }
          // 형용사절 스타일 적용
          else if (isSubjectRelClause || isObjectRelClause || isRelAdvClause) {
            const brackets = createBrackets('text-purple-600', true);
            container.insertBefore(brackets, container.firstChild);
            
            let labelText = '관계대명사절';
            if (isRelAdvClause) labelText = '관계부사절(형)';
            
            container.appendChild(createTopLabel(labelText, 'text-purple-600'));
          }
          // 부사절 스타일 적용
          else if (isAdverbClause) {
            const brackets = createBrackets('text-red-600', true);
            container.insertBefore(brackets, container.firstChild);
            container.appendChild(createTopLabel('부사절', 'text-red-600'));
          }
          // 기타 단일 요소
          else if (isAdverb) {
            container.appendChild(createTopLabel('부사', 'text-amber-800'));
          } else if (isConjunction) {
            container.appendChild(createTopLabel('접속사', 'text-purple-600'));
          }
          
          // 밑줄이 필요한 성분만 추가
          if (isSubject || isDummySubject || isRealSubject || isLogicalSubject ||
              isVerb || isObject || isIndirectObject || isDirectObject ||
              isSubjectComplement || isObjectComplement) {
            underlineContainer.appendChild(underline);
          }
        });
        
        container.appendChild(textSpan);
        container.appendChild(underlineContainer);
        visualSentenceRef.current.appendChild(container);
        
        // 처리된 인덱스 표시
        processedIndices.add(currentIndex);
        currentIndex = shortestComponent.endIndex;
        continue;
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
        visualSentenceRef.current.appendChild(textNode);
        currentIndex = endOfPlainText;
      } else {
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
          className="p-4 bg-gray-100 rounded min-h-[120px] flex flex-wrap items-center mt-8 mb-8"
        />
        <div className="mt-10 pt-4 flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-blue-600 mr-2"></span>
            <span>주어 (S, (가)S, (진)S, (의)S)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-red-600 mr-2"></span>
            <span>동사 (V)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-green-600 mr-2"></span>
            <span>목적어 (O, IO, DO)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-indigo-600 mr-2"></span>
            <span>주격보어 (SC)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-indigo-600 mr-2"></span>
            <span>목적격보어 (OC)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-purple-600 mr-2 font-bold">(</span>
            <span>명사구</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-yellow-500 mr-2 font-bold">(</span>
            <span>형용사구</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-amber-800 mr-2 font-bold">(</span>
            <span>부사구</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-green-600 mr-2 font-bold">[</span>
            <span>명사절</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-purple-600 mr-2 font-bold">[</span>
            <span>형용사절</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-red-600 mr-2 font-bold">[</span>
            <span>부사절</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-amber-800 mr-2"></span>
            <span>부사</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-purple-600 mr-2"></span>
            <span>접속사</span>
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